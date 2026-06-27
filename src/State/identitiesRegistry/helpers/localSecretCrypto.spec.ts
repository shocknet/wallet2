import { describe, expect, it } from "vitest";
import {
	decryptLocalPrivateKeyForWeb,
	encryptLocalPrivateKeyForWeb,
} from "./localSecretCrypto";

describe("localSecretCrypto", () => {
	it("encrypts and decrypts local private key", async () => {
		const privkey = "f".repeat(64);
		const encrypted = await encryptLocalPrivateKeyForWeb(privkey);
		expect(encrypted.alg).toBe("AES-GCM");
		const decrypted = await decryptLocalPrivateKeyForWeb(encrypted);
		expect(decrypted).toBe(privkey);
	});
});
