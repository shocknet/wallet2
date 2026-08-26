import { AppThunk } from "@/State/store/store"
import { docsSelectors, sourcesActions } from "./slice"
import { identityActions } from "@/State/scoped/backups/identity/slice"
import { SourceDocV0, SourceType } from "./schema"
import { LwwFlag, newflag, newLww } from "../../../sync/lww"
import { getDeviceId, NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from "@/constants"
import { generateNewKeyPair } from "@/Api/helpers"
import { selectSourceViewsByLpk } from "./selectors"
import { getNostrClient } from "@/Api/nostr"
import type { NostrKeyPair } from "@/Api/nostrHandler"
import { normalizeWsUrl } from "@/lib/url"


export type AddSourceArgs = {
	lpk: string;
	relays: string[];
	keys: NostrKeyPair;
	label?: string | null;
	bridgeUrl?: string | null;
	adminToken?: string | null;
	vanityName?: string;
};

type NprofileConnection = {
	lpk: string;
	relays: string[];
	label?: string;
	bridgeUrl?: string | null;
};

function requireRelays(relays: string[]) {
	if (relays.length === 0) {
		throw new Error("This nprofile has no relays");
	}
}




export const addSource = ({
	lpk,
	relays,
	keys,
	label,
	bridgeUrl,
	adminToken,
	vanityName,
}: AddSourceArgs): AppThunk<void> => (dispatch) => {
	requireRelays(relays);
	const deviceId = getDeviceId();
	const sourceId = `${lpk}-${keys.publicKey}`;

	const relayMap: Record<string, LwwFlag> = {};
	for (const r of relays) {
		relayMap[normalizeWsUrl(r)] = newflag(true, deviceId);
	}

	const sourceDoc: SourceDocV0 = {
		doc_type: "doc/shockwallet/source_",
		schema_rev: 0,
		label: newLww(label ?? null, deviceId),
		deleted: newLww(false, deviceId),
		created_at: Date.now(),
		type: SourceType.NPROFILE_SOURCE,
		source_id: sourceId,
		keys,
		lpk,
		relays: relayMap,
		is_ndebit_discoverable: newLww(false, deviceId),
		admin_token: newLww(adminToken ?? null, deviceId),
		bridgeUrl: newLww(bridgeUrl ?? null, deviceId),
	};

	dispatch(sourcesActions._createDraftDoc({ sourceId, draft: sourceDoc }));
	dispatch(onAddSourceDoc(sourceDoc));

	if (vanityName) {
		dispatch(sourcesActions.setVanityName({ sourceId, vanityName }));
	}

	return sourceId;
}

export const onAddSourceDoc = (sourceDoc: SourceDocV0): AppThunk<Promise<void>> => async (dispatch, getState) => {
	const deviceId = getDeviceId();

	if (docsSelectors.selectIds(getState()).length === 1) {
		dispatch(identityActions.setFavoriteSource({ sourceId: sourceDoc.source_id, by: deviceId }));
	}
}

export const addNprofileSource = ({
	lpk,
	relays,
	label,
	bridgeUrl,
}: NprofileConnection): AppThunk<void> => (dispatch) => {
	dispatch(addSource({
		lpk,
		relays,
		keys: generateNewKeyPair(),
		label,
		bridgeUrl,
	}));

}

export const joinNodeWithInvite = ({
	lpk,
	relays,
	inviteToken,
	label,
	bridgeUrl,
}: NprofileConnection & { inviteToken: string }): AppThunk<Promise<void>> => async (dispatch) => {
	const keys = generateNewKeyPair();
	const client = await getNostrClient({ pubkey: lpk, relays }, keys);
	const res = await client.UseInviteLink({ invite_token: inviteToken });
	if (res.status !== "OK") {
		throw new Error(res.reason);
	}
	dispatch(addSource({ lpk, relays, keys, label, bridgeUrl }));
}

export const linkExistingAccount = ({
	lpk,
	relays,
	token,
	lnAddress,
	label,
	bridgeUrl,
}: NprofileConnection & { token: string; lnAddress: string }): AppThunk<Promise<void>> => async (dispatch) => {
	const keys = generateNewKeyPair();
	const client = await getNostrClient({ pubkey: lpk, relays }, keys);
	const res = await client.LinkNPubThroughToken({ token });
	if (res.status !== "OK") {
		throw new Error(res.reason);
	}
	dispatch(addSource({
		lpk,
		relays,
		keys,
		label,
		bridgeUrl,
		vanityName: lnAddress,
	}));

}

export const connectAsAdmin = ({
	lpk,
	relays,
	adminEnrollToken,
	label,
	bridgeUrl,
}: NprofileConnection & { adminEnrollToken: string }): AppThunk<Promise<void>> => async (dispatch, getState) => {
	const deviceId = getDeviceId();
	const sameLpk = selectSourceViewsByLpk(getState(), lpk);
	const existingAdmin = sameLpk.find((s) => !!s.adminToken);

	// Already admin with this enroll token — nothing to do.
	if (existingAdmin && existingAdmin.adminToken === adminEnrollToken) {
		return;
	}

	// Prefer an existing same-lpk source: previous admin (token rotated) or any non-admin.
	const target = existingAdmin ?? sameLpk[0];
	if (target) {
		const client = await getNostrClient({ pubkey: lpk, relays }, target.keys);
		const res = await client.EnrollAdminToken({ admin_token: adminEnrollToken });
		if (res.status !== "OK") {
			throw new Error(res.reason);
		}
		dispatch(sourcesActions.updateAdminToken({
			sourceId: target.sourceId,
			adminToken: adminEnrollToken,
			by: deviceId,
		}));
		return;
	}

	// No source for this node yet — create one as admin.
	const keys = generateNewKeyPair();
	const client = await getNostrClient({ pubkey: lpk, relays }, keys);
	const res = await client.EnrollAdminToken({ admin_token: adminEnrollToken });
	if (res.status !== "OK") {
		throw new Error(res.reason);
	}
	dispatch(addSource({
		lpk,
		relays,
		keys,
		label,
		bridgeUrl,
		adminToken: adminEnrollToken,
	}));
}

export const addBootstrapSource = (): AppThunk<Promise<void>> => async (dispatch) => {
	await dispatch(addSource({
		lpk: NOSTR_PUB_DESTINATION,
		relays: NOSTR_RELAYS,
		keys: generateNewKeyPair(),
		label: "Bootstrap Node",
	}));
}

export const removeSource = (sourceId: string): AppThunk<void> => async (dispatch, getState) => {
	const deviceId = getDeviceId();

	const source = docsSelectors.selectById(getState(), sourceId);
	if (!source) {
		return;
	}

	dispatch(sourcesActions.markDeleted({ sourceId, by: deviceId }));
}
