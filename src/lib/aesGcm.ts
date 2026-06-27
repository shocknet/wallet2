import z from "zod";
import { base64urlDecode, base64urlEncode } from "./base64url";

export const aesGcmEnvelope = z.object({
	version: z.literal(1),
	alg: z.literal("AES-GCM"),
	nonce: z.string(),
	ciphertext: z.string(),
});

export type AesGcmEnvelope = z.infer<typeof aesGcmEnvelope>;

export function isAesGcmEnvelope(value: unknown): value is AesGcmEnvelope {
	return aesGcmEnvelope.safeParse(value).success;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function importAesGcmKey(raw: Uint8Array): Promise<CryptoKey> {
	return globalThis.crypto.subtle.importKey(
		"raw",
		toArrayBuffer(raw),
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"]
	);
}

export async function exportAesGcmKey(key: CryptoKey): Promise<Uint8Array> {
	const raw = await globalThis.crypto.subtle.exportKey("raw", key);
	return new Uint8Array(raw);
}

export async function generateAesGcmKey(): Promise<CryptoKey> {
	return globalThis.crypto.subtle.generateKey(
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"]
	);
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export async function encryptStringAesGcm(args: {
	key: CryptoKey;
	plaintext: string;
	aad: any;
}): Promise<AesGcmEnvelope> {
	const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
	const plaintextBytes = textEncoder.encode(args.plaintext);
	const aadBytes = textEncoder.encode(JSON.stringify(args.aad));

	const ciphertext = await globalThis.crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: toArrayBuffer(nonce),
			additionalData: toArrayBuffer(aadBytes),
			tagLength: 128,
		},
		args.key,
		toArrayBuffer(plaintextBytes)
	);

	return {
		version: 1,
		alg: "AES-GCM",
		nonce: base64urlEncode(nonce),
		ciphertext: base64urlEncode(new Uint8Array(ciphertext)),
	};
}

export async function decryptStringAesGcm(args: {
	key: CryptoKey;
	envelope: AesGcmEnvelope;
	expectedAad: any;
}): Promise<string> {
	const nonce = base64urlDecode(args.envelope.nonce);
	const ciphertext = base64urlDecode(args.envelope.ciphertext);
	const aadBytes = textEncoder.encode(JSON.stringify(args.expectedAad));

	const plaintext = await globalThis.crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: toArrayBuffer(nonce),
			additionalData: toArrayBuffer(aadBytes),
			tagLength: 128,
		},
		args.key,
		toArrayBuffer(ciphertext)
	);

	return textDecoder.decode(plaintext);
}
