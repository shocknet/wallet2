import { addListener, AnyAction, createAction, createListenerMiddleware, ListenerEffectAPI, TaskAbortError, ThunkDispatch, removeListener } from "@reduxjs/toolkit";
import { addPaySources, deletePaySources, editPaySources, flipSourceNdebitDiscoverable, PaySourceRecord, setPaySources } from "./Slices/paySourcesSlice";
import { addSpendSources, deleteSpendSources, editSpendSources, setSpendSources, SpendSourceRecord } from "./Slices/spendSourcesSlice";
import { fetchRemoteBackup, saveChangelog, saveRemoteBackup, subscribeToRemoteChangelogs } from "../helpers/remoteBackups";
import { AppDispatch, dynamicMiddleware, findReducerMerger, reducer, State } from "./store/store";
import { CHANGELOG_TIMESTAMP, getDeviceId, STATE_HASH } from "../constants";
import { BackupAction, Changelog, GeneralShard, PREFS_DTAG, ShardsTagsRecord } from "./types";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { setPrefs } from "./Slices/prefsSlice";
import { syncRedux } from "./thunks/syncRedux";



// This function uses the root reducer to simulate dispatching a set of actions received in changelogs.
// It then calculates the hash of the state and this hash is then compared with the newHash property of the changelog.
const simulateDispatchAndCalculateHash = (actions: AnyAction[], api: ListenerEffectAPI<State, ThunkDispatch<unknown, unknown, AnyAction>>): string => {
	const currentState = api.getState();
	let clonedState = JSON.parse(JSON.stringify(currentState)) as State;

	for (const action of actions) {
		clonedState = reducer(clonedState, action)
	}

	return getStateHash(clonedState);
}






// Calculate the hash of the state. Only a subset of the state is used for calculating hashes.
// Moreover non-deterministic bits of the state are excluded in the hash calculation so as to not skew the resulting hash.
// Such excluded bits are like a source's balance.
const getStateHash = (state: State) => {

	// Function to sort the sources keys so as to result in the same hash.
	// It also removes non-deterministic properties so the hash in not affected
	const reorderSourcesRecord = (obj: SpendSourceRecord | PaySourceRecord) => {
		return Object.keys(obj)
			.sort()
			.reduce((sortedObj, key) => {
				const objectToFilter = obj[key];
				if ("balance" in objectToFilter) {
					const { balance: _balance, maxWithdrawable: _max, disabled: _disabled, disconnected: _disconnected, ...rest } = objectToFilter
					sortedObj[key] = rest
					return sortedObj;
				} else {
					const { vanityName: _vanityName, disconnected: _disconnected, ...rest } = objectToFilter
					sortedObj[key] = rest
					return sortedObj;
				}
			}, {} as SpendSourceRecord | PaySourceRecord);
	}


	const hashInput = {
		pay: reorderSourcesRecord(state.paySource.sources),
		spend: reorderSourcesRecord(state.spendSource.sources),
		payOrder: state.paySource.order,
		spendOrder: state.spendSource.order,
		prefs: state.prefs
	}

	return hashString(JSON.stringify(hashInput));
}


const hashString = (data: string) => {
	return bytesToHex(sha256(data));
}



// Sources shard include an order number specifying their order in the sources order array
// This property is used to sort the shards on the receiving device to prepend sources in the correct order
const shardAndBackupState = async (state: State, stateHash: string, changelogs?: Changelog[]) => {

	const id = getDeviceId();

	const backupPromises: Promise<number>[] = []
	const dtags: string[] = [];

	// shard spend sources into nip78 events per source
	for (const source of Object.values(state.spendSource.sources)) {
		const dtag = `shockwallet:spendSource:${hashString(source.id)}:${id}`;
		backupPromises.push(saveRemoteBackup(
			JSON.stringify({ source, order: state.spendSource.order.findIndex(id => id === source.id), kind: "spendSource" }),
			dtag
		));
		dtags.push(dtag)
	}

	// shard pay sources into nip78 events per source
	for (const source of Object.values(state.paySource.sources)) {
		const dtag = `shockwallet:paySource:${hashString(source.id)}:${id}`;
		backupPromises.push(saveRemoteBackup(
			JSON.stringify({ source, order: state.paySource.order.findIndex(id => id === source.id), kind: "paySource" }),
			dtag
		));
		dtags.push(dtag);
	}


	// prefs into a shard
	backupPromises.push(saveRemoteBackup(
		JSON.stringify({ prefs: state.prefs, kind: "prefs" }),
		`${PREFS_DTAG}:${id}`
	));
	dtags.push(`${PREFS_DTAG}:${id}`)




	try {
		// send the shards as well as main event that lists the shards' dtags and the stateHash
		await Promise.all(backupPromises)
		await saveRemoteBackup(JSON.stringify({ dtags, remoteHash: stateHash }));

		// save the new state hash
		localStorage.setItem(STATE_HASH, stateHash);
		let finalTimestamp = 0

		if (changelogs) {
			await Promise.all(changelogs.map(async c => {
				finalTimestamp = await saveChangelog(JSON.stringify(c));
			}))
		}
		// the changelog timestamp is set to the timestamp of the last sent changelog event
		finalTimestamp = Math.round(Date.now() / 1000);
		return finalTimestamp
	} catch (err) {
		throw new Error(`Error when writing shards to nostr: ${err}`);
	}
}

// Fall back to shards when there is conflict resultant of concurrent changelogs
const resolveConflictWithShards = async (api: ListenerEffectAPI<State, ThunkDispatch<unknown, unknown, AnyAction>>, mostRecent: Changelog & { timestamp: number }) => {
	console.log("Solving conflict")
	const originalState = api.getState();
	// clear sources
	originalState.paySource.order.forEach(id => {
		api.dispatch({
			type: "paySources/deletePaySources",
			payload: id,
			meta: { skipChangelog: true }
		})
	})
	originalState.spendSource.order.forEach(id => {
		api.dispatch({
			type: "spendSources/deleteSpendSources",
			payload: id,
			meta: { skipChangelog: true }
		})
	})

	// clear lnurl operations
	api.dispatch({
		type: "history/clearLnurlOperations",
	})

	const backup = await fetchRemoteBackup();
	if (backup.result !== "success") {
		throw new Error(backup.result);
	}
	const data = JSON.parse(backup.decrypted);
	const { dtags, remoteHash } = data as ShardsTagsRecord;
	const UnsortedShards: GeneralShard[] = await Promise.all(dtags.map(async (tag) => {
		const shard = await fetchRemoteBackup(tag);
		if (shard.result !== "success") {
			throw new Error(backup.result);
		}

		return JSON.parse(shard.decrypted);
	}));
	const shards = UnsortedShards.sort((a, b) => {
		if ((a.kind === "spendSource" && b.kind === "spendSource") || (a.kind === "paySource" && b.kind === "paySource")) {
			return b.order - a.order;
		}
		return 0
	})

	// sync down the shards
	shards.forEach(shard => {
		switch (shard.kind) {
			case "paySource":
				api.dispatch({
					type: "paySources/addPaySources",
					payload: { source: shard.source, first: true },
					meta: { skipChangelog: true }
				});
				break;
			case "spendSource":
				api.dispatch({
					type: "spendSources/addSpendSources",
					payload: { source: shard.source, first: true },
					meta: { skipChangelog: true }
				});
				break;
			case "prefs":
				api.dispatch({
					type: "prefs/setPrefs",
					payload: shard.prefs,
					meta: { skipChangelog: true }
				});
				break;
			case "lnurlOps":
				api.dispatch({
					type: "history/setLnurlOperations",
					payload: shard.operations,
					meta: { skipChangelog: true }
				})
				break;
			default:
				throw new Error("Unkown shard kind")
		}
	});

	const newState = api.getState();
	const newHash = getStateHash(newState);
	if (newHash !== remoteHash) {
		throw new Error("In conflict resolution. Hashes don't match")
	}
	localStorage.setItem(STATE_HASH, newHash)
	localStorage.setItem(CHANGELOG_TIMESTAMP, (mostRecent.timestamp + 1).toString())

}


const syncNewDeviceWithRemote = async (api: ListenerEffectAPI<State, ThunkDispatch<unknown, unknown, AnyAction>>): Promise<number> => {
	const backup = await fetchRemoteBackup();
	const id = getDeviceId()
	const originalState = api.getState();
	if (backup.result !== "success") {
		throw new Error(backup.result);
	}

	// There's no remote backup, so shard and send local state as the starting point
	if (!backup.decrypted) {
		console.log("no remote backup")
		return shardAndBackupState(originalState, getStateHash(originalState));
	} else {
		console.log("remote back exists")
		// There are remote backups. This remote backup could be either the new shards or the legacy non-sharded full state event
		const data = JSON.parse(backup.decrypted);

		// This backup is the new shards
		if (data.dtags) {
			console.log("It's a sharded backup")
			const { dtags, remoteHash } = data as ShardsTagsRecord;
			const UnsortedShards: GeneralShard[] = await Promise.all(dtags.map(async tag => {
				const shard = await fetchRemoteBackup(tag);
				if (shard.result !== "success") {
					throw new Error(backup.result);
				}
				return JSON.parse(shard.decrypted);
			}));
			// Sources shards are to be prepended in the correct order, so all devices in the pool have an identical sources order.
			// This requires to sort sources shards in reverse according to their order property
			const shards = UnsortedShards.sort((a, b) => {
				if ((a.kind === "spendSource" && b.kind === "spendSource") || (a.kind === "paySource" && b.kind === "paySource")) {
					return b.order - a.order;
				}
				return 0
			})

			// sync down the shards
			shards.forEach(shard => {
				switch (shard.kind) {
					case "paySource":
						api.dispatch({
							type: "paySources/addPaySources",
							payload: { source: shard.source, first: true },
							meta: { skipChangelog: true }
						});
						break;
					case "spendSource":
						api.dispatch({
							type: "spendSources/addSpendSources",
							payload: { source: shard.source, first: true },
							meta: { skipChangelog: true }
						});
						break;
					case "prefs":
						api.dispatch({
							type: "prefs/setPrefs",
							payload: shard.prefs,
							meta: { skipChangelog: true }
						});
						break;
					case "lnurlOps":
						api.dispatch({
							type: "history/setLnurlOperations",
							payload: shard.operations,
							meta: { skipChangelog: true }
						})
						break;
					default:
						throw new Error("Unkown shard kind")
				}
			});
			const newState = api.getState();
			const newHash = getStateHash(newState);
			const changelogs: Changelog[] = [];



			// Sends the local state as changelogs

			// An edge case would be a source, like an lnurl source, existing on both remote and local, that's why we do this filter step
			// so as to not send changelog for something that is already there
			Object.values(originalState.paySource.sources).filter(source => !shards.find(s => s.kind === "paySource" && s.source.id === source.id)).forEach(source => {
				const changelog: Changelog = {
					previousHash: remoteHash,
					newHash: newHash,
					partial: true,
					order: originalState.paySource.order.findIndex(s => s === source.id),
					id,
					action: {
						type: "paySources/addPaySources",
						payload: { source }
					}
				};
				changelogs.push(changelog);
			});

			Object.values(originalState.spendSource.sources).filter(source => !shards.find(s => s.kind === "spendSource" && s.source.id === source.id)).forEach(source => {
				const changelog: Changelog = {
					previousHash: remoteHash,
					newHash: newHash,
					partial: true,
					id,
					order: originalState.spendSource.order.findIndex(s => s === source.id),
					action: {
						type: "spendSources/addSpendSources",
						payload: { source }
					}
				}
				changelogs.push(changelog);
			})

			// send changelogs for new sources on local
			return shardAndBackupState(newState, newHash, changelogs);

		} else {
			console.log("it's a legacy backup")
			// The remote backup is the legacy, non-sharded full state event.
			// The goal is to sync it down and then shard it so it joins the sharded flow from now on
			const actions: BackupAction[] = [];




			for (const key in data) {
				if (!["payTo", "spendFrom", "history", "prefs"].includes(key)) continue;

				const merger = findReducerMerger(key)
				if (!merger) {
					continue
				}

				const serialRemote = data[key] as string
				const serialLocal = localStorage.getItem(key)
				let newItem = "";
				if (!serialLocal) {
					newItem = serialRemote
				} else {
					const { data: mergeResult, actions: newActions } = merger(serialLocal, serialRemote);
					actions.push(...newActions);
					newItem = mergeResult;
				}
				data[key] = newItem;
				localStorage.setItem(key, newItem);
			}

			api.dispatch(syncRedux());
			const newState = api.getState();
			const previousHash = getStateHash(originalState);

			const newHash = getStateHash(newState);
			const changelogs: Changelog[] = actions.map(a => ({ action: a, id, previousHash, newHash, partial: true }))
			return shardAndBackupState(newState, getStateHash(newState), changelogs);
		}
	}
}
let changelogsTasksQueue: Changelog[] = [];
export const backupMiddlewareListner = {
	predicate: (action: AnyAction) => {
		return (
			!action.meta?.skipChangelog &&
			(
				editSpendSources.match(action) ||
				addSpendSources.match(action) ||
				deleteSpendSources.match(action) ||
				setSpendSources.match(action) ||
				addPaySources.match(action) ||
				editPaySources.match(action) ||
				deletePaySources.match(action) ||
				setPaySources.match(action) ||
				setPrefs.match(action) ||
				flipSourceNdebitDiscoverable.match(action)
			)
		);
	},
	effect: async (action: AnyAction, listenerApi: ListenerEffectAPI<State, ThunkDispatch<unknown, unknown, AnyAction>>) => {
		console.log("changelog sending triggered", action)
		const state = listenerApi.getState();
		const newHash = getStateHash(state);
		const previousHash = localStorage.getItem(STATE_HASH) || getStateHash(listenerApi.getOriginalState());
		localStorage.setItem(STATE_HASH, newHash)
		const id = getDeviceId()
		const changelog: Changelog = { action: { type: action.type, payload: action.payload }, id, previousHash: previousHash!, newHash: getStateHash(listenerApi.getState()) }
		changelogsTasksQueue.push(changelog)
		try {
			await listenerApi.delay(100)
			console.log("Releasing")
		} catch (err) {
			if (err instanceof TaskAbortError) {
				return;
			}
		}
		listenerApi.cancelActiveListeners();

		await shardAndBackupState(state, newHash, changelogsTasksQueue)
		changelogsTasksQueue = []
	}
}

export const backupSubStarted = createAction('backupSub/started')
export const backupSubStopped = createAction('backupSub/stopped')


let timer: NodeJS.Timeout | null = null
// handleChangelogs is the function that is responsible for applying received changelogs
let aggregatedChangelogs: (Changelog & { timestamp: number })[] = [];
const handleChangelogs = async (listenerApi: ListenerEffectAPI<State, ThunkDispatch<unknown, unknown, AnyAction>, unknown>) => {
	if (timer !== null) {
		clearTimeout(timer);
	}

	// If the changelogs has mutiple sources additions then the order of the sources is critical, that's why we sort
	aggregatedChangelogs = aggregatedChangelogs.sort((a, b) => {
		if (a.order !== undefined && b.order !== undefined) {
			return a.order - b.order
		} else {
			return 0;
		}
	})

	while (aggregatedChangelogs.length > 0) {
		const stateHash = localStorage.getItem(STATE_HASH);
		const target = aggregatedChangelogs.find(c => c.previousHash === stateHash)
		if (target) {
			if (target.partial) {
				const allPartialOfSameKind = aggregatedChangelogs.filter(c => c.partial && c.previousHash === stateHash && c.newHash === target.newHash);
				const newSimulatedHash = simulateDispatchAndCalculateHash(allPartialOfSameKind.map(c => c.action), listenerApi);
				if (newSimulatedHash === target.newHash) {
					aggregatedChangelogs = aggregatedChangelogs.filter(c => !c.partial && c.previousHash !== stateHash && c.newHash !== target.newHash);
					allPartialOfSameKind.forEach(c => {
						listenerApi.dispatch({ ...c.action, meta: { skipChangelog: true } });
					})
					const newHash = getStateHash(listenerApi.getState())
					localStorage.setItem(STATE_HASH, newHash)
					localStorage.setItem(CHANGELOG_TIMESTAMP, (target.timestamp + 1).toString())
					continue
				}

			} else {
				const newSimulatedHash = simulateDispatchAndCalculateHash([target.action], listenerApi);
				if (newSimulatedHash === target.newHash) {
					aggregatedChangelogs = aggregatedChangelogs.filter(c => c.previousHash !== stateHash && c.newHash !== target.newHash);
					listenerApi.dispatch({ ...target.action, meta: { skipChangelog: true } });
					const newHash = getStateHash(listenerApi.getState())
					localStorage.setItem(STATE_HASH, newHash)
					localStorage.setItem(CHANGELOG_TIMESTAMP, (target.timestamp + 1).toString())
					continue
				}
			}
			break;
		} else {
			timer = setTimeout(async () => {
				// there is a conflict
				console.log({ aggregatedChangelogs })
				const mostRecent = aggregatedChangelogs.reduce((prev, current) => prev.timestamp > current.timestamp ? prev : current)
				await resolveConflictWithShards(listenerApi, mostRecent);
				aggregatedChangelogs = [];
			}, 3000);
			break;
		}
	}

}


export const backupPollingListener = {
	actionCreator: backupSubStarted,
	effect: async (_action: AnyAction, listenerApi: ListenerEffectAPI<State, ThunkDispatch<unknown, unknown, AnyAction>, unknown>) => {

		listenerApi.unsubscribe();

		const stateHash = localStorage.getItem(STATE_HASH);
		let timestamp: number | string | null = localStorage.getItem(CHANGELOG_TIMESTAMP)

		// This is a new device that just got into the syncing "pool"
		if (!stateHash && !timestamp) {
			console.log("new device")
			timestamp = await syncNewDeviceWithRemote(listenerApi);
			localStorage.setItem(CHANGELOG_TIMESTAMP, timestamp.toString());
		}

		const pollingTask = listenerApi.fork(async () => {
			let subCloser = {
				close: () => { }
			}
			try {
				console.log("Now stable device, listenting for changelogs")
				subCloser = await subscribeToRemoteChangelogs(
					Number(timestamp),
					async (decrypted, eventTimestamp) => {
						const changelog = JSON.parse(decrypted) as Changelog;
						const id = getDeviceId()
						if (id !== changelog.id) {
							console.log("received changelog")
							aggregatedChangelogs.push({ ...changelog, timestamp: eventTimestamp });

							handleChangelogs(listenerApi)
						}
					}
				);


			} catch (err) {
				subCloser.close()
				listenerApi.subscribe()
				if (err instanceof TaskAbortError) {
					console.log("task was aborted")
				} else {
					console.log("An error occured in the task", err);
					listenerApi.dispatch(backupSubStopped());
				}
			}


		});

		await listenerApi.condition(backupSubStopped.match);
		pollingTask.cancel();
	}
}
const backupMiddleware = createListenerMiddleware();
export const useBackupMiddlewareListenerDispatch = dynamicMiddleware.createDispatchWithMiddlewareHook(backupMiddleware.middleware);



export const addBackupListener = addListener.withTypes<State, AppDispatch>();
export const removeBackupListener = removeListener.withTypes<State, AppDispatch>();

