import { AnyAction, createAction, isAnyOf, ListenerEffectAPI, TaskAbortError, ThunkDispatch } from "@reduxjs/toolkit";
import { addAddressbookLink, addIdentifierMemo } from "./Slices/addressbookSlice";
import { addPaySources, deletePaySources, editPaySources, setPaySources } from "./Slices/paySourcesSlice";
import { setLatestOperation } from "./Slices/HistorySlice";
import { addNotification, removeNotify, updateCheckTime } from "./Slices/notificationSlice";
import { addInvitation, setInvitationToUsed } from "./Slices/oneTimeInviteLinkSlice";
import { setPrefs } from "./Slices/prefsSlice";
import { addSpendSources, deleteSpendSources, editSpendSources, setSpendSources } from "./Slices/spendSourcesSlice";
import { addSubPayment, updateActiveSub } from "./Slices/subscriptionsSlice";
import { fetchRemoteBackup, saveRemoteBackup } from "../helpers/remoteBackups";
import { findReducerMerger, syncRedux } from "./store";
import { ignoredStorageKeys, SANCTUM_ACCESS_TOKEN_STORAGE_KEY, TIMESTAMP_STORAGE_KEY, VERSION_STORAGE_KEY } from "../constants";
import { WALLET_CLIENT_KEY_STORAGE_KEY } from "../Components/SanctumBox/helpers";
import { updateBackupData } from "./Slices/backupState";


const getRemoteAndLocalVersions = (data: Record<string, string | number| null>, localChange?: boolean) => {
	const remoteVersion = {
		timestamp: data[TIMESTAMP_STORAGE_KEY] ? Number(data[TIMESTAMP_STORAGE_KEY]) : 0,
		version: data[VERSION_STORAGE_KEY] ? Number(data[VERSION_STORAGE_KEY]) : 0
	}
	const localVersion = {
		timestamp: localStorage.getItem(TIMESTAMP_STORAGE_KEY) ? Number(localStorage.getItem(TIMESTAMP_STORAGE_KEY)) : 0,
		version: localStorage.getItem(VERSION_STORAGE_KEY) ? Number(localStorage.getItem(VERSION_STORAGE_KEY)) : 0
	}

	if (localChange) {
		localVersion.version = localVersion.version + 1
	}

	return { remoteVersion, localVersion };
}

const checkAndSyncIfNeeded = async (decrypted: string, api: ListenerEffectAPI<unknown, ThunkDispatch<unknown, unknown, AnyAction>>) => {
	const data: Record<string, string | number| null> = decrypted ? JSON.parse(decrypted) : {};
	const { localVersion, remoteVersion } = getRemoteAndLocalVersions(data)
	if (remoteVersion.version > localVersion.version) {
		await syncRemoteAndLocal(decrypted, api);
	}
}


const syncRemoteAndLocal = async (decrypted: string, api: ListenerEffectAPI<unknown, ThunkDispatch<unknown, unknown, AnyAction>>, localChange?: boolean) => {
	const data: Record<string, string | number| null> = decrypted ? JSON.parse(decrypted) : {};
	const { localVersion, remoteVersion } = getRemoteAndLocalVersions(data, localChange)

	// remove version and timestamp keys so as to not have them in the loop
	if (data[VERSION_STORAGE_KEY]) delete data[VERSION_STORAGE_KEY];
	if (data[TIMESTAMP_STORAGE_KEY]) delete data[TIMESTAMP_STORAGE_KEY];

	if (decrypted) {
		for (const key in data) {
			const merger = findReducerMerger(key)
			if (!merger) {
				continue
			}
			const serialRemote = data[key] as string
			const serialLocal = localStorage.getItem(key)
			console.log({ local: serialLocal ? JSON.parse(serialLocal) : "", remote: JSON.parse(serialRemote) })
			console.log(localVersion, remoteVersion)

			let newItem = "";
			// present on backup but not local, for example addressBook
			if (!serialLocal) {
				newItem = serialRemote;
			} else {
				newItem = merger(serialLocal, serialRemote, localVersion, remoteVersion)
			}
			console.log(key, JSON.parse(serialLocal ?? "null"), JSON.parse(serialRemote), JSON.parse(newItem));

			// update object that will be sent to backup/nostr
			data[key] = newItem;
			// update local with the merged object too
			localStorage.setItem(key, newItem);
			api.dispatch(syncRedux());

			// if backup had wallet client key or sanctum access token remove them.
			if (data[WALLET_CLIENT_KEY_STORAGE_KEY]) delete data[WALLET_CLIENT_KEY_STORAGE_KEY]
			if (data[SANCTUM_ACCESS_TOKEN_STORAGE_KEY]) delete data[SANCTUM_ACCESS_TOKEN_STORAGE_KEY]
		}

	} else {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i) ?? "null";
			const value = localStorage.getItem(key);
			if (value && !ignoredStorageKeys.includes(key)) {
				data[key] = value;
			}
		}
	}
	// update both local and remote with the new version and timestamp
	const newVersion = localChange ? Math.max(remoteVersion.version, localVersion.version) + 1 : Math.max(remoteVersion.version, localVersion.version);
	const newTimestamp = localChange ? Math.max(remoteVersion.timestamp, localVersion.timestamp) : Date.now();
	localStorage.setItem(VERSION_STORAGE_KEY, newVersion.toString());
	localStorage.setItem(TIMESTAMP_STORAGE_KEY, newTimestamp.toString());
	data[VERSION_STORAGE_KEY] = newVersion;
	data[TIMESTAMP_STORAGE_KEY] = newTimestamp;
	
	await saveRemoteBackup(JSON.stringify(data));



}



export const backupMiddleware = {
	matcher: isAnyOf(
		addAddressbookLink,
		addIdentifierMemo,
		updateBackupData,
		setLatestOperation,
		addNotification,
		updateCheckTime,
		removeNotify,
		addInvitation,
		setInvitationToUsed,
		addPaySources,
		editPaySources,
		deletePaySources,
		setPaySources,
		setPrefs,
		addSpendSources,
		editSpendSources,
		deleteSpendSources,
		setSpendSources,
		addSubPayment,
		updateActiveSub,
	),
	effect: async (action: AnyAction, listenerApi: ListenerEffectAPI<unknown, ThunkDispatch<unknown, unknown, AnyAction>, unknown>) => {
		console.log(listenerApi.getState(), action.type)
		// the backup happens after a dispatch action lives 1000 ms without newer dispatches happening
		listenerApi.cancelActiveListeners();

		await listenerApi.delay(3000);
		console.log("backup middleware running")
	

		const backup = await fetchRemoteBackup();

		if (backup.result !== "success") {
			listenerApi.unsubscribe();
			return;
		}
		syncRemoteAndLocal(backup.decrypted, listenerApi, true);
	}
}

export const backupPollingStarted = createAction('backupPolling/started')
export const backupPollingStopped = createAction('backupPolling/stopped')


export const backupPollingMiddleware = {
	actionCreator: backupPollingStarted,
	effect: async (_action: AnyAction, listenerApi: ListenerEffectAPI<unknown, ThunkDispatch<unknown, unknown, AnyAction>, unknown>) => {

		listenerApi.unsubscribe();

		const pollingTask = listenerApi.fork(async (forkApi) => {
			try {
				console.log("here")
				const backup = await fetchRemoteBackup();
				if (backup.result !== "success") {
					listenerApi.dispatch(backupPollingStopped());
					return
				}
				await checkAndSyncIfNeeded(backup.decrypted, listenerApi);

				while (true) {
					const backup = await fetchRemoteBackup();
					if (backup.result !== "success") {
						listenerApi.dispatch(backupPollingStopped());
						return
					}
					await forkApi.delay(10000); // 10 seconds
					console.log("checking remote")
					await checkAndSyncIfNeeded(backup.decrypted, listenerApi);
				}
			} catch (err) {
				if (err instanceof TaskAbortError) {
					console.log("Polling was cancelled");
				}
			}
		});

		await listenerApi.condition(backupPollingStopped.match);
		pollingTask.cancel();
	}
}

