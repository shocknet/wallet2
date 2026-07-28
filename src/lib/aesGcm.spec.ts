import { describe, expect, it } from "vitest";
import {
	decryptStringAesGcm,
	deriveAesGcmKeyFromPassword,
	encryptStringAesGcm,
	exportAesGcmKey,
	generateAesGcmKey,
	importAesGcmKey,
	isAesGcmEnvelope,
	isAesGcmEnvelopeWithSalt,
	passwordDeriveAndEcrypt,
} from "./aesGcm";
import { base64urlDecode } from "./base64url";

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

	it("derives a key from password and round-trips", async () => {
		const salt = crypto.getRandomValues(new Uint8Array(16));
		const key = await deriveAesGcmKeyFromPassword("test-password", salt);
		const envelope = await encryptStringAesGcm({
			key,
			plaintext: "secret",
			aad: { purpose: "test" },
		});
		const key2 = await deriveAesGcmKeyFromPassword("test-password", salt);
		await expect(
			decryptStringAesGcm({
				key: key2,
				envelope,
				expectedAad: { purpose: "test" },
			}),
		).resolves.toBe("secret");
	});

	it("passwordDeriveAndEcrypt round-trips with stored salt", async () => {
		const aad = { purpose: "password-blob" };
		const sealed = await passwordDeriveAndEcrypt({
			plaintext: "nsec1secret",
			aad,
			password: "correct-horse",
		});

		expect(isAesGcmEnvelopeWithSalt(sealed)).toBe(true);

		const key = await deriveAesGcmKeyFromPassword(
			"correct-horse",
			base64urlDecode(sealed.salt),
		);
		const { salt: _salt, ...envelope } = sealed;
		await expect(
			decryptStringAesGcm({
				key,
				envelope,
				expectedAad: aad,
			}),
		).resolves.toBe("nsec1secret");
	});

	it("passwordDeriveAndEcrypt fails with wrong password", async () => {
		const aad = { purpose: "password-blob" };
		const sealed = await passwordDeriveAndEcrypt({
			plaintext: "nsec1secret",
			aad,
			password: "correct-horse",
		});
		const key = await deriveAesGcmKeyFromPassword(
			"wrong-password",
			base64urlDecode(sealed.salt),
		);
		const { salt: _salt, ...envelope } = sealed;
		await expect(
			decryptStringAesGcm({
				key,
				envelope,
				expectedAad: aad,
			}),
		).rejects.toThrow();
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
		expect(
			isAesGcmEnvelopeWithSalt({
				version: 1,
				alg: "AES-GCM",
				nonce: "abc",
				ciphertext: "def",
				salt: "xyz",
			})
		).toBe(true);
		expect(
			isAesGcmEnvelopeWithSalt({
				version: 1,
				alg: "AES-GCM",
				nonce: "abc",
				ciphertext: "def",
			})
		).toBe(false);
	});
});
