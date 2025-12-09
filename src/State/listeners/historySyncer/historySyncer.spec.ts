import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateSources, makeOpsPage, createTestSourceDoc, GenSource, getPreloadedSourcesState } from "@tests/support/sourcesHelpers";
import { sourcesActions, sourcesSlice } from "@/State/scoped/backups/sources/slice";
import { combineReducers, configureStore, createListenerMiddleware, TaskAbortError, TaskResult } from "@reduxjs/toolkit";
import { createDeferred } from "@/lib/deferred";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import { historyFetchAllRequested, historyFetchSourceRequested, identityLoaded, identityUnloaded } from "@/State/listeners/actions";
import { addIdentityLifecycle } from "@/State/listeners/lifecycle/lifecycle";
import { historySyncerSpec } from "./historySyncer";
import { getNostrClient } from "@/Api/nostr";
import { BEACON_STALE_OLDER_THAN } from "@/State/scoped/backups/sources/state";



vi.mock("@/Api/nostr", () => ({
	getNostrClient: vi.fn(),
}));
vi.mock("@/lib/invoice", () => ({
	decodeInvoice: vi.fn(() => undefined),
}));

const getNostrClientMock = vi.mocked(getNostrClient);


function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

const makeStore = (initialSources?: GenSource[], loadIdentity = true) => {



	const listenerMw = createListenerMiddleware();

	const store = configureStore({
		reducer: {
			scoped: combineReducers({
				sources: sourcesSlice.reducer,
			}),
		},
		preloadedState: initialSources ?
			{
				scoped: {
					sources: getPreloadedSourcesState(initialSources)
				}
			} : undefined
		,
		middleware: gdm =>
			gdm({
				serializableCheck: { ignoredActions: [historyFetchSourceRequested.type, historyFetchAllRequested.type] },
			}).prepend(listenerMw.middleware),
	});

	type AppStore = typeof store;
	type RootState = ReturnType<AppStore["getState"]>;
	type AppDispatch = AppStore["dispatch"];

	const startAppListening = listenerMw.startListening.withTypes<
		RootState,
		AppDispatch
	>();

	// @ts-expect-error nevermind not the full store, just sources slice
	addIdentityLifecycle(startAppListening, [historySyncerSpec]);
	if (loadIdentity)
		store.dispatch(identityLoaded({ identity }));

	return store;

}

const identity: Identity = {
	type: IdentityType.LOCAL_KEY,
	label: "label",
	createdAt: Date.now(),
	pubkey: "hexhexhex",
	privkey: "hexhexhex",
	relays: ["wss://example.com"]
}


describe("historySyncer", () => {

	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(500_000)
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("fetches GetUserInfo and commits balance + ndebit for one healthy source", async () => {
		const [source] = generateSources(1);
		const store = makeStore([source]);

		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue({
				status: "OK",
				ndebit: "ndebit-string",
				balance: 40,
				max_withdrawable: 30
			}),
			GetUserOperations: vi.fn().mockResolvedValue(makeOpsPage({}))
		};

		getNostrClientMock.mockResolvedValue(fakeClient as any);

		const deferred = createDeferred<TaskResult<void>>();

		store.dispatch(historyFetchSourceRequested({ sourceId: source.id, deferred }));

		await vi.waitFor(() => {
			if (getNostrClientMock.mock.calls.length === 0) throw new Error
		})

		expect(getNostrClientMock).toHaveBeenCalledTimes(2);

		expect(fakeClient.GetUserInfo).toHaveBeenCalledTimes(1);

		const mAfter = store.getState().scoped.sources.metadata.entities[source.id];

		expect(mAfter.balance).toEqual(40);
		expect(mAfter.maxWithdrable).toEqual(30);
	});


	it("rejects when listener gets cancelled by lifefycle", async () => {
		const [source] = generateSources(1);
		const store = makeStore([source]);


		const fakeClient = {
			GetUserInfo: vi.fn().mockImplementation(async () => {
				await delay(10);

				// never gets resolved
				return {
					status: "OK",
					ndebit: "ndebit-string",
					balance: 40,
					max_withdrawable: 30
				}
			}),
			GetUserOperations: vi.fn().mockResolvedValue(makeOpsPage({}))
		};

		getNostrClientMock.mockResolvedValue(fakeClient as any);


		const deferred = createDeferred<TaskResult<void>>();
		store.dispatch(historyFetchSourceRequested({ sourceId: source.id, deferred }));

		await vi.advanceTimersByTimeAsync(5);

		const d = createDeferred<void>();
		store.dispatch(identityUnloaded({ deferred: d }));

		expect(deferred).rejects.toThrow(TaskAbortError);

		const m = store.getState().scoped.sources.metadata.entities[source.id];

		expect(m.balance).toEqual(0);
		expect(m.maxWithdrable).toEqual(0);
	});


	it("fetches userOperations and commits history. Handles pagination", async () => {
		const [source] = generateSources(1);
		const store = makeStore([source]);

		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue({
				status: "OK",
				ndebit: "ndebit-string",
				balance: 40,
				max_withdrawable: 30
			}),
			GetUserOperations: vi.fn()

		};

		getNostrClientMock.mockResolvedValue(fakeClient as any);


		fakeClient.GetUserOperations.mockResolvedValueOnce(makeOpsPage({ inInv: 10, outInv: 5 }));
		fakeClient.GetUserOperations.mockResolvedValueOnce(makeOpsPage({ inTx: 5 }));


		const deferred = createDeferred<TaskResult<void>>();
		store.dispatch(historyFetchSourceRequested({ sourceId: source.id, deferred }));

		await vi.runAllTimersAsync();

		expect(getNostrClientMock).toHaveBeenCalledTimes(2); // one for getUserInfo and one for GetUserOperations

		expect(fakeClient.GetUserOperations).toHaveBeenCalledTimes(2); // 2 times because we have two pages

		const history = store.getState().scoped!.sources.history.ops
		expect(history.ids).toHaveLength(20);
		await expect(deferred).resolves.toBeUndefined();
	});


	it("dedups per source sync requests", async () => {
		const [source] = generateSources(1);
		const store = makeStore([source]);

		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue({
				status: "OK",
				ndebit: "ndebit-string",
				balance: 40,
				max_withdrawable: 30
			}),
			GetUserOperations: vi.fn()

		};

		getNostrClientMock.mockResolvedValue(fakeClient as any);



		fakeClient.GetUserOperations.mockResolvedValueOnce(makeOpsPage({ inInv: 5, outInv: 5 }));




		const d1 = createDeferred<TaskResult<void>>();
		const d2 = createDeferred<TaskResult<void>>();

		store.dispatch(historyFetchSourceRequested({ sourceId: source.id, deferred: d1 }));
		store.dispatch(historyFetchSourceRequested({ sourceId: source.id, deferred: d2 }));

		await vi.runAllTimersAsync();

		// one for getUserInfo and one for GetUserOperations, so only one sync request runs.
		// the other hooks into the existing one's promise
		expect(getNostrClientMock).toHaveBeenCalledTimes(2);

		expect(fakeClient.GetUserOperations).toHaveBeenCalledTimes(1);

		// Both promises resolve
		await expect(d1).resolves.toBeUndefined();
		await expect(d2).resolves.toBeUndefined();

		const history = store.getState().scoped!.sources.history.ops
		expect(history.ids).toHaveLength(10);

	});

	it("requests history for all sources", async () => {
		const store = makeStore();
		const sources = generateSources(3);

		vi.setSystemTime(0); // because _createDraftDoc sets beacon lastSeenAtMs to 0

		for (const source of sources) {
			store.dispatch(sourcesActions._createDraftDoc({ sourceId: source.id, draft: createTestSourceDoc(source.lpk, source.id) }));
		}

		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue({
				status: "OK",
				ndebit: "ndebit-string",
				balance: 40,
				max_withdrawable: 30
			}),
			GetUserOperations: vi.fn().mockResolvedValue(makeOpsPage({ inInv: 5, outInv: 5 }))

		};

		getNostrClientMock.mockResolvedValue(fakeClient as any);

		const d = createDeferred<void>();

		store.dispatch(historyFetchAllRequested({ deferred: d }));


		await vi.runAllTimersAsync();


		expect(getNostrClientMock).toHaveBeenCalledTimes(6);

		expect(fakeClient.GetUserOperations).toHaveBeenCalledTimes(3);

		await expect(d).resolves.toBeUndefined();

		const ids = store.getState().scoped!.sources.history.ops.ids;
		expect(ids).toHaveLength(30);

	});

	it("fires a sync request for a source when some related action is captured for that source", async () => {
		const store = makeStore();
		vi.setSystemTime(0);



		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue({
				status: "OK",
				ndebit: "ndebit-string",
				balance: 40,
				max_withdrawable: 30
			}),
			GetUserOperations: vi.fn().mockResolvedValue(makeOpsPage({ inInv: 5, outInv: 5 }))

		};

		getNostrClientMock.mockResolvedValue(fakeClient as any);


		// add a new source
		const [source] = generateSources(1);
		store.dispatch(sourcesActions._createDraftDoc({ sourceId: source.id, draft: createTestSourceDoc(source.lpk, source.id) }));

		await vi.runAllTimersAsync();


		expect(getNostrClientMock).toHaveBeenCalledTimes(2);

		expect(fakeClient.GetUserOperations).toHaveBeenCalledTimes(1);

		const ids = store.getState().scoped!.sources.history.ops.ids;

		expect(ids).toHaveLength(10);

	})

	it("fires a sync request when a source has just become non stale", async () => {
		const artificalNowMs = 1_000_000;
		vi.setSystemTime(artificalNowMs);

		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue({
				status: "OK",
				ndebit: "ndebit-string",
				balance: 40,
				max_withdrawable: 30
			}),
			GetUserOperations: vi.fn().mockResolvedValue(makeOpsPage({ inInv: 5, outInv: 5 }))
		};
		getNostrClientMock.mockResolvedValue(fakeClient as any);

		const sources = generateSources(2);
		const store = makeStore(sources, false);


		// make first source non stale before loading identity
		store.dispatch(sourcesActions.recordBeaconForSource({
			sourceId: sources[0].id,
			name: "source1-beacon",
			seenAtMs: artificalNowMs - BEACON_STALE_OLDER_THAN + 3000
		}));


		store.dispatch(identityLoaded({ identity }));

		// non stale => non stale
		store.dispatch(sourcesActions.recordBeaconForSource({
			sourceId: sources[0].id,
			name: "source1-beacon",
			seenAtMs: artificalNowMs - BEACON_STALE_OLDER_THAN + 4000
		}));


		// stale => non stale
		store.dispatch(sourcesActions.recordBeaconForSource({
			sourceId: sources[1].id,
			name: "source2-beacon",
			seenAtMs: artificalNowMs - BEACON_STALE_OLDER_THAN + 4000
		}));



		await vi.waitFor(() => {
			if (getNostrClientMock.mock.calls.length === 0) throw new Error
		})



		expect(getNostrClientMock).toHaveBeenCalledTimes(2);

		expect(fakeClient.GetUserOperations).toHaveBeenCalledTimes(1);



		const ids = store.getState().scoped!.sources.history.ops.ids;

		expect(ids).toHaveLength(10);

	})
});
