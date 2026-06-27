import { base64urlDecode, base64urlEncode } from "@/lib/base64url";
import type { EncryptedBlobV1 } from "../types";

export const DEFAULT_WEB_PASSWORD = "shockwallet";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function getAppPasswordOnlyAesKey(password: string): Promise<CryptoKey> {
	const keyMaterial = await globalThis.crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveKey"]
	);
	return globalThis.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt: new TextEncoder().encode("shockwallet app-password-only v1"),
			iterations: 200_000,
		},
		keyMaterial,
		{
			name: "AES-GCM",
			length: 256,
		},
		false,
		["encrypt", "decrypt"]
	);
}

export async function encryptLocalPrivateKeyForWeb(
	privkey: string,
	password: string = DEFAULT_WEB_PASSWORD
): Promise<EncryptedBlobV1> {
	const key = await getAppPasswordOnlyAesKey(password);
	const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await globalThis.crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: toArrayBuffer(nonce),
			tagLength: 128,
		},
		key,
		new TextEncoder().encode(privkey)
	);
	return {
		alg: "AES-GCM",
		nonce: base64urlEncode(nonce),
		ciphertext: base64urlEncode(new Uint8Array(ciphertext)),
	};
}

export async function decryptLocalPrivateKeyForWeb(
	encrypted: EncryptedBlobV1,
	password: string = DEFAULT_WEB_PASSWORD
): Promise<string> {
	if (encrypted.alg !== "AES-GCM") {
		throw new Error(`Unsupported local secret encryption algorithm: ${encrypted.alg}`);
	}
	const key = await getAppPasswordOnlyAesKey(password);
	const nonce = base64urlDecode(encrypted.nonce);
	const ciphertext = base64urlDecode(encrypted.ciphertext);
	const plaintext = await globalThis.crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: toArrayBuffer(nonce),
			tagLength: 128,
		},
		key,
		toArrayBuffer(ciphertext)
	);
	return new TextDecoder().decode(plaintext);
}
