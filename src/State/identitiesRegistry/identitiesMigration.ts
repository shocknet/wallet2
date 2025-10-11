import { getSanctumAccessToken } from "../../Api/sanctum";
import { initialState as backupInitialState } from "../Slices/backupState";
import { AppThunk } from "../store/store";
import { getNostrExtensionIdentityApi, getSanctumIdentityApi } from "./helpers/identityNostrApi";
import { SourceToMigrate } from "./helpers/migrateToIdentities";
import { IdentityExtension, IdentityKeys, IdentitySanctum, IdentityType } from "./types";
import { createIdentity } from "./thunks";
import { initialState as spendSourcesInitialState } from "../Slices/spendSourcesSlice";
import { initialState as paySourcesInitialState } from "../Slices/paySourcesSlice";
import { utils } from "nostr-tools";
import { generateNewKeyPair } from "@/Api/helpers";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_RELAYS } from "@/constants";
import { appStateActions } from "../appState/slice";




export const migrateDeviceToIdentities = (): AppThunk<Promise<void>> => async (dispatch) => {

	const subbedToBackUp = backupInitialState;

	const sources: SourceToMigrate[] = Object.values(paySourcesInitialState.sources).concat(Object.values(spendSourcesInitialState.sources));


	if (subbedToBackUp.subbedToBackUp) {

		if (subbedToBackUp.usingSanctum) { // sanctum
			const accessToken = getSanctumAccessToken();
			if (!accessToken) {
				throw new Error("Says subbed with sanctum but no sanctum token");
			}

			const ext = await getSanctumIdentityApi({ accessToken });
			const pubkey = await ext.getPublicKey();
			const identity: IdentitySanctum = {
				type: IdentityType.SANCTUM,
				pubkey,
				label: "My Sanctum Identity",
				accessToken,
				createdAt: Date.now()
			}
			await dispatch(createIdentity(identity, sources))
			localStorage.removeItem(NOSTR_PRIVATE_KEY_STORAGE_KEY)
			dispatch(appStateActions.setAppBootstrapped());
		} else if (subbedToBackUp.usingExtension) { // extension
			const ext = await getNostrExtensionIdentityApi();
			const pubkey = await ext.getPublicKey();


			const relays = ext.getRelays().catch(() => null);

			const identity: IdentityExtension = {
				type: IdentityType.NIP07,
				pubkey,
				label: "My Nostr Extension Identity",
				createdAt: Date.now(),
				relays: relays ? Object.keys(relays).map(utils.normalizeURL) : NOSTR_RELAYS.map(utils.normalizeURL)
			};
			await dispatch(createIdentity(identity, sources));
			localStorage.removeItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
			dispatch(appStateActions.setAppBootstrapped());
		} else {
			throw new Error("Says subbed to backup, but not using sanctum nor nip07");
		}
	} else { // Not subbed to backup. Just take local sources and create a nostr key pair identity
		const keypair = generateNewKeyPair();
		const identity: IdentityKeys = {
			type: IdentityType.LOCAL_KEY,
			pubkey: keypair.publicKey,
			privkey: keypair.privateKey,
			label: "My Nostr pair Identity",
			createdAt: Date.now(),
			relays: NOSTR_RELAYS.map(utils.normalizeURL)
		};

		await dispatch(createIdentity(identity, sources));
		localStorage.removeItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
		dispatch(appStateActions.setAppBootstrapped());
	}
}
