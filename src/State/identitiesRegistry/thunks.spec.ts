import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Identity } from "./types";
import { IdentityType } from "./types";
import type { RuntimeIdentity } from "./types";

const {
	unwrapIdentityDataKeyMock,
	getIdentityNostrApiMock,
	injectNewScopedReducerMock,
	waitForRehydrateKeysMock,
	deleteIdentityPersistedDataMock,
	persistorFlushMock,
} = vi.hoisted(() => ({
	unwrapIdentityDataKeyMock: vi.fn(async () => ({ kid: "k" }) as unknown as CryptoKey),
	getIdentityNostrApiMock: vi.fn(async () => ({ getPublicKey: async () => "pub" })),
	injectNewScopedReducerMock: vi.fn(),
	waitForRehydrateKeysMock: vi.fn(async () => { }),
	deleteIdentityPersistedDataMock: vi.fn(async () => { }),
	persistorFlushMock: vi.fn(async () => { }),
}));

vi.mock("./helpers/identityDataKey", () => ({
	hasEncryptedPersistDescriptor: vi.fn(() => true),
	migrateIdentityToEncryptedPersist: vi.fn(async (i: Identity) => i),
	prepareIdentityForEncryptedPersist: vi.fn(async (i: Identity) => i),
	unwrapIdentityDataKey: unwrapIdentityDataKeyMock,
}));

vi.mock("./helpers/datakey", () => ({
	unwrapDataKeyWithNip44: vi.fn(async () => ({ kid: "k" }) as unknown as CryptoKey),
}));

vi.mock("./helpers/identityNostrApi", () => ({
	default: getIdentityNostrApiMock,
}));

vi.mock("../scope/inject", () => ({
	injectNewScopedReducer: injectNewScopedReducerMock,
	getAllScopedPersistKeys: vi.fn(() => ({
		identity: "persist:_identity@pub",
		sources: "persist:__sources@pub",
	})),
	removeScoped: vi.fn(),
}));

vi.mock("./middleware/switcher", () => ({
	waitForRehydrateKeys: waitForRehydrateKeysMock,
}));

vi.mock("@/State/store/store", () => ({
	persistor: {
		flush: persistorFlushMock,
	},
}));

vi.mock("./helpers/deleteIdentityStorage", () => ({
	deleteIdentityPersistedData: deleteIdentityPersistedDataMock,
}));

vi.mock("@/Api/nostr", () => ({
	resetClientsCluster: vi.fn(async () => { }),
}));

vi.mock("@/constants", () => ({
	getDeviceId: vi.fn(() => "device-test"),
}));

vi.mock("@/Api/helpers/debugLog", () => ({
	default: {
		withContext: vi.fn(() => ({
			info: vi.fn(),
			debug: vi.fn(),
			error: vi.fn(),
		})),
		removeIdentityContext: vi.fn(),
		setIdentityContext: vi.fn(),
	},
}));

import { deleteIdentity, LAST_ACTIVE_IDENTITY_PUBKEY_KEY, switchIdentity } from "./thunks";
import { identitiesRegistryActions } from "./slice";
import { identityLoaded } from "../listeners/actions";

describe("switchIdentity", () => {
	const runtimeIdentity: RuntimeIdentity = {
		type: IdentityType.LOCAL_KEY,
		pubkey: "pub",
		label: "Local",
		unlockedAtMs: Date.now(),
		wrappedDataKeyCiphertext: "cipher",
		privateKey: "00".repeat(32),
		relays: ["wss://relay"],
	};

	const registryIdentity: Identity = {
		type: IdentityType.LOCAL_KEY,
		pubkey: "pub",
		label: "Local",
		createdAt: 1,
		relays: ["wss://relay"],
		wrappedDataKey: { storage: "inline", wrappedDataKeyCiphertext: "cipher" },
		localSecret: {
			storage: "inline_encrypted",
			scheme: "app-password-only-v1",
			passwordMode: "default",
			encryptedPrivkey: { alg: "AES-GCM", nonce: "nonce", ciphertext: "ct" },
		},
	};

	const makeState = () => ({
		activeIdentityRuntime: {
			active: null,
		},
		identitiesRegistry: {
			activePubkey: null,
			entities: { [registryIdentity.pubkey]: registryIdentity },
		},
		scoped: {
			identity: {
				draft: {
					doc_type: "doc/shockwallet/identity_",
					schema_rev: 0,
					identity_pubkey: registryIdentity.pubkey,
					favorite_source_id: { value: null, clock: { v: 0, by: "test" } },
					created_at: 1,
					theme: { value: "system", clock: { v: 0, by: "test" } },
					fiatCurrency: { value: "USD", clock: { v: 0, by: "test" } },
				},
				dirty: false,
			},
		},
	});

	beforeEach(() => {
		getIdentityNostrApiMock.mockClear();
		injectNewScopedReducerMock.mockClear();
		waitForRehydrateKeysMock.mockClear();
		localStorage.clear();
	});

	it("mounts the runtime identity on boot", async () => {
		const state = makeState();
		const dispatched: unknown[] = [];
		const dispatch = vi.fn((action: unknown) => {
			dispatched.push(action);
			return action;
		});
		const getState = vi.fn(() => state);

		await switchIdentity(runtimeIdentity, true)(dispatch as never, getState as never, undefined as never);

		expect(getIdentityNostrApiMock).toHaveBeenCalledTimes(1);
		expect(injectNewScopedReducerMock).toHaveBeenCalledTimes(1);
		expect(waitForRehydrateKeysMock).toHaveBeenCalledTimes(1);
		expect(dispatched.some((a) => identityLoaded.match(a))).toBe(true);
		expect(localStorage.getItem("__shockwallet_lai_")).toBe("pub");
	});

	it("rejects unmigrated registry identities", async () => {
		const legacyRegistryIdentity = {
			type: IdentityType.LOCAL_KEY,
			pubkey: "pub",
			label: "Local",
			createdAt: 1,
			privkey: "00".repeat(32),
			relays: ["wss://relay"],
		};
		const state = {
			...makeState(),
			identitiesRegistry: {
				activePubkey: null,
				entities: { pub: legacyRegistryIdentity },
			},
		};
		const dispatch = vi.fn((action: unknown) => action);
		const getState = vi.fn(() => state);

		await expect(
			switchIdentity(runtimeIdentity, true)(dispatch as never, getState as never, undefined as never)
		).rejects.toThrow("Identity has not completed secure migration");
	});
});

describe("deleteIdentity", () => {
	const registryIdentity: Identity = {
		type: IdentityType.LOCAL_KEY,
		pubkey: "pub",
		label: "Local",
		createdAt: 1,
		relays: ["wss://relay"],
		wrappedDataKey: { storage: "inline", wrappedDataKeyCiphertext: "cipher" },
		localSecret: {
			storage: "inline_encrypted",
			scheme: "app-password-only-v1",
			passwordMode: "default",
			encryptedPrivkey: { alg: "AES-GCM", nonce: "nonce", ciphertext: "ct" },
		},
	};

	beforeEach(() => {
		deleteIdentityPersistedDataMock.mockClear();
		persistorFlushMock.mockClear();
		localStorage.clear();
	});

	it("removes persisted data and dispatches removeIdentity", async () => {
		const dispatched: unknown[] = [];
		const dispatch = vi.fn((action: unknown) => {
			dispatched.push(action);
			return action;
		});
		const getState = vi.fn(() => ({
			activeIdentityRuntime: { active: null },
			identitiesRegistry: {
				entities: { pub: registryIdentity },
			},
		}));

		await deleteIdentity("pub")(dispatch as never, getState as never, undefined as never);

		expect(deleteIdentityPersistedDataMock).toHaveBeenCalledWith(registryIdentity);
		expect(dispatched.some((action) =>
			identitiesRegistryActions.removeIdentity.match(action as never)
		)).toBe(true);
		expect(persistorFlushMock).toHaveBeenCalledTimes(1);
	});

	it("clears last-active pointer when deleting that identity", async () => {
		localStorage.setItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY, "pub");
		const dispatch = vi.fn((action: unknown) => action);
		const getState = vi.fn(() => ({
			activeIdentityRuntime: { active: null },
			identitiesRegistry: {
				entities: { pub: registryIdentity },
			},
		}));

		await deleteIdentity("pub")(dispatch as never, getState as never, undefined as never);

		expect(localStorage.getItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY)).toBeNull();
	});

	it("rejects deleting the active identity", async () => {
		const dispatch = vi.fn((action: unknown) => action);
		const getState = vi.fn(() => ({

			identitiesRegistry: {
				entities: { pub: registryIdentity },
				active: {
					type: IdentityType.LOCAL_KEY,
					pubkey: "pub",
					label: "Local",
					unlockedAtMs: Date.now(),
					wrappedDataKeyCiphertext: "cipher",
					privateKey: "00".repeat(32),
					relays: ["wss://relay"],
				},
			},
		}));

		await expect(
			deleteIdentity("pub")(dispatch as never, getState as never, undefined as never)
		).rejects.toThrow("Cannot delete the active identity");
		expect(deleteIdentityPersistedDataMock).not.toHaveBeenCalled();
	});
});
