import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from "@/constants";
import { generateSecretKey, nip19 } from "nostr-tools";
import { Buffer } from 'buffer'

export function parseNprofile(nprofile: string) {
	const { type, data } = nip19.decode(nprofile)
	if (type !== "nprofile") {
		throw new Error("invalid bech32 this is not a nprofile")
	}
	const dataString = JSON.stringify(data);
	const dataBox = JSON.parse(dataString);

	return dataBox as nip19.ProfilePointer;
}


export function getNostrPrivateKey() {
	return localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY)
}

export function setNostrPrivateKey(nsec?: string) {
	const key = nsec ? nsec : Buffer.from(generateSecretKey()).toString('hex')
	localStorage.setItem(NOSTR_PRIVATE_KEY_STORAGE_KEY, key)
	return key;
}
