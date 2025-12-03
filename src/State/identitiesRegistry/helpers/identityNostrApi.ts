
import { type UnsignedEvent, type Event, nip44, finalizeEvent } from "nostr-tools";
import { Browser } from '@capacitor/browser';
import { toast } from "react-toastify";
import { NostrKeyPair } from "@/Api/nostrHandler";
import { tsFilesWrapper } from "@/Components/Toast";
import { hexToBytes } from "@noble/hashes/utils";
import { SANCTUM_URL } from "@/constants";
import { Identity, IdentityType } from "../types";




export interface IdentityNostrApi {
	getPublicKey: () => Promise<string>
	signEvent: (e: UnsignedEvent) => Promise<Event>
	getRelays: () => Promise<Record<string, { read: boolean, write: boolean }>>
	encrypt(pubkey: string, plaintext: string): Promise<string>
	decrypt(pubkey: string, ciphertext: string): Promise<string>
}



export async function getNostrExtensionIdentityApi(pubkey?: string): Promise<IdentityNostrApi> {
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


	return {
		...ext,
		decrypt: (pubkey, ciphertext) => nipx4.decrypt(pubkey, ciphertext),
		encrypt: (pubkey, plaintext) => nipx4.encrypt(pubkey, plaintext),
		getRelays: async () => ({} as Record<string, { read: boolean; write: boolean }>)
	}
}



const handleSanctumGeneralErrors = (reason: string) => {
	switch (reason) {
		case "Session expired or invalid":
			toast.error(tsFilesWrapper({ title: "Sanctum session expired or invalid", message: "You will shortly be redirected to Sanctum to log in again." }));
			setTimeout(() => {
				Browser.open({ url: `${SANCTUM_URL}/authenticate?authType=Log In` }).then(() => console.log("Opened sanctum to re login"));
			}, 2000);
			break;
		case "Access token does not exist or is invalid":
			toast.error(tsFilesWrapper({ title: "Invalid Access Token", message: "Did you revoke this app's token on Sanctum?" }));
			break;
		case "Access Denied":
			toast.error(tsFilesWrapper({ title: "Access Denied", message: "Access token was sent from a wrong device or domain" }));
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


export async function getSanctumIdentityApi({ pubkey, accessToken }: { pubkey?: string, accessToken: string }): Promise<IdentityNostrApi> {



	const { getKeyLinkClient } = await import("@/Api/keylink/http");
	const keyLinkClient = getKeyLinkClient(accessToken)


	const api: IdentityNostrApi = {
		decrypt: (pubkey, ciphertext) => keyLinkClient.Nip44Decrypt({ pubkey, ciphertext }).then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return r.plaintext } }),
		encrypt: (pubkey, plaintext) => keyLinkClient.Nip44Encrypt({ pubkey, plaintext }).then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return r.ciphertext } }),
		getPublicKey: () => keyLinkClient.GetNostrPubKey().then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return r.pubkey } }),
		signEvent: (event) => keyLinkClient.SignNostrEvent({ usignedEvent: JSON.stringify(event) }).then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return JSON.parse(r.signedEvent) } }),
		getRelays: () => keyLinkClient.GetNostrRelays().then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return r.relays } })
	}

	const remoteKey = await api.getPublicKey();
	if (pubkey && remoteKey !== pubkey) throw new Error("Identity does not match this Sanctum profile");
	return api

}

export default async function getIdentityNostrApi(identity: Identity) {
	switch (identity.type) {
		case IdentityType.SANCTUM:
			return getSanctumIdentityApi({ pubkey: identity.pubkey, accessToken: identity.accessToken });
		case IdentityType.NIP07:
			return getNostrExtensionIdentityApi(identity.pubkey);
		default:
			return getLocalKeysIdentityApi({ publicKey: identity.pubkey, privateKey: identity.privkey }, identity.relays);
	}
}
