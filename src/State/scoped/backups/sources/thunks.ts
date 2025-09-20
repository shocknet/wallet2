import { AppThunk } from "@/State/store/store"
import { sourcesActions } from "./slice"
import { identityActions as identityDocActions } from "../identity/slice"
import { SourceDocV0, SourceType } from "./schema"
import { newFlag, newLww } from "../lww"
import { sourceAdded } from "./slice"
import { decodeNprofile } from "@/constants"
import { utils } from "nostr-tools"



const writerId = () => "device";
const nowMs = () => Date.now();



const isLightningAddress = (s: string) =>
	/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

const isLnurlPay = (s: string) => {
	const v = s.toLowerCase();
	return v.startsWith("lnurl1") || v.startsWith("https://") || v.startsWith("http://");
};



export const addSource =
	(input: string, label?: string): AppThunk<void> =>
		async (dispatch, getState) => {
			const by = writerId();
			const now = nowMs();


			const baseDraft: Pick<
				SourceDocV0,
				"doc_type" | "schema_rev" | "label" | "deleted" | "created_at"
			> = {
				doc_type: "doc/shockwallet/source",
				schema_rev: 0,
				label: newLww(by, label ?? "New Source"),
				deleted: newLww(by, false),
				created_at: now,
			};

			let fullDraft: SourceDocV0 | null = null;


			if (input.startsWith("nprofile")) {
				const data = decodeNprofile(input);
				const { pubkey, relays = [] } = data;

				if (!relays.length) {
					throw new Error("This nprofile has no relays");
				}


				const reg = getState().identitiesRegistry;
				const active = reg.activePubkey ? reg.entities[reg.activePubkey] : null;
				if (!active || active.type !== "LOCAL_KEYS_IDENTITY") {

					throw new Error("A local-keys identity must be active to add an nprofile source");
				}


				const relayMap: SourceDocV0["relays"] = {};
				for (const r of relays) {
					const u = utils.normalizeURL(r);
					if (!u.startsWith("wss://")) continue;
					relayMap[u] = newFlag(by, true);
				}

				fullDraft = {
					...baseDraft,
					type: SourceType.NPROFILE_SOURCE,
					source_id: pubkey,
					keys: {
						publicKey: active.pubkey,
						privateKey: active.privkey,
					},
					relays: relayMap,
					is_ndebit_discoverable: newLww(by, false),
					admin_token: newLww(by, null),
				};
			}

			else if (isLightningAddress(input)) {
				fullDraft = {
					...baseDraft,
					type: SourceType.LIGHTNING_ADDRESS_SOURCE,
					source_id: input.toLowerCase(),
				};
			}

			else if (isLnurlPay(input)) {
				fullDraft = {
					...baseDraft,
					type: SourceType.LNURL_P_SOURCE,
					source_id: input,
				};
			} else {
				throw new Error("Unrecognized source format. Expect nprofile / LNURL / Lightning Address");
			}


			const existing = getState().scoped?.sources?.entities[fullDraft.source_id];
			if (!existing) {

				dispatch(sourcesActions._createDraftDoc({ draft: fullDraft }));
			}


			dispatch(
				identityDocActions._setMembership({
					by,
					now,
					sourceId: fullDraft.source_id,
					present: true,
				})
			);


			dispatch(sourceAdded({ sourceId: fullDraft.source_id }));
		};
