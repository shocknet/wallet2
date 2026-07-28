import { nip19 } from "nostr-tools";

const identityPrivateKeyUsernamePrefix = "shockwallet-identity-private-key";


const identityFileBackupUsernamePrefix = "shockwallet-identity-file-backup";

export const makeIdentityPrivateKeyPmUsername = (pubkey: string) => {
	const npub = nip19.npubEncode(pubkey);
	return `${identityPrivateKeyUsernamePrefix}:${npub}`;
}

export const makeIdentityFileBackupPmUsername = (pubkey: string) => {
	const npub = nip19.npubEncode(pubkey);
	return `${identityFileBackupUsernamePrefix}:${npub}`;
}
