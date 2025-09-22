import { appTag, NostrKeyPair } from "@/Api/nostrHandler";
import { decodeNprofile, getDeviceId } from "@/constants";
import { PayTo, SourceTrustLevel, SpendFrom } from "@/globalTypes";
import { identifyBitcoinInput, parseBitcoinInput } from "@/lib/parse";
import { InputClassification } from "@/lib/types/parse";
import { IdentityNostrApi } from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { fetchNip78Event } from "@/State/identitiesRegistry/helpers/nostr";
import { LwwFlag } from "@/State/scoped/backups/lww";
import { SourceDocV0 } from "@/State/scoped/backups/sources/schema";
import { SourceType } from "@/State/scoped/common";
import { findReducerMerger } from "@/State/store/store";
import { GeneralShard, ShardsTagsRecord } from "@/State/types";
import { utils } from "nostr-tools";



export type SourceToMigrate = SpendFrom | PayTo;
export async function getRemoteMigratedSources(ext: IdentityNostrApi, localSources: SourceToMigrate[] = []) {

	const remoteSources = await getSourcesFromLegacyRemoteBackup(ext);
	console.log({ remoteSources })
	localSources.push(...remoteSources);

	// migration all to source docs and dedupe
	const docs = await migrateSourcesToDocs(localSources);

	console.log({ docs })
	const out = docs.reduce((acc: Record<string, SourceDocV0>, s) => {
		if (acc[s.source_id]) return acc;
		acc[s.source_id] = s;
		return acc;
	}, {})
	const sourceDocs = Object.values(out);
	return sourceDocs
}


/* Fetch legacy backups and return sources */
export async function getSourcesFromLegacyRemoteBackup(ext: IdentityNostrApi): Promise<SourceToMigrate[]> {

	const sources: SourceToMigrate[] = []; // we accumulate sources here


	const decrypted = await fetchNip78Event(ext, appTag);
	if (!decrypted) { // note remote backup
		return sources;
	}


	const data = JSON.parse(decrypted);


	if (data.tags) { // It's the recent sharded backups
		console.log("sharded backup found", data.tags)
		const { dtags } = data as ShardsTagsRecord;
		const shards: GeneralShard[] = await Promise.all(dtags.map(async tag => {
			const shard = await fetchNip78Event(ext, tag);
			if (!shard) {
				throw new Error("Unexpected shard missing");
			}
			return JSON.parse(shard);
		}));
		for (const shard of shards) {
			if (shard.kind === "paySource" || shard.kind === "spendSource") {
				sources.push(shard.source)
			}

		}
	} else { // It's the legacy backups
		console.log("legacy backup", data)
		for (const key in data) {
			if (!["payTo", "spendFrom"].includes(key)) continue;

			const merger = findReducerMerger(key)
			if (!merger) {
				continue
			}

			const serialRemote = data[key] as string
			const serialLocal = localStorage.getItem(key)
			let newItem = "";
			if (!serialLocal) {
				newItem = serialRemote
			} else {
				const { data: mergeResult, } = merger(serialLocal, serialRemote);
				newItem = mergeResult;
			}
			console.log("here legacy backup sources", JSON.parse(newItem).sources)
			sources.push(...JSON.parse(newItem).sources);
		}
	}

	return sources;
}


type Shared = {
	id: string;
	label: string;
	pasteField: string;
	icon: string;
	option: SourceTrustLevel;
	keys: NostrKeyPair;
	pubSource?: boolean;
	disconnected?: boolean;
};


type FromOnly = {
	balance?: string;
	maxWithdrawable?: string;
	disabled?: string;
	adminToken?: string;
	ndebit?: string;
};


type ToOnly = {
	vanityName?: string;
	bridgeUrl?: string;
	isNdebitDiscoverable?: boolean;
};



export type SourceUnified = Shared & FromOnly & ToOnly;

const isSpendFrom = (x: SpendFrom | PayTo): x is SpendFrom =>
	(x as SpendFrom).balance !== undefined || (x as SpendFrom).maxWithdrawable !== undefined;


const migrateSourcesToDocs = async (sources: SourceToMigrate[]): Promise<SourceDocV0[]> => {
	const docs: SourceDocV0[] = [];
	const deviceId = getDeviceId();
	console.log({ sources })

	// process pubSources
	const items = sources.filter(s => s.pubSource || s.pasteField.startsWith("nprofile"));
	const byId = new Map<string, { from?: SpendFrom; to?: PayTo }>();

	for (const it of items) {
		const bucket = byId.get(it.id) ?? {};
		if (isSpendFrom(it)) bucket.from = it; else bucket.to = it;
		byId.set(it.id, bucket);
	}

	const out: SourceUnified[] = [];
	for (const [id, { from, to }] of byId) {
		if (!from && !to) continue;

		const pick = <K extends keyof Shared>(k: K): Shared[K] => {
			// prefer from’s value if defined, else to’s
			return (from as any)?.[k] ?? (to as any)?.[k];
		};

		const unified: SourceUnified = {
			id,
			label: pick("label"),
			pasteField: pick("pasteField"),
			icon: pick("icon"),
			option: pick("option"),
			keys: pick("keys"),
			pubSource: pick("pubSource"),
			disconnected: pick("disconnected"),

			// from-only
			balance: from?.balance,
			maxWithdrawable: from?.maxWithdrawable,
			disabled: from?.disabled,
			adminToken: from?.adminToken,
			ndebit: from?.ndebit,

			// to-only
			vanityName: to?.vanityName,
			bridgeUrl: to?.bridgeUrl,
			isNdebitDiscoverable: to?.isNdebitDiscoverable,
		};
		out.push(unified);
	}



	const nprofileDocs = out.map((s) => {
		const profilePointer = decodeNprofile(s.pasteField)
		const relays = profilePointer.relays || [];
		const relaysFlags: Record<string, LwwFlag> = {};
		relays.forEach(r => {
			relaysFlags[utils.normalizeURL(r)] = { clock: { v: 0, by: deviceId }, present: true }
		})
		const doc: SourceDocV0 = {
			doc_type: "doc/shockwallet/source",
			schema_rev: 0,
			source_id: s.id,
			label: { clock: { v: 0, by: deviceId }, value: s.label },
			deleted: { clock: { v: 0, by: deviceId }, value: false },
			created_at: Date.now(),
			type: SourceType.NPROFILE_SOURCE,
			lpk: profilePointer.pubkey,
			keys: s.keys,
			is_ndebit_discoverable: { clock: { v: 0, by: deviceId }, value: !!s.isNdebitDiscoverable },
			admin_token: { clock: { v: 0, by: deviceId }, value: s.adminToken || null },
			relays: relaysFlags,
		}

		return doc;
	});
	docs.push(...nprofileDocs);



	// Process other sources (ln and lnurp; lnurlw are dropped)
	const otherSources = sources.filter(s => !s.pubSource && !s.pasteField.startsWith("nprofile"));
	for (const s of otherSources) {
		const inputClassification = identifyBitcoinInput(s.pasteField);
		switch (inputClassification) {
			case InputClassification.LN_ADDRESS:
				docs.push({
					doc_type: "doc/shockwallet/source",
					schema_rev: 0,
					source_id: s.id,
					label: { clock: { v: 0, by: deviceId }, value: s.label },
					deleted: { clock: { v: 0, by: deviceId }, value: false },
					created_at: Date.now(),
					type: SourceType.LIGHTNING_ADDRESS_SOURCE,
				});
				break;
			case InputClassification.LNURL_PAY: {
				const parsed = await parseBitcoinInput(s.pasteField, inputClassification).catch(() => null);
				if (!parsed || parsed.type !== InputClassification.LNURL_PAY) continue;
				docs.push({
					doc_type: "doc/shockwallet/source",
					schema_rev: 0,
					source_id: s.id,
					label: { clock: { v: 0, by: deviceId }, value: s.label },
					deleted: { clock: { v: 0, by: deviceId }, value: false },
					created_at: Date.now(),
					type: SourceType.LNURL_P_SOURCE,
				})
				break;
			}
			default:
				continue;
		}
	}

	return docs;
}
