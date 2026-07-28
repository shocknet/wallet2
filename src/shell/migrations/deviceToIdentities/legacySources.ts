import { appTag } from "@/Api/nostrHandler";
import { decodeNprofile, getDeviceId } from "@/constants";
import { normalizeWsUrl } from "@/lib/url";
import { IdentityNostrApi } from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { fetchNip78Event } from "@/State/identitiesRegistry/helpers/nostr";
import { LwwFlag } from "@/State/sync/lww";
import { SourceDocV0 } from "@/State/scoped/backups/sources/schema";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { docsSelectors } from "@/State/scoped/backups/sources/slice";
import type { AppThunkDispatch, RootState } from "@/State/store/store";
import { findReducerMerger } from "@/State/store/store";
import {
	applyMigrations,
	getStateAndVersion,
	type MigrationFunction,
} from "@/State/Slices/migrations";
import {
	migrations as paySourceMigrations,
	storageKey as paySourceStorageKey,
} from "@/State/Slices/paySourcesSlice";
import {
	migrations as spendSourceMigrations,
	storageKey as spendSourceStorageKey,
} from "@/State/Slices/spendSourcesSlice";
import {
	classifyLegacyRemoteBackupRoot,
	collectLegacySourcesFromSlice,
	parseLegacyEmbeddedBackupPayload,
	parseLegacyJsonString,
	parseLegacyMigrationSourceShard,
	parseLegacyPayTo,
	parseLegacySpendFrom,
	parseLegacySourceSliceEnvelope,
	type SourceToMigrate,
} from "./legacySourceSchema";

export type { SourceToMigrate } from "./legacySourceSchema";

const emptyPaySourceState = { sources: {}, order: [] as string[] };
const emptySpendSourceState = { sources: {}, order: [] as string[] };

function readMigratedLegacySliceState<T>(
	storageKey: string,
	defaultState: T,
	migrations: Record<number, MigrationFunction<T>>
): T {
	const stored = localStorage.getItem(storageKey);
	if (!stored) {
		return defaultState;
	}

	const { state, version } = getStateAndVersion(stored);
	return applyMigrations(state, version, migrations);
}

function collectLegacySourcesFromMigratedSlice(
	slice: "payTo" | "spendFrom",
	rawState: unknown
): SourceToMigrate[] {
	const envelope = parseLegacySourceSliceEnvelope(rawState);
	if (!envelope.ok) {
		return [];
	}

	const { sources } = collectLegacySourcesFromSlice(slice, envelope.value);
	return sources;
}

function collectLegacySourcesFromLocalSlice(slice: "payTo" | "spendFrom"): SourceToMigrate[] {
	const storageKey = slice === "payTo" ? paySourceStorageKey : spendSourceStorageKey;
	const emptyState = slice === "payTo" ? emptyPaySourceState : emptySpendSourceState;
	const migrations = slice === "payTo" ? paySourceMigrations : spendSourceMigrations;

	try {
		const state = readMigratedLegacySliceState(storageKey, emptyState, migrations);
		return collectLegacySourcesFromMigratedSlice(slice, state);
	} catch {
		return [];
	}
}

export function collectLocalLegacySources(): SourceToMigrate[] {
	return [
		...collectLegacySourcesFromLocalSlice("payTo"),
		...collectLegacySourcesFromLocalSlice("spendFrom"),
	];
}

function collectLegacySourcesFromMergedSerial(
	slice: "payTo" | "spendFrom",
	serialRemote: string,
	serialLocal: string | null
): SourceToMigrate[] {
	const merger = findReducerMerger(slice);
	if (!merger) {
		return [];
	}

	let mergedSerial = serialRemote;
	if (serialLocal) {
		try {
			const { data: mergeResult } = merger(serialLocal, serialRemote);
			mergedSerial = mergeResult;
		} catch {
			return [];
		}
	}

	try {
		const { state, version } = getStateAndVersion(mergedSerial);
		const migrations = slice === "payTo" ? paySourceMigrations : spendSourceMigrations;
		const migratedState = applyMigrations(state, version, migrations);
		return collectLegacySourcesFromMigratedSlice(slice, migratedState);
	} catch {
		return [];
	}
}

function collectLegacySourcesFromShard(
	rawShard: unknown,
	shardTag: string
): SourceToMigrate[] {
	const shard = parseLegacyMigrationSourceShard(rawShard);
	if (shard.kind !== "source") {
		return [];
	}

	const { slice, source } = shard;
	const recordKey =
		source && typeof source === "object" && typeof (source as { id?: unknown }).id === "string"
			? (source as { id: string }).id
			: shardTag;

	const parsed =
		slice === "payTo"
			? parseLegacyPayTo(recordKey, source)
			: parseLegacySpendFrom(recordKey, source);

	return parsed.ok ? [parsed.source] : [];
}

function collectLegacySourcesFromFileOrRemotePayload(
	data: Record<string, unknown>
): SourceToMigrate[] {
	const sources: SourceToMigrate[] = [];

	for (const key of ["payTo", "spendFrom"] as const) {
		if (!(key in data)) {
			continue;
		}

		const serialRemote = data[key];
		if (typeof serialRemote !== "string") {
			continue;
		}

		const collected = collectLegacySourcesFromMergedSerial(key, serialRemote, localStorage.getItem(key));
		sources.push(...collected);
	}

	return sources;
}

export async function getRemoteMigratedSources(ext?: IdentityNostrApi, localSources: SourceToMigrate[] = []) {
	const remoteSources = ext ? await getSourcesFromLegacyRemoteBackup(ext) : [];
	const docs = migrateLegacySourcesToDocs([...localSources, ...remoteSources]);
	return docs;
}


/* Fetch legacy backups and return sources */
export async function getSourcesFromLegacyRemoteBackup(ext: IdentityNostrApi): Promise<SourceToMigrate[]> {
	const sources: SourceToMigrate[] = [];

	const decrypted = await fetchNip78Event(ext, appTag);
	if (!decrypted) {
		return sources;
	}

	const parsedRoot = parseLegacyJsonString(decrypted);
	if (!parsedRoot.ok) {
		return sources;
	}

	const classified = classifyLegacyRemoteBackupRoot(parsedRoot.source);
	if (classified.kind === "invalid") {
		return sources;
	}

	if (classified.kind === "sharded") {
		for (const tag of classified.dtags) {
			if (typeof tag !== "string" || !tag) {
				continue;
			}

			const shardContent = await fetchNip78Event(ext, tag);
			if (!shardContent) {
				continue;
			}

			const parsedShard = parseLegacyJsonString(shardContent);
			if (!parsedShard.ok) {
				continue;
			}

			sources.push(...collectLegacySourcesFromShard(parsedShard.source, tag));
		}
	} else {
		sources.push(...collectLegacySourcesFromFileOrRemotePayload(classified.data));
	}

	return sources;
}


export function getSourcesFromLegacyFileBackup(data: unknown): SourceToMigrate[] {
	const payload = parseLegacyEmbeddedBackupPayload(data);
	if (!payload.ok) {
		return [];
	}

	return collectLegacySourcesFromFileOrRemotePayload(payload.source);
}


export type MigratedSourceDoc = SourceDocV0 & { vanity_name?: string };

export function migrateLegacySourcesToDocs(sources: SourceToMigrate[]): MigratedSourceDoc[] {
	const docs: MigratedSourceDoc[] = [];
	const deviceId = getDeviceId();

	const byId = new Map<string, { payTo?: SourceToMigrate; spendFrom?: SourceToMigrate }>();

	for (const item of sources) {
		const bucket = byId.get(item.id) ?? {};
		if (item.slice === "spendFrom") {
			bucket.spendFrom = item;
		} else {
			bucket.payTo = item;
		}
		byId.set(item.id, bucket);
	}

	for (const [id, { payTo, spendFrom }] of byId) {
		const pasteField = payTo?.pasteField ?? spendFrom?.pasteField;
		const keys = payTo?.keys ?? spendFrom?.keys;
		if (!pasteField || !keys) {
			continue;
		}

		const profilePointer = decodeNprofile(pasteField);
		const relays = profilePointer.relays || [];
		const relaysFlags: Record<string, LwwFlag> = {};
		for (const relay of relays) {
			relaysFlags[normalizeWsUrl(relay)] = { clock: { v: 0, by: deviceId }, present: true };
		}

		docs.push({
			doc_type: "doc/shockwallet/source_",
			schema_rev: 0,
			source_id: id,
			label: {
				clock: { v: 0, by: deviceId },
				value: payTo?.label ?? spendFrom?.label ?? null,
			},
			deleted: { clock: { v: 0, by: deviceId }, value: false },
			created_at: Date.now(),
			type: SourceType.NPROFILE_SOURCE,
			lpk: profilePointer.pubkey,
			keys,
			is_ndebit_discoverable: {
				clock: { v: 0, by: deviceId },
				value: !!payTo?.isNdebitDiscoverable,
			},
			admin_token: { clock: { v: 0, by: deviceId }, value: spendFrom?.adminToken ?? null },
			relays: relaysFlags,
			bridgeUrl: { clock: { v: 0, by: deviceId }, value: payTo?.bridgeUrl ?? null },
			vanity_name: payTo?.vanityName,
		});
	}

	const deduped = new Map<string, MigratedSourceDoc>();
	for (const doc of docs) {
		if (!deduped.has(doc.source_id)) {
			deduped.set(doc.source_id, doc);
		}
	}

	return [...deduped.values()];
}

export function applyMigratedSourceDocs(
	dispatch: AppThunkDispatch,
	docs: MigratedSourceDoc[],
): void {
	for (const sourceDoc of docs) {
		const { vanity_name, ...source } = sourceDoc;

		dispatch(sourcesActions._createDraftDoc({ sourceId: source.source_id, draft: source }));

		if (vanity_name && source.type === SourceType.NPROFILE_SOURCE) {
			dispatch(sourcesActions.setVanityName({ sourceId: source.source_id, vanityName: vanity_name }));
		}
	}
}

export function applyLocalLegacySourcesIfMissing(
	dispatch: AppThunkDispatch,
	getState: () => RootState,
	localSources: SourceToMigrate[],
): void {
	if (!localSources.length) {
		return;
	}

	const existingSourceIds = new Set(docsSelectors.selectIds(getState()));
	const docs = migrateLegacySourcesToDocs(localSources).filter(
		(doc) => !existingSourceIds.has(doc.source_id),
	);

	applyMigratedSourceDocs(dispatch, docs);
}
