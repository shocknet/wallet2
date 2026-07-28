import type { UnsignedEvent, Event } from "nostr-tools";

type EncryptionCalls = {
	encrypt(pubkey: string, plaintext: string): Promise<string>
	decrypt(pubkey: string, ciphertext: string): Promise<string>
}
export type NostrExtension = {
	getPublicKey: () => Promise<string>
	signEvent: (e: UnsignedEvent) => Promise<Event>
	getRelays: () => Promise<Record<string, { read: boolean, write: boolean }>>
	nip04?: EncryptionCalls
	nip44?: EncryptionCalls
}

const getNostrExtension = (): NostrExtension | null => {
	const w = window as any
	if (!w || !w.nostr || !w.nostr.getPublicKey || typeof w.nostr.getPublicKey !== 'function') {
		return null
	}
	return w.nostr as NostrExtension
}


type GetWithRetriesOptions = {
	maxRetries?: number
	delayMs?: number
}

export const getExtentionsWithRetries = async ({
	maxRetries = 5,
	delayMs = 200,
}: GetWithRetriesOptions = {}): Promise<NostrExtension | null> => {
	let attempts = 0
	while (attempts < maxRetries) {
		const ext = getNostrExtension()
		if (ext) {
			return ext
		}
		await new Promise(resolve => setTimeout(resolve, delayMs))
		attempts++
		console.log(`Attempt ${attempts} of ${maxRetries} to get nostr extension`)
	}
	return null
}
