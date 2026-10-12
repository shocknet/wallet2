import { decryptStringAesGcm, encryptStringAesGcm, isAesGcmEnvelope } from "@/lib/aesGcm";
import type { Storage } from "redux-persist";

export function createEncryptedScopedStorage(args: {
	scopeId: string;
	sliceName: string;
	dataKey: CryptoKey;
	storage: Storage;
}): Storage {
	const { storage } = args;
	return {
		getItem: async (key: string) => {
			const raw = await storage.getItem(key);
			if (!raw) return null;

			const envelope = JSON.parse(raw);

			if (!isAesGcmEnvelope(envelope)) return null;

			const plaintext = await decryptStringAesGcm({
				key: args.dataKey,
				envelope,
				expectedAad: { identityId: args.scopeId, sliceName: args.sliceName },
			});

			return plaintext;
		},
		setItem: async (key: string, value: string) => {
			const envelope = await encryptStringAesGcm({
				key: args.dataKey,
				plaintext: value,
				aad: { identityId: args.scopeId, sliceName: args.sliceName },
			});
			await storage.setItem(key, JSON.stringify(envelope));
		},
		removeItem: async (key: string) => {
			await storage.removeItem(key);
		},
	};
}
