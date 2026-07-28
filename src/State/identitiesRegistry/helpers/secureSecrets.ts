import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import type { TokensData } from "sanctum-sdk";

const LOCAL_PRIVKEY_PREFIX = "identity/local-privkey/";
const SANCTUM_TOKENS_PREFIX = "identity/sanctum-tokens/";
const WRAPPED_DATA_KEY_PREFIX = "identity/wrapped-data-key/";

const makeLocalPrivkeyRef = (identityId: string) => `${LOCAL_PRIVKEY_PREFIX}${identityId}`;
const makeSanctumSessionRef = (identityId: string) => `${SANCTUM_TOKENS_PREFIX}${identityId}`;
const makeWrappedDataKeyRef = (identityId: string) => `${WRAPPED_DATA_KEY_PREFIX}${identityId}`;

async function setSecret(key: string, value: string): Promise<void> {
	await SecureStorage.setItem(key, value);
}

async function getSecret(key: string): Promise<string | null> {
	return SecureStorage.getItem(key);
}

async function deleteSecret(key: string): Promise<void> {
	await SecureStorage.removeItem(key);
}

export async function setLocalPrivateKey(identityId: string, privkey: string) {
	const ref = makeLocalPrivkeyRef(identityId);
	await setSecret(ref, privkey);
	return ref;
}

export async function getLocalPrivateKey(localKeyRef: string): Promise<string | null> {
	return getSecret(localKeyRef);
}

export async function deleteLocalPrivateKey(localKeyRef: string): Promise<void> {
	await deleteSecret(localKeyRef);
}

export async function setSanctumTokensData(identityId: string, tokensData: TokensData) {
	const ref = makeSanctumSessionRef(identityId);
	await setSecret(ref, JSON.stringify(tokensData));
	return ref;
}

export async function getSanctumTokensData(sessionRef: string): Promise<TokensData | null> {
	const raw = await getSecret(sessionRef);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as TokensData;
	} catch {
		return null;
	}
}

export async function deleteSanctumSession(sessionRef: string): Promise<void> {
	await deleteSecret(sessionRef);
}

export async function setWrappedDataKeyCiphertext(identityId: string, ciphertext: string) {
	const ref = makeWrappedDataKeyRef(identityId);
	await setSecret(ref, ciphertext);
	return ref;
}

export async function getWrappedDataKeyCiphertext(ref: string): Promise<string | null> {
	return getSecret(ref);
}

export async function deleteWrappedDataKeyCiphertext(ref: string): Promise<void> {
	await deleteSecret(ref);
}
