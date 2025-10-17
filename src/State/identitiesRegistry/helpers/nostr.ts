import { getNip78Event, newKind79Event, newNip78Event, publishNostrEvent, subToNip78DocEvents } from "@/Api/nostrHandler"
import { IdentityNostrApi } from "./identityNostrApi"
import { Filter } from "nostr-tools"

export async function fetchNip78Event(ext: IdentityNostrApi, dTag: string): Promise<string> {

	const pubkey = await ext.getPublicKey()
	const relays = await ext.getRelays()

	const backupEvent = await getNip78Event(pubkey, Object.keys(relays), dTag)
	if (!backupEvent) {
		return "";
	}
	const decrypted = await ext.decrypt(pubkey, backupEvent.content)
	return decrypted;
}


export async function saveNip78Event(ext: IdentityNostrApi, backup: string, dTag: string): Promise<number> {

	const pubkey = await ext.getPublicKey()
	const relays = await ext.getRelays()
	const encrypted = await ext.encrypt(pubkey, backup)

	const backupEvent = newNip78Event(encrypted, pubkey, dTag)

	const signed = await ext.signEvent(backupEvent)

	await publishNostrEvent(signed, Object.keys(relays))
	return signed.created_at
}




export async function saveKind79Event(ext: IdentityNostrApi, backup: string, dTag: string): Promise<number> {

	const pubkey = await ext.getPublicKey()
	const relays = await ext.getRelays()
	const encrypted = await ext.encrypt(pubkey, backup)

	const backupEvent = newKind79Event(encrypted, pubkey, dTag)

	const signed = await ext.signEvent(backupEvent)


	await publishNostrEvent(signed, Object.keys(relays))
	return signed.created_at
}


export async function subscribeToNip78Events(
	ext: IdentityNostrApi,
	filters: Filter[],
	eventCallback: (decrypted: string) => void
) {
	const pubkey = await ext.getPublicKey()
	const relays = await ext.getRelays()


	const subCloser = subToNip78DocEvents(
		pubkey,
		Object.keys(relays),
		filters,
		async event => {
			const decrypted = await ext.decrypt(pubkey, event.content);
			await eventCallback(decrypted);
		}
	);

	return subCloser;
}
