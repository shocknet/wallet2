import { getSanctumAccessToken } from "../../Api/sanctum";
import { initialState as backupInitialState } from "../Slices/backupState";
import { AppThunk } from "../store/store";
import { getNostrExtensionIdentityApi } from "./helpers/identityNostrApi";
import { SourceToMigrate } from "./helpers/migrateToIdentities";
import { IdentityType } from "./types";
import { createIdentity } from "./thunks";
import { initialState as spendSourcesInitialState } from "../Slices/spendSourcesSlice";
import { initialState as paySourcesInitialState } from "../Slices/paySourcesSlice";
import { generateNewKeyPair } from "@/Api/helpers";
import { HAS_MIGRATED_TO_IDENTITIES_STORAGE_KEY, NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_RELAYS, SANCTUM_URL } from "@/constants";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { normalizeWsUrl } from "@/lib/url";
import axios from "axios";
import { TokensData } from "sanctum-sdk";



export const migrateDeviceToIdentities = (): AppThunk<Promise<void>> => async (dispatch) => {

	const subbedToBackUp = backupInitialState;

	const sources: SourceToMigrate[] = Object.values(paySourcesInitialState.sources).concat(Object.values(spendSourcesInitialState.sources));

	if (!subbedToBackUp.subbedToBackUp) {

		if (sources.length !== 0) {
			const keypair = generateNewKeyPair();
			await dispatch(createIdentity({
				type: IdentityType.LOCAL_KEY,
				privkey: keypair.privateKey,
				label: "My Nostr pair Identity",
				relays: NOSTR_RELAYS.map(normalizeWsUrl)
			}, sources));

			localStorage.removeItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
			await IonicStorageAdapter.setItem(HAS_MIGRATED_TO_IDENTITIES_STORAGE_KEY, "true");
			return;
		} else {
			localStorage.removeItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
			await IonicStorageAdapter.setItem(HAS_MIGRATED_TO_IDENTITIES_STORAGE_KEY, "true");
			return;
		}
	}




	if (subbedToBackUp.usingSanctum) { // sanctum
		const legacyAccessToken = getSanctumAccessToken();
		if (!legacyAccessToken) {
			throw new Error("Says subbed with sanctum but no sanctum token");
		}
		const tokensData = await upgradeLegacySanctumIdentity(legacyAccessToken);
		await dispatch(createIdentity({
			type: IdentityType.SANCTUM,
			label: "My Sanctum Identity",
			tokensData,
		}, sources));
	} else if (subbedToBackUp.usingExtension) { // extension
		const ext = await getNostrExtensionIdentityApi();
		await ext.getPublicKey();
		await dispatch(createIdentity({
			type: IdentityType.NIP07,
			label: "My Nostr Extension Identity",
			relays: NOSTR_RELAYS.map(normalizeWsUrl),
		}, sources));
	} else {
		throw new Error("Says subbed to backup, but not using sanctum nor nip07");
	}

	localStorage.removeItem(NOSTR_PRIVATE_KEY_STORAGE_KEY)
	await IonicStorageAdapter.setItem(HAS_MIGRATED_TO_IDENTITIES_STORAGE_KEY, "true");
}


export async function upgradeLegacySanctumIdentity(legacyAccessToken: string) {
	const res = await axios.post(`${SANCTUM_URL}/api/guest/access/upgrade`, {
		access_token: legacyAccessToken
	});
	if (res.data.status === 'ERROR') {
		throw new Error(res.data.reason as string);
	}
	return res.data as TokensData;
}
