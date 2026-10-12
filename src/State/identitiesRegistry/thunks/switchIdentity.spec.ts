import { combineReducers, createListenerMiddleware, type Action } from "@reduxjs/toolkit";
import { bytesToHex } from "@noble/hashes/utils";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { addIdentityLifecycle } from "@/State/listeners/lifecycle/lifecycle";
import { identityModule } from "@/State/scoped/backups/identity/slice";
import { type AppScopedReducerContext } from "@/State/scope/createScopedReducer";
import type { ScopedRuntimeIdentity } from "@/shell/types";
import { createStore } from "@/State/store/createStore";
import type { AppThunkDispatch } from "@/State/store/store";
import { memoryStorage } from "@tests/support/memoryStorage";
import { generateAndWrapDataKey } from "../helpers/datakey";
import { getLocalKeysIdentityApi } from "../helpers/identityNostrApi";
import { identitiesRegistryActions, identitiesRegistrySlice, selectActiveIdentity } from "../slice";
import { IdentityType, type IdentityKeys } from "../types";
import { switchIdentity } from "./switchIdentity";

const mocks = vi.hoisted(() => ({
	resetClientsCluster: vi.fn(async () => undefined),
	clearSanctumIdentitySdk: vi.fn((_pubkey: string) => undefined),
	deleteLegacyBeaconsPersist: vi.fn(async (_pubkey: string) => undefined),
}));

vi.mock("@/State/store/store", () => ({
	default: {},
}));

vi.mock("@/Api/nostr", () => ({
	resetClientsCluster: () => mocks.resetClientsCluster(),
}));

vi.mock("../helpers/sanctumIdentitySdkManager", () => ({
	clearSanctumIdentitySdk: (pubkey: string) => mocks.clearSanctumIdentitySdk(pubkey),
	getOrCreateSanctumIdentitySdk: () => {
		throw new Error("sanctum is not used in this spec");
	},
}));

vi.mock("../helpers/deleteIdentityStorage", () => ({
	deleteLegacyBeaconsPersist: (pubkey: string) => mocks.deleteLegacyBeaconsPersist(pubkey),
}));

type LocalIdentity = {
	registry: IdentityKeys;
	runtime: Extract<ScopedRuntimeIdentity, { type: IdentityType.LOCAL_KEY }>;
};

async function createLocalIdentity(label: string): Promise<LocalIdentity> {
	const secretKey = generateSecretKey();
	const privateKey = bytesToHex(secretKey);
	const pubkey = getPublicKey(secretKey);
	const relays = ["wss://relay.example"];
	const api = await getLocalKeysIdentityApi({ publicKey: pubkey, privateKey }, relays);
	const wrappedDataKeyCiphertext = await generateAndWrapDataKey(pubkey, api);
	return {
		registry: {
			type: IdentityType.LOCAL_KEY,
			pubkey,
			label,
			createdAt: 1,
			relays,
			wrappedDataKey: { storage: "inline", wrappedDataKeyCiphertext },
			localSecret: { storage: "inline", privateKey },
		},
		runtime: {
			type: IdentityType.LOCAL_KEY,
			pubkey,
			privateKey,
			relays,
			unlockedAtMs: 1,
		},
	};
}

function createWallet(identities: LocalIdentity[]) {
	const listenerMiddleware = createListenerMiddleware();
	const { store } = createStore({
		reducers: { identitiesRegistry: identitiesRegistrySlice.reducer },
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
	for (const identity of identities) {
		store.dispatch(identitiesRegistryActions._createNewIdentity({ identity: identity.registry }));
	}

	// The thunk is typed against the app RootState; this store holds only the slices it reads.
	const dispatch = store.dispatch as unknown as AppThunkDispatch;

	return {
		switchTo: (identity: LocalIdentity) => dispatch(switchIdentity(identity.runtime)),
		registry: () => store.getState().identitiesRegistry,
		active: () => selectActiveIdentity(store.getState() as never),
		session: () => store.getState().scoped?.runtimeIdentity,
		draft: () => store.getState().scoped?.identity.draft,
	};
}

let alice: LocalIdentity;
let bob: LocalIdentity;

beforeAll(async () => {
	alice = await createLocalIdentity("alice");
	bob = await createLocalIdentity("bob");
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("switchIdentity", () => {
	it("makes a registered identity active and mounts its identity doc", async () => {
		const wallet = createWallet([alice, bob]);

		await wallet.switchTo(alice);

		expect(wallet.active()).toEqual(alice.registry);
		expect(wallet.session()).toEqual(alice.runtime);
		expect(wallet.registry().lastActiveIdentityId).toBe(alice.runtime.pubkey);
		expect(wallet.draft()?.identity_pubkey).toBe(alice.runtime.pubkey);
		expect(mocks.deleteLegacyBeaconsPersist).toHaveBeenCalledWith(alice.runtime.pubkey);
	});

	it("does not tear down when nothing was active", async () => {
		const wallet = createWallet([alice, bob]);

		await wallet.switchTo(alice);

		expect(mocks.resetClientsCluster).not.toHaveBeenCalled();
		expect(mocks.clearSanctumIdentitySdk).not.toHaveBeenCalled();
	});

	it("does nothing when switching to the identity that is already active", async () => {
		const wallet = createWallet([alice, bob]);
		await wallet.switchTo(alice);
		vi.clearAllMocks();

		await wallet.switchTo(alice);

		expect(wallet.active()).toEqual(alice.registry);
		expect(wallet.session()).toEqual(alice.runtime);
		expect(mocks.resetClientsCluster).not.toHaveBeenCalled();
		expect(mocks.deleteLegacyBeaconsPersist).not.toHaveBeenCalled();
	});

	it("rejects an identity that is not in the registry", async () => {
		const wallet = createWallet([alice]);
		await wallet.switchTo(alice);
		vi.clearAllMocks();

		await expect(wallet.switchTo(bob)).rejects.toThrow(/does not exist/);

		expect(wallet.active()).toEqual(alice.registry);
		expect(wallet.session()).toEqual(alice.runtime);
		expect(wallet.registry().lastActiveIdentityId).toBe(alice.runtime.pubkey);
		expect(wallet.draft()?.identity_pubkey).toBe(alice.runtime.pubkey);
		expect(mocks.resetClientsCluster).not.toHaveBeenCalled();
	});

	it("tears down the active identity and switches to another registered identity", async () => {
		const wallet = createWallet([alice, bob]);
		await wallet.switchTo(alice);
		vi.clearAllMocks();

		await wallet.switchTo(bob);

		expect(mocks.resetClientsCluster).toHaveBeenCalledTimes(1);
		expect(mocks.clearSanctumIdentitySdk).not.toHaveBeenCalled();
		expect(mocks.deleteLegacyBeaconsPersist).toHaveBeenCalledWith(bob.runtime.pubkey);
		expect(wallet.active()).toEqual(bob.registry);
		expect(wallet.session()).toMatchObject({
			pubkey: bob.runtime.pubkey,
			privateKey: bob.runtime.privateKey,
		});
		expect(wallet.registry().lastActiveIdentityId).toBe(bob.runtime.pubkey);
		expect(wallet.draft()?.identity_pubkey).toBe(bob.runtime.pubkey);
	});
});
