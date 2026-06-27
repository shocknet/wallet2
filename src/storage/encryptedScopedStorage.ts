import IonicStorageAdapter from "./redux-persist-ionic-storage-adapter";
import { decryptStringAesGcm, encryptStringAesGcm, isAesGcmEnvelope } from "@/lib/aesGcm";
import type { Storage } from "redux-persist";

export function createEncryptedScopedStorage(args: {
	identityId: string;
	sliceName: string;
	dataKey: CryptoKey;
}): Storage {
	return {
		getItem: async (key: string) => {
			const raw = await IonicStorageAdapter.getItem(key);
			if (!raw) return null;

			const envelope = JSON.parse(raw);

			if (!isAesGcmEnvelope(envelope)) return null;

			const plaintext = await decryptStringAesGcm({
				key: args.dataKey,
				envelope,
				expectedAad: { identityId: args.identityId, sliceName: args.sliceName },
			});

			return plaintext;
		},
		setItem: async (key: string, value: string) => {
			const envelope = await encryptStringAesGcm({
				key: args.dataKey,
				plaintext: value,
				aad: { identityId: args.identityId, sliceName: args.sliceName },
			});
			await IonicStorageAdapter.setItem(key, JSON.stringify(envelope));
		},
		removeItem: async (key: string) => {
			await IonicStorageAdapter.removeItem(key);
		},
	};
}
