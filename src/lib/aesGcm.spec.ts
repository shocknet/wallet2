import { describe, expect, it } from "vitest";
import {
	decryptStringAesGcm,
	encryptStringAesGcm,
	exportAesGcmKey,
	generateAesGcmKey,
	importAesGcmKey,
	isAesGcmEnvelope,
} from "./aesGcm";

describe("aesGcm", () => {
	it("round-trips plaintext with matching AAD", async () => {
		const key = await generateAesGcmKey();
		const plaintext = JSON.stringify({ ok: true, n: 42 });
		const aad = { identityId: "abc", slice: "identity" };

		const envelope = await encryptStringAesGcm({ key, plaintext, aad });
		const decrypted = await decryptStringAesGcm({
			key,
			envelope,
			expectedAad: aad,
		});

		expect(decrypted).toBe(plaintext);
	});

	it("fails decryption when AAD does not match", async () => {
		const key = await generateAesGcmKey();
		const envelope = await encryptStringAesGcm({
			key,
			plaintext: "payload",
			aad: { identityId: "abc", slice: "sources" },
		});

		await expect(
			decryptStringAesGcm({
				key,
				envelope,
				expectedAad: { identityId: "wrong", slice: "sources" },
			})
		).rejects.toThrow();
	});

	it("exports and imports AES-GCM keys", async () => {
		const key = await generateAesGcmKey();
		const exported = await exportAesGcmKey(key);
		const imported = await importAesGcmKey(exported);

		const envelope = await encryptStringAesGcm({
			key: imported,
			plaintext: "hello",
			aad: { test: true },
		});
		const decrypted = await decryptStringAesGcm({
			key: imported,
			envelope,
			expectedAad: { test: true },
		});

		expect(exported.byteLength).toBe(32);
		expect(decrypted).toBe("hello");
	});

	it("validates envelope shape", () => {
		expect(
			isAesGcmEnvelope({
				version: 1,
				alg: "AES-GCM",
				nonce: "abc",
				ciphertext: "def",
			})
		).toBe(true);
		expect(
			isAesGcmEnvelope({
				version: 2,
				alg: "AES-GCM",
				nonce: "abc",
				ciphertext: "def",
			})
		).toBe(false);
	});
});
