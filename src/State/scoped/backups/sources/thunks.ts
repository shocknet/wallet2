import { AppThunk } from "@/State/store/store"
import { docsSelectors, sourcesActions } from "./slice"
import { identityActions, selectFavoriteSourceId } from "../identity/slice"
import { SourceDocV0 } from "./schema"
import { LwwFlag, newflag, newLww } from "../lww"

import { decodeNprofile, getDeviceId } from "@/constants"
import { utils } from "nostr-tools"
import { SourceType } from "../../common"
import { generateNewKeyPair } from "@/Api/helpers"
import { identifyBitcoinInput, parseBitcoinInput } from "@/lib/parse"
import { InputClassification } from "@/lib/types/parse"
import { getSourceDocDtag } from "@/State/identitiesRegistry/helpers/processDocs"
import { selectActiveIdentityId } from "@/State/identitiesRegistry/slice"



export const addSource = (input: string, label?: string): AppThunk<Promise<void>> => async (dispatch, getState) => {
	const deviceId = getDeviceId();
	const now = Date.now();


	const baseDraft: Pick<
		SourceDocV0,
		"doc_type" | "schema_rev" | "label" | "deleted" | "created_at"
	> = {
		doc_type: "doc/shockwallet/source",
		schema_rev: 0,
		label: newLww(label ?? "New Source", deviceId),
		deleted: newLww(false, deviceId),
		created_at: now,
	};

	let fullDraft: SourceDocV0 | null = null;


	if (input.startsWith("nprofile")) {
		const data = decodeNprofile(input);
		const { pubkey: lpk, relays = [] } = data;

		if (!relays.length) {
			throw new Error("This nprofile has no relays");
		}



		const relayMap: Record<string, LwwFlag> = {};
		for (const r of relays) {
			const u = utils.normalizeURL(r);
			if (!u.startsWith("ws")) continue;
			relayMap[u] = newflag(true, deviceId);
		}

		const keyPair = generateNewKeyPair();
		const id = `${lpk}-${keyPair.publicKey}`;

		fullDraft = {
			...baseDraft,
			type: SourceType.NPROFILE_SOURCE,
			source_id: id,
			keys: keyPair,
			lpk: lpk,
			relays: relayMap,
			is_ndebit_discoverable: newLww(false, deviceId),
			admin_token: newLww(null, deviceId),
		};
	} else {
		const inputClassification = identifyBitcoinInput(input);
		switch (inputClassification) {
			case InputClassification.LN_ADDRESS:
				fullDraft = {
					...baseDraft,
					type: SourceType.LIGHTNING_ADDRESS_SOURCE,
					source_id: input.toLowerCase(),
				};
				break;
			case InputClassification.LNURL_PAY: {
				const parsed = await parseBitcoinInput(input, inputClassification);
				if (!parsed || parsed.type !== InputClassification.LNURL_PAY) {
					throw new Error("Unidentified or unsupported source");
				}
				fullDraft = {
					...baseDraft,
					type: SourceType.LNURL_P_SOURCE,
					source_id: input,
				};
				break;
			}
			default:
				throw new Error("Unidentified input");
		}

	}

	dispatch(sourcesActions._createDraftDoc({ sourceId: fullDraft.source_id, draft: fullDraft }));

	// Add this new source dod's dtag to the identity doc's sources list
	const IdentityPubkey = selectActiveIdentityId(getState())!
	const newSourceDocTag = await getSourceDocDtag(IdentityPubkey, fullDraft.source_id)
	dispatch(identityActions.addSourceDocDTag({ sourceId: newSourceDocTag }));

	// Set this source as favorite source if no other sources exist
	if (docsSelectors.selectIds(getState()).length === 1) {
		dispatch(identityActions.setFavoriteSource({ sourceId: fullDraft.source_id, by: deviceId }));
	}

}




export const removeSource = (sourceId: string): AppThunk<void> => async (dispatch, getState) => {
	const deviceId = getDeviceId();

	const source = docsSelectors.selectById(getState(), sourceId);
	if (!source) {
		return;
	}

	dispatch(sourcesActions.markDeleted({ sourceId, by: deviceId }));

	const favoriteSourceId = selectFavoriteSourceId(getState());
	const sourceIds = docsSelectors.selectIds(getState());

	if (favoriteSourceId === sourceId && sourceIds.length !== 0) {
		dispatch(identityActions.setFavoriteSource({ sourceId: sourceIds[0], by: deviceId }));
	}


}


