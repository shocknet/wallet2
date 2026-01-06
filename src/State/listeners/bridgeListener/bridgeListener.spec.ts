import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	configureStore,
	combineReducers,
	createListenerMiddleware,
} from "@reduxjs/toolkit";
import { sourcesSlice, sourcesActions } from "@/State/scoped/backups/sources/slice";
import { generateSources, GenSource, getPreloadedSourcesState } from "@tests/support/sourcesHelpers";
import { addIdentityLifecycle } from "../lifecycle/lifecycle";
import { identityLoaded, identityUnloaded } from "../actions";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import type { NprofileSourceDocV0 } from "@/State/scoped/backups/sources/schema";
import { bridgeListenerSpec, bridgePredicate } from "./bridgeListener";

import { getNostrClient } from "@/Api/nostr";
import Bridge from "@/Api/bridge";
import { nip98 } from "nostr-tools";
import logger from "@/Api/helpers/logger";
import { createDeferred } from "@/lib/deferred";
import { SourceType } from "@/State/scoped/common";
import { runTimeReducer } from "@/State/runtime/slice";


vi.mock("@/Api/nostr", () => ({
	getNostrClient: vi.fn(),
}));

vi.mock("@/Api/bridge", () => ({
	default: vi.fn(),
}));

vi.mock("nostr-tools", async () => {
	const actual = await vi.importActual<typeof import("nostr-tools")>("nostr-tools");
	return {
		...actual,
		nip98: {
			...actual.nip98,
			getToken: vi.fn(),
		},
	};
});

const getNostrClientMock = vi.mocked(getNostrClient);
const BridgeMock = vi.mocked(Bridge);
const getTokenMock = vi.mocked(nip98.getToken);


const errorLogSpy = vi.spyOn(logger, "error");
const infoLogSpy = vi.spyOn(logger, "info");


const identity: Identity = {
	type: IdentityType.LOCAL_KEY,
	label: "label",
	createdAt: Date.now(),
	pubkey: "hexhexhex",
	privkey: "hexhexhex",
	relays: ["wss://example.com"],
};

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

const makeStore = (sourcesGen: GenSource[]) => {
	const preloadedState = getPreloadedSourcesState(sourcesGen);

	const listenerMw = createListenerMiddleware();

	const store = configureStore({
		reducer: {
			scoped: combineReducers({
				sources: sourcesSlice.reducer,
			}),
			runtime: runTimeReducer
		},
		preloadedState: {
			scoped: {
				sources: preloadedState,
			},
		},
		middleware: gdm =>
			gdm({
				serializableCheck: { ignoredActions: [] },
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
	addIdentityLifecycle(startAppListening, [bridgeListenerSpec]);

	store.dispatch(identityLoaded({ identity }));

	return store;
};

describe("bridgeListener integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});


	it("calls nostr + bridge and dispatches setVanityName", async () => {
		const sources = generateSources(1);
		const store = makeStore(sources);


		const d = store.getState().scoped.sources.docs.entities[sources[0].id]
			.draft as NprofileSourceDocV0;

		// fake nostr client
		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue({
				status: "OK",
				bridge_url: "https://bridge-from-userinfo.com", // Because our source will have a bridge_url it will ignore pub's recommendation here
				noffer: "noffer",
			}),
			GetLnurlPayLink: vi.fn().mockResolvedValue({
				status: "OK",
				k1: "k1-value",
			}),
		};
		getNostrClientMock.mockResolvedValue(fakeClient as any);

		// nip98.getToken and bridge
		getTokenMock.mockResolvedValue("nostr-header");
		const bridgeInstance = {
			GetOrCreateNofferName: vi.fn().mockResolvedValue({
				status: "OK",
				vanity_name: "alice",
			}),
		};
		BridgeMock.mockReturnValue(bridgeInstance as any);



		const newBridgeUrl = "https://custom-bridge.example";

		const m = store.getState().scoped.sources.metadata.entities[sources[0].id];

		expect(m.vanityName).toEqual(undefined);

		store.dispatch(
			sourcesActions.applyRemoteSource({
				sourceId: d.source_id,
				remote: {
					...d,
					bridgeUrl: {
						...d.bridgeUrl,
						clock: {
							v: 1,
							by: "me"
						},
						value: newBridgeUrl,
					},
				},
			}),
		);



		await vi.waitFor(() => {
			if (!getNostrClientMock.mock.calls.length) throw new Error;
		})


		// nostr client called with right args
		expect(getNostrClientMock).toHaveBeenCalledTimes(1);
		expect(getNostrClientMock).toHaveBeenCalledWith(
			{
				pubkey: d.lpk,
				relays: []

			},
			expect.objectContaining(d.keys), // source.keys
		);

		// nostr calls
		expect(fakeClient.GetUserInfo).toHaveBeenCalledTimes(1);


		// nip98 token call
		expect(getTokenMock).toHaveBeenCalledTimes(1);
		expect(getTokenMock.mock.calls[0][0]).toBe(
			`${newBridgeUrl}/api/v1/noffer/vanity`,
		);


		// bridge usage
		expect(BridgeMock).toHaveBeenCalledWith(
			newBridgeUrl,
			"nostr-header",
		);
		expect(bridgeInstance.GetOrCreateNofferName).toHaveBeenCalledWith({
			noffer: "noffer",
		});


		const mAfter = store.getState().scoped.sources.metadata.entities[sources[0].id];
		expect(mAfter.vanityName).toEqual("alice@custom-bridge.example");
	});

	it("skips LV_IDENTIFIER sources (lightning.video) completely", async () => {
		const sources = generateSources(1);
		const store = makeStore(sources);

		const lvAddress = "something@lightning.video";

		const d = store.getState().scoped.sources.docs.entities[sources[0].id]
			.draft as NprofileSourceDocV0;

		// force vanityName to look like lightning.video
		store.dispatch(
			sourcesActions.setVanityName({
				sourceId: d.source_id,
				vanityName: lvAddress,
			}),
		);

		const m = store.getState().scoped.sources.metadata.entities[sources[0].id];

		expect(m.vanityName).toEqual(lvAddress);



		const fakeClient = {
			GetUserInfo: vi.fn(),
			GetLnurlPayLink: vi.fn(),
		};
		getNostrClientMock.mockResolvedValue(fakeClient as any);

		store.dispatch(
			sourcesActions.applyRemoteSource({
				sourceId: d.source_id,
				remote: {
					...d,
					bridgeUrl: {
						...d.bridgeUrl,
						value: "https://should-not-be-used.com",
					},
				},
			}),
		);


		await vi.runAllTimersAsync();

		// absolutely nothing should happen
		expect(getNostrClientMock).not.toHaveBeenCalled();
		expect(getTokenMock).not.toHaveBeenCalled();
		expect(BridgeMock).not.toHaveBeenCalled();

		const mAfter = store.getState().scoped.sources.metadata.entities[sources[0].id];

		expect(mAfter.vanityName).toEqual(lvAddress);

	});

	it("does not set vanityName when some api fails", async () => {
		const sources = generateSources(3);
		const store = makeStore(sources);
		const dispatchSpy = vi.spyOn(store, "dispatch");

		const d1 = store.getState().scoped.sources.docs.entities[sources[0].id]
			.draft as NprofileSourceDocV0;

		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue({
				status: "ERROR",
				reason: "bad stuff",
			}),
			GetLnurlPayLink: vi.fn(),
		};
		getNostrClientMock.mockResolvedValue(fakeClient as any);

		store.dispatch(
			sourcesActions.applyRemoteSource({
				sourceId: d1.source_id,
				remote: {
					...d1,
					bridgeUrl: {
						...d1.bridgeUrl,
						value: "https://example.com",
					},
				},
			}),
		);

		await vi.runAllTimersAsync();

		expect(BridgeMock).not.toHaveBeenCalled();
		expect(getTokenMock).not.toHaveBeenCalled();



		// no setVanityName dispatched
		expect(
			dispatchSpy.mock.calls.some(
				([action]) => action.type === sourcesActions.setVanityName.type,
			),
		).toBe(false);
	});

	it("treats TaskAbortError as a normal cancellation", async () => {
		const sources = generateSources(1);
		const store = makeStore(sources);
		const dispatchSpy = vi.spyOn(store, "dispatch");

		const d = store.getState().scoped.sources.docs.entities[sources[0].id]
			.draft as NprofileSourceDocV0;

		// fake nostr client
		const fakeClient = {
			GetUserInfo: vi.fn().mockResolvedValue(delay(10)),
		};
		getNostrClientMock.mockResolvedValue(fakeClient as any);



		store.dispatch(
			sourcesActions.applyRemoteSource({
				sourceId: d.source_id,
				remote: {
					...d,
					bridgeUrl: {
						...d.bridgeUrl,
						value: "https://example.com",
					},
				},
			}),
		);




		const deferred = createDeferred<void>()
		store.dispatch(identityUnloaded({ deferred }))

		await vi.runAllTimersAsync();



		expect(infoLogSpy).toHaveBeenCalledTimes(1);
		expect(infoLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("cancelled normally"),
		);
		expect(errorLogSpy).not.toHaveBeenCalled();

		// no vanity dispatch on abort
		expect(
			dispatchSpy.mock.calls.some(
				([action]) => action.type === sourcesActions.setVanityName.type,
			),
		).toBe(false);
	});
});



describe("bridgeListener predicate", () => {
	const sourceId = "src1";

	type Draft = {
		type: SourceType;
		bridgeUrl?: { value: string | null };
	};

	type SourceEntity = { draft: Draft };

	type TestState = {
		scoped: {
			sources: {
				docs: {
					entities: Record<string, SourceEntity | undefined>;
				};
			};
		};
	};

	const makeState = (entities: Record<string, Draft | undefined>): TestState => ({
		scoped: {
			sources: {
				docs: {
					entities: Object.fromEntries(
						Object.entries(entities).map(([id, draft]) =>
							draft ? [id, { draft }] : [id, undefined],
						),
					),
				},
			},
		},
	});

	const nprofileDraft = (bridge: string | null): Draft => ({
		type: SourceType.NPROFILE_SOURCE,
		bridgeUrl: { value: bridge },
	});

	const lightningDraft = (): Draft => ({
		type: SourceType.LIGHTNING_ADDRESS_SOURCE,
	});

	const bridgeAction = (
		kind: "create" | "apply" | "update",
		sourceId: string,
	): any => {
		const typeMap = {
			create: sourcesActions._createDraftDoc.type,
			apply: sourcesActions.applyRemoteSource.type,
			update: sourcesActions.updateBridgeUrl.type,
		} as const;

		return {
			type: typeMap[kind],
			payload: { sourceId },
		};
	};

	type Case = {
		name: string;
		action: any;
		prev: TestState;
		curr: TestState;
		expected: boolean;
	};

	it.each<Case>([
		{
			name: "non-bridge action => false",
			action: sourcesActions.setVanityName({
				sourceId,
				vanityName: "x",
			}),
			prev: makeState({ [sourceId]: nprofileDraft("https://old.com") }),
			curr: makeState({ [sourceId]: nprofileDraft("https://new.com") }),
			expected: false,
		},
		{
			name: "bridge action but curr source missing => false",
			action: bridgeAction("apply", sourceId),
			prev: makeState({ [sourceId]: nprofileDraft("https://old.com") }),
			curr: makeState({}), // deleted
			expected: false,
		},
		{
			name: "new NPROFILE source via _createDraftDoc => true",
			action: bridgeAction("create", sourceId),
			prev: makeState({}),
			curr: makeState({ [sourceId]: nprofileDraft("https://bridge.com") }),
			expected: true,
		},
		{
			name: "new non-NPROFILE source => false",
			action: bridgeAction("create", sourceId),
			prev: makeState({}),
			curr: makeState({ [sourceId]: lightningDraft() }),
			expected: false,
		},
		{
			name: "bridgeUrl changed on NPROFILE => true",
			action: bridgeAction("apply", sourceId),
			prev: makeState({ [sourceId]: nprofileDraft("https://old.com") }),
			curr: makeState({ [sourceId]: nprofileDraft("https://new.com") }),
			expected: true,
		},
		{
			name: "bridgeUrl unchanged on NPROFILE => false",
			action: bridgeAction("apply", sourceId),
			prev: makeState({ [sourceId]: nprofileDraft("https://same.com") }),
			curr: makeState({ [sourceId]: nprofileDraft("https://same.com") }),
			expected: false,
		},
		{
			name: "curr bridgeUrl empty => true",
			action: bridgeAction("apply", sourceId),
			prev: makeState({ [sourceId]: nprofileDraft("https://old.com") }),
			curr: makeState({ [sourceId]: nprofileDraft(null) }),
			expected: true,
		},
		{
			name: "prev type not NPROFILE, curr is NPROFILE => false (not justCreated and no bridgeChanged)",
			action: bridgeAction("apply", sourceId),
			prev: makeState({ [sourceId]: lightningDraft() }),
			curr: makeState({ [sourceId]: nprofileDraft("https://bridge.com") }),
			expected: false,
		},
		{
			name: "curr type not NPROFILE => false early",
			action: bridgeAction("apply", sourceId),
			prev: makeState({ [sourceId]: nprofileDraft("https://old.com") }),
			curr: makeState({ [sourceId]: lightningDraft() }),
			expected: false,
		},
	])("$name", ({ action, prev, curr, expected }) => {
		const result = bridgePredicate(
			action,
			curr as any,
			prev as any,
		);
		expect(result).toBe(expected);
	});
});
