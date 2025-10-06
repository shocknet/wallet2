import { AppThunk } from "@/State/store/store"
import { docsSelectors, sourcesActions } from "./slice"
import { identityActions, selectFavoriteSourceId } from "../identity/slice"
import { SourceDocV0 } from "./schema"
import { LwwFlag, newflag, newLww } from "../lww"
import { getDeviceId } from "@/constants"
import { SourceType } from "../../common"
import { generateNewKeyPair } from "@/Api/helpers"
import { getSourceDocDtag } from "@/State/identitiesRegistry/helpers/processDocs"
import { selectActiveIdentityId } from "@/State/identitiesRegistry/slice"


export type NProfileSourceToAdd = {
	lpk: string;
	label: string | null;
	relays: string[];
	bridgeUrl: string | null;
	adminToken: string | null;
}

export type LightningAddressSourceToAdd = {
	lightningAddress: string;
	label: string | null;
}


export const onAddSourceDoc = (sourceDoc: SourceDocV0): AppThunk<Promise<void>> => async (dispatch, getState) => {
	const deviceId = getDeviceId();
	// Add this new source dod's dtag to the identity doc's sources list
	const IdentityPubkey = selectActiveIdentityId(getState())!
	const newSourceDocTag = await getSourceDocDtag(IdentityPubkey, sourceDoc.source_id)
	dispatch(identityActions.addSourceDocDTag({ sourceId: newSourceDocTag }));

	// Set this source as favorite source if no other sources exist
	if (docsSelectors.selectIds(getState()).length === 1) {
		dispatch(identityActions.setFavoriteSource({ sourceId: sourceDoc.source_id, by: deviceId }));
	}
}
export const addNprofileSource = ({ lpk, label, relays, bridgeUrl, adminToken }: NProfileSourceToAdd): AppThunk<Promise<void>> => async (dispatch) => {
	const deviceId = getDeviceId();
	const keyPair = generateNewKeyPair();
	const id = `${lpk}-${keyPair.publicKey}`;

	const relayMap: Record<string, LwwFlag> = {};
	for (const r of relays) {

		relayMap[r] = newflag(true, deviceId);
	}

	const sourceDoc: SourceDocV0 = {

		doc_type: "doc/shockwallet/source_",
		schema_rev: 0,
		label: newLww(label, deviceId),
		deleted: newLww(false, deviceId),
		created_at: Date.now(),
		type: SourceType.NPROFILE_SOURCE,
		source_id: id,
		keys: keyPair,
		lpk: lpk,
		relays: relayMap,
		is_ndebit_discoverable: newLww(false, deviceId),
		admin_token: newLww(adminToken ?? null, deviceId),
		bridgeUrl: newLww(bridgeUrl ?? null, deviceId)
	};

	dispatch(sourcesActions._createDraftDoc({ sourceId: sourceDoc.source_id, draft: sourceDoc }));

	dispatch(onAddSourceDoc(sourceDoc));
}



export const addLightningAddressSource = ({ lightningAddress, label }: LightningAddressSourceToAdd): AppThunk<Promise<void>> =>
	async (dispatch, getState) => {
		const deviceId = getDeviceId();

		const existing = docsSelectors.selectById(getState(), lightningAddress);

		if (existing) throw new Error("This Lightning Address already exists");

		const sourceDoc: SourceDocV0 = {
			doc_type: "doc/shockwallet/source_",
			schema_rev: 0,
			label: newLww(label, deviceId),
			deleted: newLww(false, deviceId),
			created_at: Date.now(),
			type: SourceType.LIGHTNING_ADDRESS_SOURCE,
			source_id: lightningAddress
		};

		dispatch(sourcesActions._createDraftDoc({ sourceId: sourceDoc.source_id, draft: sourceDoc }));

		dispatch(onAddSourceDoc(sourceDoc));
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


