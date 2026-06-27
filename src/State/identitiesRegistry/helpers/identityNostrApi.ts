
import { type UnsignedEvent, type Event, nip44, finalizeEvent } from "nostr-tools";
import { NostrKeyPair } from "@/Api/nostrHandler";
import { hexToBytes } from "@noble/hashes/utils";
import { NOSTR_RELAYS } from "@/constants";
import { normalizeWsUrl } from "@/lib/url";
import { IdentityType, RuntimeIdentity, RuntimeIdentitySanctum } from "../types";
import { isPlatform } from "@ionic/react";
import store from "@/State/store/store";
import { identitiesRegistryActions, selectActiveRuntimeSanctumTokensData } from "../slice";

import {
	clearIdentitySanctumTokensData,
	resolveSanctumTokensData,
	setIdentitySanctumTokensData,
} from "./platformSecretStorage";
import { type SanctumApi, TokenDataAdapter } from "sanctum-sdk";
import { getOrCreateSanctumIdentitySdk } from "./sanctumIdentitySdkManager";


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
	const w = window as any
	if (!w || !w.nostr) throw new Error("No nostr extension is installed on this browser");
	const ext = w.nostr;
	if (!ext.nip44 && !ext.nip04) {
		throw new Error("This Nostr Extension does not implement nip04/nip44");
	}
	const nipx4 = (ext.nip44 || ext.nip04);

	const extensionKey = await ext.getPublicKey();
	if (pubkey && extensionKey !== pubkey) {
		throw new Error("Identity does not match this Nostr Extension profile");
	}

	const urls = relayUrls?.length ? relayUrls : NOSTR_RELAYS.map(normalizeWsUrl);

	return {
		...ext,
		decrypt: (pubkey, ciphertext) => nipx4.decrypt(pubkey, ciphertext),
		encrypt: (pubkey, plaintext) => nipx4.encrypt(pubkey, plaintext),
		getRelays: async () => relaysToRecord(urls),
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


export async function getSanctumIdentityApi(inputIdentity: RuntimeIdentitySanctum, offOfStore: boolean = false): Promise<IdentityNostrApi> {
	const pubkey = inputIdentity.pubkey;

	let tokenDataAdapter: TokenDataAdapter | null = null;
	if (offOfStore) {
		tokenDataAdapter = {
			getTokenData: () => inputIdentity.tokensData,
			setTokenData: (newTokensData) => {
				inputIdentity.tokensData = newTokensData;
			},
			clearTokenData: () => {
				inputIdentity.tokensData = null;
			},
		}
	} else {
		const fromRegistry = store.getState().identitiesRegistry.entities[pubkey];
		if (!fromRegistry || fromRegistry.type !== IdentityType.SANCTUM) throw new Error("Identity is not a Sanctum identity");

		tokenDataAdapter = {
			getTokenData: () => {
				const state = store.getState();
				const activeRuntime = state.identitiesRegistry.active;
				if (
					activeRuntime &&
					activeRuntime.type === IdentityType.SANCTUM &&
					activeRuntime.pubkey === pubkey
				) {
					return selectActiveRuntimeSanctumTokensData(state);
				}
				const freshIdentity = state.identitiesRegistry.entities[pubkey];
				if (!freshIdentity || freshIdentity.type !== IdentityType.SANCTUM) return Promise.resolve(null);
				return resolveSanctumTokensData(freshIdentity);
			},
			setTokenData: async (newTokensData) => {
				store.dispatch(
					identitiesRegistryActions.setActiveSanctumTokensData({ pubkey, tokensData: newTokensData })
				);
				await store.dispatch(setIdentitySanctumTokensData({ pubkey, tokensData: newTokensData }));
			},
			clearTokenData: () => {
				store.dispatch(identitiesRegistryActions.clearActiveSanctumTokensData({ pubkey }));
				store.dispatch(clearIdentitySanctumTokensData({ pubkey }));
			},

		}

	}

	const sdk = getOrCreateSanctumIdentitySdk({
		pubkey,
		tokenDataAdapter,
		onReauthRequired: (reason) => {
			store.dispatch(identitiesRegistryActions.markSanctumReauthRequired({ pubkey, reason }));
			store.dispatch(identitiesRegistryActions.setActiveSanctumReauthRequired({ pubkey, reason }));
		},
	});

	const remoteKey = await sdk.api.getPublicKey();
	if (remoteKey !== pubkey) throw new Error("Identity does not match this Sanctum profile");

	return adaptSanctumDKApiToIdentityNostrApi(sdk.api);
}

export default async function getIdentityNostrApi(identity: RuntimeIdentity, offOfStore: boolean = false): Promise<IdentityNostrApi> {
	switch (identity.type) {
		case IdentityType.SANCTUM:
			return getSanctumIdentityApi(identity, offOfStore);
		case IdentityType.NIP07:
			return getNostrExtensionIdentityApi(identity.pubkey, identity.relays);
		case IdentityType.LOCAL_KEY:
			return getLocalKeysIdentityApi({ publicKey: identity.pubkey, privateKey: identity.privateKey }, identity.relays);
		default:
			throw new Error("Unsupported identity type");
	}
}
