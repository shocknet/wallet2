import { AppThunk } from "@/State/store/store"
import { docsSelectors, sourcesActions } from "./slice"
import { identityActions, selectFavoriteSourceId } from "../identity/slice"
import { SourceDocV0 } from "./schema"
import { LwwFlag, newflag, newLww } from "../lww"
import { getDeviceId, NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from "@/constants"
import { SourceType } from "../../common"
import { generateNewKeyPair } from "@/Api/helpers"
import { selectNprofileViewsByLpk } from "./selectors"
import { getNostrClient } from "@/Api/nostr"
import { utils } from "nostr-tools"


export type NProfileSourceToAdd = {
	lpk: string;
	label?: string;
	relays: string[];
	bridgeUrl: string | null;
	adminEnrollToken?: string;
	inviteToken?: string;
	integrationData?: {
		token: string
		lnAddress: string
	}
}

export type LightningAddressSourceToAdd = {
	lightningAddress: string;
	label: string | null;
}



export const addBootstrapSource = (): AppThunk<Promise<void>> => async (dispatch) => {
	const deviceId = getDeviceId();
	const keyPair = generateNewKeyPair()
	const id = `${NOSTR_PUB_DESTINATION}-${keyPair.publicKey}`;
	const relaysFlags: Record<string, LwwFlag> = {};
	NOSTR_RELAYS.forEach(r => {
		relaysFlags[utils.normalizeURL(r)] = { clock: { v: 0, by: deviceId }, present: true }
	})
	const bootstrapSource: SourceDocV0 = {
		type: SourceType.NPROFILE_SOURCE,
		doc_type: "doc/shockwallet/source_",
		source_id: id,
		schema_rev: 0,
		created_at: Date.now(),
		lpk: NOSTR_PUB_DESTINATION,
		label: newLww("Bootstrap Node", deviceId),
		relays: relaysFlags,
		deleted: newLww(false, deviceId),
		keys: keyPair,
		admin_token: newLww(null, deviceId),
		is_ndebit_discoverable: newLww(false, deviceId),
		bridgeUrl: newLww(null, deviceId)
	}

	dispatch(sourcesActions._createDraftDoc({ sourceId: bootstrapSource.source_id, draft: bootstrapSource }));
	await dispatch(onAddSourceDoc(bootstrapSource));
}
export const onAddSourceDoc = (sourceDoc: SourceDocV0): AppThunk<Promise<void>> => async (dispatch, getState) => {
	const deviceId = getDeviceId();


	// Set this source as favorite source if no other sources exist
	if (docsSelectors.selectIds(getState()).length === 1) {
		dispatch(identityActions.setFavoriteSource({ sourceId: sourceDoc.source_id, by: deviceId }));
	}
}
export const addNprofileSource = ({
	lpk,
	label,
	relays,
	bridgeUrl,
	adminEnrollToken,
	integrationData,
	inviteToken
}: NProfileSourceToAdd): AppThunk<Promise<string>> => async (dispatch, getState) => {
	const deviceId = getDeviceId();


	if (adminEnrollToken) {
		const existingSourcesForLpk = selectNprofileViewsByLpk(getState(), lpk);

		if (existingSourcesForLpk.length > 0) {
			const existingSource = existingSourcesForLpk[0];

			if (existingSource.adminToken !== adminEnrollToken) {
				console.log("resetting admin access to existing source")
				const client = await getNostrClient({ pubkey: lpk, relays: relays }, existingSource.keys);
				const res = await client.EnrollAdminToken({ admin_token: adminEnrollToken });
				if (res.status !== "OK") {
					throw new Error("Error enrolling admin token " + res.reason);
				}
				dispatch(sourcesActions.updateAdminToken({ sourceId: existingSource.sourceId, adminToken: adminEnrollToken, by: deviceId }));

				return `successufly linked admin access to ${lpk}`;
			}


		}
	}


	const keyPair = generateNewKeyPair();
	const id = `${lpk}-${keyPair.publicKey}`;


	let vanityName: string | undefined = undefined;
	console.log("checking for integration data")
	// integration to an existing pub account
	if (integrationData) {
		console.log("linking to existing account")
		const res = await (await getNostrClient({ pubkey: lpk, relays: relays }, keyPair))
			.LinkNPubThroughToken({
				token: integrationData.token,
			});

		if (res.status !== "OK") {
			throw new Error("Error using integration token  " + res.reason);
		}
		vanityName = integrationData.lnAddress;
	}

	console.log("checking for invite token")
	if (inviteToken) {
		console.log("using invite token")
		const res = await (await getNostrClient({ pubkey: lpk, relays: relays }, keyPair))
			.UseInviteLink({ invite_token: inviteToken })
		if (res.status !== "OK") {
			throw new Error("Error using invitation token " + res.reason);
		}
	}

	console.log("checking for admin token")
	if (adminEnrollToken) {
		console.log("enrolling admin token")
		const client = await getNostrClient({ pubkey: lpk, relays: relays }, keyPair);
		const res = await client.EnrollAdminToken({ admin_token: adminEnrollToken });
		if (res.status !== "OK") {
			throw new Error("Error enrolling admin token " + res.reason);
		}
	}




	const relayMap: Record<string, LwwFlag> = {};
	for (const r of relays) {

		relayMap[r] = newflag(true, deviceId);
	}

	const sourceDoc: SourceDocV0 = {

		doc_type: "doc/shockwallet/source_",
		schema_rev: 0,
		label: newLww(label || null, deviceId),
		deleted: newLww(false, deviceId),
		created_at: Date.now(),
		type: SourceType.NPROFILE_SOURCE,
		source_id: id,
		keys: keyPair,
		lpk: lpk,
		relays: relayMap,
		is_ndebit_discoverable: newLww(false, deviceId),
		admin_token: newLww(adminEnrollToken ?? null, deviceId),
		bridgeUrl: newLww(bridgeUrl ?? null, deviceId)
	};

	dispatch(sourcesActions._createDraftDoc({ sourceId: sourceDoc.source_id, draft: sourceDoc }));

	dispatch(onAddSourceDoc(sourceDoc));

	if (vanityName) {
		dispatch(sourcesActions.setVanityName({ sourceId: sourceDoc.source_id, vanityName: vanityName }))
	}

	return "Successfuly added pub source";
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
}


