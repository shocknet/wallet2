import { startAppListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identitySwitchRequested, identityUnloaded, publisherFlushRequested } from "./actions";
import { IdentityType } from "../types";
import { identitiesRegistryActions } from "../slice";
import { persistor } from "@/State/store/store";
import { getAllScopedPersistKeys, injectNewScopedReducer, removeScoped } from "@/State/scoped/scopedReducer";
import { identityActions, selectIdentityDraft } from "@/State/scoped/backups/identity/slice";
import { fetchRemoteBackup } from "@/helpers/remoteBackups";
import { getIdentityDocDtag, processRemoteDoc } from "./helpers";
import { resetClientsCluster } from "@/Api/nostr";
import { REHYDRATE } from "redux-persist";
import { LAST_ACTIVE_IDENTITY_PUBKEY_KEY } from "../thunks";




/*

startAppListening({
	actionCreator: identitySwitchRequested,
	effect: async (action, listenerApi) => {

		listenerApi.cancelActiveListeners();


		console.log("here0")
		await listenerApi.delay(15);


		const requested = action.payload.pubkey;
		const registry = listenerApi.getState().identitiesRegistry;
		const existing = registry.entities[requested];
		console.log({ existing })


		if (!existing) return;
		if (existing.type !== IdentityType.LOCAL_KEY) return;

		console.log("here1")

		listenerApi.dispatch(identitiesRegistryActions.setActiveIdentity({ pubkey: null }));
		listenerApi.dispatch(identityUnloaded());



		await persistor.flush().catch(() => { });
		listenerApi.dispatch(publisherFlushRequested());
		await resetClientsCluster();

		removeScoped(listenerApi.dispatch);
		injectNewScopedReducer(requested, listenerApi.dispatch);
		const keys = getAllScopedPersistKeys(requested);
		await waitForRehydrateKeys(Object.values(keys));

		const draft = selectIdentityDraft(listenerApi.getState());
		if (draft === undefined) {
			listenerApi.dispatch(identityActions.initIdentityDoc({ identity_pubkey: requested, by: "bootstrap" }));
		}

		await listenerApi.fork(async (forkApi) => {
			try {

				const result = await forkApi.pause(fetchRemoteBackup(getIdentityDocDtag(requested)));

				if (result.result !== "success") return null;
				const doc = JSON.parse(result.decrypted);


				const remoteDoc = processRemoteDoc(doc, listenerApi.dispatch);

				if (!remoteDoc) {
					/* TODO: Give default source */
				}
			} catch (err) {
	console.error("error: ", err);
}
		}).result;

listenerApi.dispatch(identitiesRegistryActions.setActiveIdentity({ pubkey: requested }));
localStorage.setItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY, requested);
listenerApi.dispatch(identityLoaded({ identity: existing }));
	},
})
 */

const waiters = new Map<string, Array<() => void>>();

export async function waitForRehydrateKeys(keys: string[]) {
	const promises = keys.map(key => new Promise<void>((resolve) => {
		const arr = waiters.get(key) ?? [];
		arr.push(resolve);
		waiters.set(key, arr);
	}));
	return Promise.all(promises);
}

startAppListening({
	type: REHYDRATE,
	effect: async (action) => {
		if (
			"key" in action && typeof action.key === "string"
		) {
			const arr = waiters.get(action.key)
			if (arr?.length) {
				waiters.delete(action.key);
				for (const resolve of arr) resolve();
			}
		}
	}
})
