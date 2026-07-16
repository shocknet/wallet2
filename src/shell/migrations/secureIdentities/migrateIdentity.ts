import { Capacitor } from "@capacitor/core";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { createSanctumDK } from "sanctum-sdk";
import {
	exportAesGcmKey,
	generateAesGcmKey,
} from "@/lib/aesGcm";
import { base64urlEncode } from "@/lib/base64url";
import { SANCTUM_URL } from "@/constants";
import { getExtentionsWithRetries } from "@/lib/nip07Extension";
import {
	getLocalKeysIdentityApi,
	getNostrExtensionIdentityApi,
} from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { toWrappedDataKeyStorage } from "@/State/identitiesRegistry/helpers/platformSecretStorage";
import {
	setLocalPrivateKey,
	setSanctumTokensData,
} from "@/State/identitiesRegistry/helpers/secureSecrets";
import {
	IdentityType,
	type Identity,
	type IdentityExtension,
	type IdentityKeys,
	type IdentitySanctum,
	type SanctumTokensStorage,
} from "@/State/identitiesRegistry/types";
import { DeviceToIdentitiesMigrationError } from "../deviceToIdentities/errors";
import { upgradeLegacySanctumAccessToken } from "../deviceToIdentities/sanctumUpgrade";
import { SecureIdentitiesMigrationError } from "./errors";
import type { IdentityV0 } from "./identityV0";
import {
	encryptIdentityScopedSlices,
	readTopicIdsFromPlaintextSources,
} from "./scopedEncrypt";

export type MigratedSecureIdentity = {
	identity: Identity;
	topics: { topicId: string; sourceId: string }[];
};

export async function migrateV0IdentityToSecure(
	identity: IdentityV0,
): Promise<MigratedSecureIdentity> {
	switch (identity.type) {
		case IdentityType.LOCAL_KEY:
			return migrateLocalKeyV0(identity);
		case IdentityType.SANCTUM:
			return migrateSanctumV0(identity);
		case IdentityType.NIP07:
			return migrateNip07V0(identity);
		default:
			throw new SecureIdentitiesMigrationError(
				"unsupported-identity",
				"Unsupported identity type for secure migration.",
				(identity as IdentityV0).pubkey,
			);
	}
}

async function migrateLocalKeyV0(
	identity: Extract<IdentityV0, { type: IdentityType.LOCAL_KEY }>,
): Promise<MigratedSecureIdentity> {
	const derivedPubkey = getPublicKey(hexToBytes(identity.privkey));
	if (derivedPubkey !== identity.pubkey) {
		throw new SecureIdentitiesMigrationError(
			"local-key-mismatch",
			"Local private key does not match this identity’s public key.",
			identity.pubkey,
		);
	}

	const { dataKey, encodedKey } = await generateAndEncodeDataKey();
	const topics = await readTopicIdsFromPlaintextSources(identity.pubkey);

	let wrappedDataKeyCiphertext: string;
	try {
		const localApi = await getLocalKeysIdentityApi(
			{ publicKey: identity.pubkey, privateKey: identity.privkey },
			identity.relays,
		);
		wrappedDataKeyCiphertext = await localApi.encrypt(
			identity.pubkey,
			encodedKey,
		);
	} catch (error) {
		throw new SecureIdentitiesMigrationError(
			"wrap-data-key-failed",
			error instanceof Error
				? error.message
				: "Failed to wrap data key for local identity.",
			identity.pubkey,
			{ cause: error },
		);
	}

	const wrappedDataKey = await toWrappedDataKeyStorage(
		identity.pubkey,
		wrappedDataKeyCiphertext,
	);
	await encryptIdentityScopedSlices({
		pubkey: identity.pubkey,
		dataKey,
	});

	const secureIdentity: IdentityKeys = {
		type: IdentityType.LOCAL_KEY,
		pubkey: identity.pubkey,
		label: identity.label,
		createdAt: identity.createdAt,
		lastUsedAt: identity.lastUsedAt,
		relays: identity.relays,
		wrappedDataKey,
		localSecret: Capacitor.isNativePlatform()
			? {
				storage: "secure_ref",
				localKeyRef: await setLocalPrivateKey(
					identity.pubkey,
					identity.privkey,
				),
			}
			: {
				storage: "inline",
				privateKey: identity.privkey,
			},
	};

	return { identity: secureIdentity, topics };
}

async function migrateSanctumV0(
	identity: Extract<IdentityV0, { type: IdentityType.SANCTUM }>,
): Promise<MigratedSecureIdentity> {
	if (!identity.accessToken) {
		throw new SecureIdentitiesMigrationError(
			"sanctum-token-missing",
			"Sanctum identity is missing its legacy access token.",
			identity.pubkey,
		);
	}

	let tokensData;
	try {
		tokensData = await upgradeLegacySanctumAccessToken(identity.accessToken);
	} catch (error) {
		if (error instanceof DeviceToIdentitiesMigrationError) {
			const code =
				error.code === "sanctum-upgrade-network-failed"
					? "sanctum-upgrade-network-failed"
					: error.code === "sanctum-token-missing"
						? "sanctum-token-missing"
						: "sanctum-upgrade-failed";
			throw new SecureIdentitiesMigrationError(
				code,
				error.message,
				identity.pubkey,
				{ cause: error },
			);
		}
		throw new SecureIdentitiesMigrationError(
			"sanctum-upgrade-failed",
			error instanceof Error ? error.message : String(error),
			identity.pubkey,
			{ cause: error },
		);
	}

	const sdk = createSanctumDK({
		url: SANCTUM_URL,
		tokenDataAdapter: {
			getTokenData: () => tokensData,
			setTokenData: () => { },
			clearTokenData: () => { },
		},
	});

	try {
		const wirePublicKey = await sdk.api.getPublicKey();
		if (wirePublicKey !== identity.pubkey) {
			throw new SecureIdentitiesMigrationError(
				"sanctum-pubkey-mismatch",
				"Upgraded Sanctum session does not match this identity’s public key.",
				identity.pubkey,
			);
		}

		const { dataKey, encodedKey } = await generateAndEncodeDataKey();
		const topics = await readTopicIdsFromPlaintextSources(identity.pubkey);

		let wrappedDataKeyCiphertext: string;
		try {
			wrappedDataKeyCiphertext = await sdk.api.encrypt(
				identity.pubkey,
				encodedKey,
			);
		} catch (error) {
			throw new SecureIdentitiesMigrationError(
				"wrap-data-key-failed",
				error instanceof Error
					? error.message
					: "Failed to wrap data key for Sanctum identity.",
				identity.pubkey,
				{ cause: error },
			);
		}

		const wrappedDataKey = await toWrappedDataKeyStorage(
			identity.pubkey,
			wrappedDataKeyCiphertext,
		);
		await encryptIdentityScopedSlices({
			pubkey: identity.pubkey,
			dataKey,
		});

		const sanctumTokens: SanctumTokensStorage = Capacitor.isNativePlatform()
			? {
				storage: "secure_ref",
				sessionRef: await setSanctumTokensData(
					identity.pubkey,
					tokensData,
				),
			}
			: {
				storage: "inline",
				tokensData,
			};

		const secureIdentity: IdentitySanctum = {
			type: IdentityType.SANCTUM,
			pubkey: identity.pubkey,
			label: identity.label,
			createdAt: identity.createdAt,
			lastUsedAt: identity.lastUsedAt,
			wrappedDataKey,
			sanctumTokens,
		};

		return { identity: secureIdentity, topics };
	} finally {
		await sdk.destroy();
	}
}

async function migrateNip07V0(
	identity: Extract<IdentityV0, { type: IdentityType.NIP07 }>,
): Promise<MigratedSecureIdentity> {
	const ext = await getExtentionsWithRetries();
	if (!ext) {
		throw new SecureIdentitiesMigrationError(
			"extension-unavailable",
			"No Nostr browser extension was detected. Install or unlock one and try again.",
			identity.pubkey,
		);
	}

	const extensionApi = await getNostrExtensionIdentityApi();
	const extensionKey = await extensionApi.getPublicKey();
	if (extensionKey !== identity.pubkey) {
		throw new SecureIdentitiesMigrationError(
			"extension-profile-mismatch",
			"The active Nostr extension account does not match this identity.",
			identity.pubkey,
		);
	}

	const { dataKey, encodedKey } = await generateAndEncodeDataKey();
	const topics = await readTopicIdsFromPlaintextSources(identity.pubkey);

	let wrappedDataKeyCiphertext: string;
	try {
		wrappedDataKeyCiphertext = await extensionApi.encrypt(
			identity.pubkey,
			encodedKey,
		);
	} catch (error) {
		throw new SecureIdentitiesMigrationError(
			"wrap-data-key-failed",
			error instanceof Error
				? error.message
				: "Failed to wrap data key for extension identity.",
			identity.pubkey,
			{ cause: error },
		);
	}

	const wrappedDataKey = await toWrappedDataKeyStorage(
		identity.pubkey,
		wrappedDataKeyCiphertext,
	);
	await encryptIdentityScopedSlices({
		pubkey: identity.pubkey,
		dataKey,
	});

	const secureIdentity: IdentityExtension = {
		type: IdentityType.NIP07,
		pubkey: identity.pubkey,
		label: identity.label,
		createdAt: identity.createdAt,
		lastUsedAt: identity.lastUsedAt,
		relays: identity.relays,
		wrappedDataKey,
	};

	return { identity: secureIdentity, topics };
}

async function generateAndEncodeDataKey(): Promise<{
	dataKey: CryptoKey;
	encodedKey: string;
}> {
	const dataKey = await generateAesGcmKey();
	const bufferKey = await exportAesGcmKey(dataKey);
	return {
		dataKey,
		encodedKey: base64urlEncode(bufferKey),
	};
}
