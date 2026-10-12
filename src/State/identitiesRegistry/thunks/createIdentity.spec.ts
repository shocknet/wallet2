import { bytesToHex } from "@noble/hashes/utils";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { beforeEach, describe, expect, it } from "vitest";
import { appStateReducer } from "@/State/appState/slice";
import { identitiesRegistrySlice } from "../slice";
import { IdentityType, type IdentityKeys } from "../types";
import { configureStore } from "@reduxjs/toolkit";
import type { AppThunkDispatch } from "@/State/store/store";
import { createIdentity } from "./createIdentity";

const relays = ["wss://relay.example"];

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
	return configureStore({
		reducer: {
			identitiesRegistry: identitiesRegistrySlice.reducer,
			appState: appStateReducer,
		},
	});
}

let store: ReturnType<typeof testStore>;
let dispatch: AppThunkDispatch;

beforeEach(() => {
	store = testStore();
	dispatch = store.dispatch as unknown as AppThunkDispatch;
});

describe("createIdentity", () => {
	it("stores a local identity without activating it", async () => {
		const alice = localKey("alice");

		const runtime = await dispatch(createIdentity(alice.input));

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
		expect(runtime).toMatchObject({
			type: IdentityType.LOCAL_KEY,
			pubkey: alice.pubkey,
			privateKey: alice.privkey,
			relays,
		});
		expect(store.getState().identitiesRegistry.lastActiveIdentityId).toBeNull();
		expect(store.getState().appState.bootstrapped).toBe(true);
	});

	it("rejects a duplicate key and keeps the stored identity", async () => {
		const alice = localKey("alice");
		await dispatch(createIdentity(alice.input));
		const stored = store.getState().identitiesRegistry.entities[alice.pubkey];

		await expect(dispatch(createIdentity({ ...alice.input, label: "alice again" }))).rejects.toThrow(/already exists/);

		expect(store.getState().identitiesRegistry.entities[alice.pubkey]).toEqual(stored);
	});
});
