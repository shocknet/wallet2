
import { type UnsignedEvent, type Event, nip44, finalizeEvent } from "nostr-tools";
import { NostrKeyPair } from "@/Api/nostrHandler";
import { hexToBytes } from "@noble/hashes/utils";
import { NOSTR_RELAYS } from "@/constants";
import { normalizeWsUrl } from "@/lib/url";
import { IdentityType } from "../types";
import type { RuntimeIdentity, RuntimeIdentitySanctum } from "@/shell/types";
import { getExtentionsWithRetries } from "@/lib/nip07Extension";
import store from "@/State/store/store";
import { selectActiveIdentity, selectActiveRuntimeSanctumTokensData } from "../slice";
import {
	clearIdentitySanctumTokensData,
	markSanctumReauthRequired,
	setIdentitySanctumTokensData,
} from "../identitySyncThunks";
import { type SanctumApi, type TokenDataAdapter } from "sanctum-sdk";
import {
	clearSanctumIdentitySdk,
	getOrCreateSanctumIdentitySdk,
} from "./sanctumIdentitySdkManager";


export function adaptSanctumDKApiToIdentityNostrApi(api: SanctumApi): IdentityNostrApi {
	return {
		getPublicKey: () => api.getPublicKey(),
		getRelays: () => api.getRelays(),
		encrypt: (pubkey, plaintext) => api.encrypt(plaintext, pubkey),
		decrypt: (pubkey, ciphertext) => api.decrypt(ciphertext, pubkey),
		signEvent: async (unsigned) => {
			const signed = await api.signEvent(JSON.stringify(unsigned));
			return JSON.parse(signed) as Event;
		},
	};
}


export interface IdentityNostrApi {
	getPublicKey: () => Promise<string>
	signEvent: (e: UnsignedEvent) => Promise<Event>
	getRelays: () => Promise<Record<string, { read: boolean, write: boolean }>>
	encrypt(pubkey: string, plaintext: string): Promise<string>
	decrypt(pubkey: string, ciphertext: string): Promise<string>
}

function relaysToRecord(urls: string[]): Record<string, { read: boolean; write: boolean }> {
	return urls.reduce((acc: Record<string, { read: boolean; write: boolean }>, r) => {
		acc[r] = { read: true, write: true };
		return acc;
	}, {});
}

/** Extension is used for signing / NIP-04|44; relay list comes from the app identity, not the extension. */
export async function getNostrExtensionIdentityApi(
	pubkey?: string,
	relayUrls?: string[]
): Promise<IdentityNostrApi> {
	const ext = await getExtentionsWithRetries()
	if (!ext) {
		throw new Error("No or invalid nostr extension is installed on this browser");
	}
	if (!ext.nip44 || !ext.nip04) {
		throw new Error("This Nostr Extension does not implement nip04/nip44");
	}
	const nipx4 = (ext.nip44 || ext.nip04);

	const extensionKey = await ext.getPublicKey();
	if (pubkey && extensionKey !== pubkey) {
		throw new Error("Identity does not match this Nostr Extension profile");
	}

	const urls = relayUrls?.length ? relayUrls : NOSTR_RELAYS.map(normalizeWsUrl);

	return {
		decrypt: (pubkey, ciphertext) => nipx4.decrypt(pubkey, ciphertext),
		encrypt: (pubkey, plaintext) => nipx4.encrypt(pubkey, plaintext),
		getRelays: async () => relaysToRecord(urls),
		getPublicKey: async () => ext.getPublicKey(),
		signEvent: async (event) => ext.signEvent(event),
	}
}


export async function getLocalKeysIdentityApi(keys: NostrKeyPair, relays: string[]) {
	const api: IdentityNostrApi = {
		getPublicKey: async () => keys.publicKey,


		encrypt: async (pubkey, plaintext) => {
			const ck = nip44.getConversationKey(hexToBytes(keys.privateKey), pubkey)
			return nip44.encrypt(plaintext, ck);
		},

		decrypt: async (pubkey, ciphertext) => {
			const ck = nip44.getConversationKey(hexToBytes(keys.privateKey), pubkey)
			return nip44.decrypt(ciphertext, ck);
		},


		signEvent: async (unsigned) => finalizeEvent(unsigned, hexToBytes(keys.privateKey)),

		getRelays: async () => relays.reduce((acc: Record<string, { read: boolean; write: boolean }>, r) => {
			acc[r] = { read: true, write: true }
			return acc
		}, {}),
	};

	return api;
}

function createEphemeralSanctumTokenAdapter(
	runtime: RuntimeIdentitySanctum,
): TokenDataAdapter {
	return {
		getTokenData: () => runtime.tokensData,
		setTokenData: (tokensData) => {
			runtime.tokensData = tokensData;
			runtime.reauthReason = null;
		},
		clearTokenData: () => {
			runtime.tokensData = null;
		},
	};
}

function createActiveSanctumTokenAdapter(pubkey: string): TokenDataAdapter {
	return {
		getTokenData: () => {
			const state = store.getState();
			const active = state.identitiesRegistry.active;
			if (
				active?.type === IdentityType.SANCTUM &&
				active.pubkey === pubkey
			) {
				return selectActiveRuntimeSanctumTokensData(state);
			}
			return null;
		},
		setTokenData: async (tokensData) => {
			await store.dispatch(setIdentitySanctumTokensData({ pubkey, tokensData }));
		},
		clearTokenData: async () => {
			await store.dispatch(clearIdentitySanctumTokensData({ pubkey }));
		},
	};
}

async function verifySanctumPubkey(
	pubkey: string,
	tokenDataAdapter: TokenDataAdapter,
	onReauthRequired?: (reason?: string) => void,
): Promise<IdentityNostrApi> {
	const sdk = getOrCreateSanctumIdentitySdk({
		pubkey,
		tokenDataAdapter,
		onReauthRequired,
	});

	const remoteKey = await sdk.api.getPublicKey();
	if (remoteKey !== pubkey) {
		clearSanctumIdentitySdk(pubkey);
		throw new Error("Identity does not match this Sanctum profile");
	}

	return adaptSanctumDKApiToIdentityNostrApi(sdk.api);
}

async function buildNonSanctumApi(identity: RuntimeIdentity): Promise<IdentityNostrApi> {
	switch (identity.type) {
		case IdentityType.NIP07:
			return getNostrExtensionIdentityApi(identity.pubkey, identity.relays);
		case IdentityType.LOCAL_KEY:
			return getLocalKeysIdentityApi(
				{ publicKey: identity.pubkey, privateKey: identity.privateKey },
				identity.relays,
			);
		default:
			throw new Error("Expected non-Sanctum identity");
	}
}

/**
 * Probe / unlock / create path: bind Sanctum tokens to the candidate RuntimeIdentity only.
 * Does not read or write the registry. Clears any cached SDK first so an active adapter
 * cannot leak into this phase.
 */
export async function createEphemeralIdentityNostrApi(
	identity: RuntimeIdentity,
): Promise<IdentityNostrApi> {
	if (identity.type !== IdentityType.SANCTUM) {
		return buildNonSanctumApi(identity);
	}

	clearSanctumIdentitySdk(identity.pubkey);

	return verifySanctumPubkey(
		identity.pubkey,
		createEphemeralSanctumTokenAdapter(identity),
		(reason) => {
			identity.reauthReason = reason ?? "Session expired or invalid";
		},
	);
}

/**
 * Ready path: Sanctum tokens come from `active` only (already unlocked).
 * Writes go through identitySyncThunks (registry + active).
 */
export async function getActiveIdentityNostrApi(): Promise<IdentityNostrApi> {
	const active = selectActiveIdentity(store.getState());
	if (!active) {
		throw new Error("No active identity");
	}

	if (active.type !== IdentityType.SANCTUM) {
		return buildNonSanctumApi(active);
	}

	return verifySanctumPubkey(
		active.pubkey,
		createActiveSanctumTokenAdapter(active.pubkey),
		(reason) => {
			store.dispatch(
				markSanctumReauthRequired({ pubkey: active.pubkey, reason }),
			);
		},
	);
}
