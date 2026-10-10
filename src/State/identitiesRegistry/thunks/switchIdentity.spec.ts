import { combineReducers, createListenerMiddleware } from "@reduxjs/toolkit";
import { bytesToHex } from "@noble/hashes/utils";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { addIdentityLifecycle } from "@/State/listeners/lifecycle/lifecycle";
import { identityModule } from "@/State/scoped/backups/identity/slice";
import { createStore } from "@/State/store/createStore";
import type { AppThunkDispatch } from "@/State/store/store";
import type { RuntimeIdentityKeys } from "@/shell/types";
import { memoryStorage } from "@tests/support/memoryStorage";
import { generateAndWrapDataKey } from "../helpers/datakey";
import { getLocalKeysIdentityApi } from "../helpers/identityNostrApi";
import { identitiesRegistryActions, identitiesRegistrySlice } from "../slice";
import { IdentityType, type IdentityKeys } from "../types";
import { switchIdentity } from "./switchIdentity";

// nostr-tools' nip44 rejects jsdom's TextEncoder output (a Uint8Array from another realm).
vi.hoisted(() => {
	const NativeTextEncoder = globalThis.TextEncoder;
	globalThis.TextEncoder = class extends NativeTextEncoder {
		encode(input?: string) {
			return new Uint8Array(super.encode(input));
		}
	} as typeof TextEncoder;
});

const mocks = vi.hoisted(() => ({
	mountScope: async (_session: { scopeId: string; dataKey: CryptoKey }): Promise<void> => undefined,
	resetClientsCluster: vi.fn(async () => undefined),
	clearSanctumIdentitySdk: vi.fn((_pubkey: string) => undefined),
	deleteLegacyBeaconsPersist: vi.fn(async (_pubkey: string) => undefined),
}));

vi.mock("@/State/store/store", () => ({
	default: {},
	mountScope: (session: { scopeId: string; dataKey: CryptoKey }) => mocks.mountScope(session),
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

type LocalIdentity = { registry: IdentityKeys; runtime: RuntimeIdentityKeys };

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
			label,
			unlockedAtMs: 1,
			relays,
			privateKey,
			wrappedDataKeyCiphertext,
		},
	};
}

function createWallet(identities: LocalIdentity[]) {
	const listenerMiddleware = createListenerMiddleware();
	const { store, mountScope } = createStore({
		reducers: { identitiesRegistry: identitiesRegistrySlice.reducer },
		createScopedReducer: (context) => ({
			reducer: combineReducers({ identity: identityModule.createReducer(context) }),
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
	mocks.mountScope = mountScope;
	for (const identity of identities) {
		store.dispatch(identitiesRegistryActions._createNewIdentity({ identity: identity.registry }));
	}

	// The thunk is typed against the app RootState; this store holds only the slices it reads.
	const dispatch = store.dispatch as unknown as AppThunkDispatch;

	return {
		switchTo: (identity: LocalIdentity) => dispatch(switchIdentity(identity.runtime)),
		registry: () => store.getState().identitiesRegistry,
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

		expect(wallet.registry().active).toEqual(alice.runtime);
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

		expect(wallet.registry().active).toEqual(alice.runtime);
		expect(mocks.resetClientsCluster).not.toHaveBeenCalled();
		expect(mocks.deleteLegacyBeaconsPersist).not.toHaveBeenCalled();
	});

	it("rejects an identity that is not in the registry", async () => {
		const wallet = createWallet([alice]);
		await wallet.switchTo(alice);
		vi.clearAllMocks();

		await expect(wallet.switchTo(bob)).rejects.toThrow(/does not exist/);

		expect(wallet.registry().active).toEqual(alice.runtime);
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
		expect(wallet.registry().active).toEqual(bob.runtime);
		expect(wallet.registry().lastActiveIdentityId).toBe(bob.runtime.pubkey);
		expect(wallet.draft()?.identity_pubkey).toBe(bob.runtime.pubkey);
	});
});
