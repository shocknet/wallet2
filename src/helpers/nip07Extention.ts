/* import type { UnsignedEvent, Event } from "nostr-tools";
import { Browser } from '@capacitor/browser';
import { SANCTUM_URL } from "../constants";
import { toast } from "react-toastify";
import { tsFilesWrapper } from "../Components/Toast";
import store from "@/State/store/store";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { ensureSanctumClientInitialized, SanctumAPI, withScopedSanctumIdentity } from "@/Api/sanctumClient";

type EncryptionCalls = {
	encrypt(pubkey: string, plaintext: string): Promise<string>
	decrypt(pubkey: string, ciphertext: string): Promise<string>
}
export type NostrExtention = {
	getPublicKey: () => Promise<string>
	signEvent: (e: UnsignedEvent) => Promise<Event>
	getRelays: () => Promise<Record<string, { read: boolean, write: boolean }>>
	nip04?: EncryptionCalls
	nip44?: EncryptionCalls
}

export type SanctumNostrExtention = EncryptionCalls & {
	getPublicKey: () => Promise<string>
	signEvent: (e: UnsignedEvent) => Promise<Event>
	getRelays: () => Promise<Record<string, { read: boolean, write: boolean }>>
	valid: true
}
type InvalidExtention = { valid: false }
const getNostrExtention = (): NostrExtention | null => {
	const w = window as any
	if (!w || !w.nostr || !w.nostr.getPublicKey || typeof w.nostr.getPublicKey !== 'function') {
		return null
	}
	return w.nostr as NostrExtention
}

type GetWithRetriesOptions = {
	maxRetries?: number
	delayMs?: number
}

export const getExtentionsWithRetries = async ({ maxRetries = 5, delayMs = 200 }: GetWithRetriesOptions = {}): Promise<NostrExtention | null> => {
	let attempts = 0
	while (attempts < maxRetries) {
		const ext = getNostrExtention()
		if (ext) {
			return ext
		}
		await new Promise(resolve => setTimeout(resolve, delayMs))
		attempts++
		console.log(`Attempt ${attempts} of ${maxRetries} to get nostr extension`)
	}
	return null
}

export const getSanctumNostrExtention = async (): Promise<SanctumNostrExtention | InvalidExtention> => {
	const ext = await getExtentionsWithRetries()
	if (ext && (ext.nip44 || ext.nip04)) {
		const nipx4 = (ext.nip44 || ext.nip04)!
		return {
			valid: true,
			decrypt: (pubkey, ciphertext) => nipx4.decrypt(pubkey, ciphertext),
			encrypt: (pubkey, plaintext) => nipx4.encrypt(pubkey, plaintext),
			getPublicKey: () => ext.getPublicKey(),
			signEvent: (event) => ext.signEvent(event),
			getRelays: () => ext.getRelays()
		}
	}
	return getSanctumExtension()
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


const getSanctumExtension = async (): Promise<SanctumNostrExtention | InvalidExtention> => {
	const state = store.getState();
	const pubkey = state.identitiesRegistry.activePubkey;
	if (!pubkey) {
		return { valid: false }
	}
	const identity = state.identitiesRegistry.entities[pubkey];
	if (!identity || identity.type !== IdentityType.SANCTUM) {
		return { valid: false }
	}

	ensureSanctumClientInitialized();
	const call = async <T>(fn: () => Promise<T>): Promise<T> => {
		try {
			return await withScopedSanctumIdentity(identity.pubkey, fn);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown Sanctum error";
			handleSanctumGeneralErrors(message);
			throw error;
		}
	};

	return {
		valid: true,
		decrypt: (pubkey, ciphertext) => call(() => SanctumAPI.decrypt(ciphertext, pubkey)),
		encrypt: (pubkey, plaintext) => call(() => SanctumAPI.encrypt(plaintext, pubkey)),
		getPublicKey: () => call(() => SanctumAPI.getPublicKey()),
		signEvent: (event) => call(async () => JSON.parse(await SanctumAPI.signEvent(JSON.stringify(event)))),
		getRelays: () => call(() => SanctumAPI.getRelays())
	}


}

 */
