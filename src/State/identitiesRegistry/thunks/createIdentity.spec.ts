import { combineReducers, createListenerMiddleware, type Action } from "@reduxjs/toolkit";
import { bytesToHex } from "@noble/hashes/utils";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appStateReducer } from "@/State/appState/slice";
import { addIdentityLifecycle } from "@/State/listeners/lifecycle/lifecycle";
import { identityModule } from "@/State/scoped/backups/identity/slice";
import { type AppScopedReducerContext } from "@/State/scope/createScopedReducer";
import type { ScopedRuntimeIdentity } from "@/shell/types";
import { createStore } from "@/State/store/createStore";
import type { AppThunkDispatch } from "@/State/store/store";
import { memoryStorage } from "@tests/support/memoryStorage";
import { getLocalKeysIdentityApi } from "../helpers/identityNostrApi";
import { identityDocDtag } from "../helpers/processDocs";
import { identitiesRegistrySlice, selectActiveIdentity } from "../slice";
import { IdentityType, type IdentityKeys } from "../types";
import { createIdentity } from "./createIdentity";

const relays = ["wss://relay.example"];

const mocks = vi.hoisted(() => ({
	resetClientsCluster: vi.fn(async () => undefined),
	clearSanctumIdentitySdk: vi.fn((_pubkey: string) => undefined),
	getNip78Event: vi.fn(async (
		_pubkey: string,
		_relays: string[],
		_dTag?: string,
	): Promise<{ content: string } | null> => null),
}));

vi.mock("@/Api/nostr", () => ({
	resetClientsCluster: () => mocks.resetClientsCluster(),
}));

vi.mock("@/Api/nostrHandler", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/Api/nostrHandler")>();
	return {
		...actual,
		getNip78Event: (pubkey: string, relayUrls: string[], dTag?: string) =>
			mocks.getNip78Event(pubkey, relayUrls, dTag),
	};
});

vi.mock("../helpers/sanctumIdentitySdkManager", () => ({
	clearSanctumIdentitySdk: (pubkey: string) => mocks.clearSanctumIdentitySdk(pubkey),
	getOrCreateSanctumIdentitySdk: () => {
		throw new Error("sanctum is not used in this spec");
	},
}));

function localKey(label: string) {
	const secretKey = generateSecretKey();
	const privkey = bytesToHex(secretKey);
	const pubkey = getPublicKey(secretKey);
	return {
		pubkey,
		privkey,
		input: {
			type: IdentityType.LOCAL_KEY as const,
			privkey,
			label,
			relays,
		},
	};
}

function testStore() {
	const listenerMiddleware = createListenerMiddleware();
	const { store } = createStore({
		reducers: {
			identitiesRegistry: identitiesRegistrySlice.reducer,
			appState: appStateReducer,
		},
		createScopedReducer: (context: AppScopedReducerContext) => ({
			reducer: combineReducers({
				identity: identityModule.createReducer(context),
				runtimeIdentity: (
					state: ScopedRuntimeIdentity = context.runtimeIdentity,
					_action: Action,
				) => state,
			}),
			persistKeys: [identityModule.persistKey(context.scopeId)],
		}),
		storage: memoryStorage(),
		prependMiddleware: [listenerMiddleware.middleware],
		appendMiddleware: [],
	});
	addIdentityLifecycle(
		listenerMiddleware.startListening.withTypes<ReturnType<typeof store.getState>, typeof store.dispatch>(),
		[],
	);
	return store;
}

let store: ReturnType<typeof testStore>;
// The thunk is typed against the app RootState; this store holds only the slices it reads.
let dispatch: AppThunkDispatch;

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getNip78Event.mockResolvedValue(null);
	store = testStore();
	dispatch = store.dispatch as unknown as AppThunkDispatch;
});

describe("createIdentity", () => {
	it("stores a local identity and activates it", async () => {
		const alice = localKey("alice");

		await dispatch(createIdentity(alice.input));

		const stored = store.getState().identitiesRegistry.entities[alice.pubkey] as IdentityKeys;
		expect(stored).toMatchObject({
			type: IdentityType.LOCAL_KEY,
			pubkey: alice.pubkey,
			label: "alice",
			relays,
			localSecret: { storage: "inline", privateKey: alice.privkey },
			wrappedDataKey: { storage: "inline" },
		});
		expect(stored.wrappedDataKey.storage).toBe("inline");
		if (stored.wrappedDataKey.storage === "inline") {
			expect(stored.wrappedDataKey.wrappedDataKeyCiphertext.length).toBeGreaterThan(0);
		}
		expect(selectActiveIdentity(store.getState() as never)).toMatchObject({
			type: IdentityType.LOCAL_KEY,
			pubkey: alice.pubkey,
			label: "alice",
		});
		expect(store.getState().scoped?.runtimeIdentity).toMatchObject({
			pubkey: alice.pubkey,
			type: IdentityType.LOCAL_KEY,
			privateKey: alice.privkey,
			relays,
		});
		expect(store.getState().identitiesRegistry.lastActiveIdentityId).toBe(alice.pubkey);
		expect(store.getState().appState.bootstrapped).toBe(true);
		expect(store.getState().scoped?.identity.draft?.identity_pubkey).toBe(alice.pubkey);
		expect(mocks.getNip78Event).toHaveBeenCalledWith(alice.pubkey, relays, identityDocDtag);
		expect(mocks.resetClientsCluster).not.toHaveBeenCalled();
		expect(mocks.clearSanctumIdentitySdk).not.toHaveBeenCalled();
	});

	it("tears down the active identity when creating another", async () => {
		const alice = localKey("alice");
		const bob = localKey("bob");
		await dispatch(createIdentity(alice.input));
		vi.clearAllMocks();
		mocks.getNip78Event.mockResolvedValue(null);

		await dispatch(createIdentity(bob.input));

		expect(mocks.resetClientsCluster).toHaveBeenCalledTimes(1);
		expect(mocks.clearSanctumIdentitySdk).not.toHaveBeenCalled();
		expect(store.getState().identitiesRegistry.entities[alice.pubkey]).toBeDefined();
		expect(selectActiveIdentity(store.getState() as never)).toMatchObject({
			pubkey: bob.pubkey,
		});
		expect(store.getState().scoped?.runtimeIdentity).toMatchObject({
			pubkey: bob.pubkey,
			privateKey: bob.privkey,
			relays,
		});
		expect(store.getState().identitiesRegistry.lastActiveIdentityId).toBe(bob.pubkey);
		expect(store.getState().scoped?.identity.draft?.identity_pubkey).toBe(bob.pubkey);
	});

	it("rejects a duplicate key and keeps the stored identity", async () => {
		const alice = localKey("alice");
		await dispatch(createIdentity(alice.input));
		const stored = store.getState().identitiesRegistry.entities[alice.pubkey];
		vi.clearAllMocks();

		await expect(dispatch(createIdentity({ ...alice.input, label: "alice again" }))).rejects.toThrow(/already exists/);

		expect(store.getState().identitiesRegistry.entities[alice.pubkey]).toEqual(stored);
		expect(selectActiveIdentity(store.getState() as never)).toMatchObject({ pubkey: alice.pubkey });
		expect(store.getState().scoped?.identity.draft?.identity_pubkey).toBe(alice.pubkey);
		expect(mocks.getNip78Event).not.toHaveBeenCalled();
		expect(mocks.resetClientsCluster).not.toHaveBeenCalled();
	});

	it("stops after a remote identity doc decrypts", async () => {
		const alice = localKey("alice");
		const api = await getLocalKeysIdentityApi(
			{ publicKey: alice.pubkey, privateKey: alice.privkey },
			relays,
		);
		const content = await api.encrypt(alice.pubkey, "{\"doc\":true}");
		mocks.getNip78Event.mockImplementation(async (_pubkey, _relayUrls, dTag) => (
			dTag === identityDocDtag ? { content } : null
		));

		await dispatch(createIdentity(alice.input));

		expect(mocks.getNip78Event).toHaveBeenCalledTimes(1);
		expect(mocks.getNip78Event).toHaveBeenCalledWith(alice.pubkey, relays, identityDocDtag);
		expect(selectActiveIdentity(store.getState() as never)).toMatchObject({ pubkey: alice.pubkey });
		expect(store.getState().scoped?.identity.draft?.identity_pubkey).toBe(alice.pubkey);
	});
});
