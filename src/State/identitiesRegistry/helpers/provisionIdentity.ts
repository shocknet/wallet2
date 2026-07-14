import { SANCTUM_URL } from "@/constants";
import { generateAndWrapDataKey } from "./datakey";
import {
	adaptSanctumDKApiToIdentityNostrApi,
	getLocalKeysIdentityApi,
	getNostrExtensionIdentityApi,
} from "./identityNostrApi";
import {
	toLocalPrivateKeyStorage,
	toSanctumTokensStorage,
	toWrappedDataKeyStorage,
} from "./platformSecretStorage";
import { Identity, IdentityType } from "../types";
import { createSanctumDK, type TokensData } from "sanctum-sdk";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { RuntimeIdentity } from "@/shell/types";

export type CreateIdentityInput =
	| { type: IdentityType.LOCAL_KEY; privkey: string; label: string; relays: string[]; userPassword?: string }
	| { type: IdentityType.SANCTUM; tokensData: TokensData; label: string }
	| { type: IdentityType.NIP07; label: string; relays: string[] };

export type ProvisionedIdentity = {
	identity: Identity;
	runtime: RuntimeIdentity;
};

export async function provisionIdentity(input: CreateIdentityInput): Promise<ProvisionedIdentity> {
	const unlockedAtMs = Date.now();

	switch (input.type) {
		case IdentityType.LOCAL_KEY: {
			const pubkey = getPublicKey(hexToBytes(input.privkey));
			const nostrApi = await getLocalKeysIdentityApi(
				{ publicKey: pubkey, privateKey: input.privkey },
				input.relays
			);
			const wrappedDataKeyCiphertext = await generateAndWrapDataKey(pubkey, nostrApi);
			const [wrappedDataKey, localSecret] = await Promise.all([
				toWrappedDataKeyStorage(pubkey, wrappedDataKeyCiphertext),
				toLocalPrivateKeyStorage(pubkey, input.privkey, input.userPassword),
			]);

			return {
				identity: {
					type: IdentityType.LOCAL_KEY,
					pubkey,
					label: input.label,
					relays: input.relays,
					wrappedDataKey,
					localSecret,
					createdAt: unlockedAtMs,
				},
				runtime: {
					type: IdentityType.LOCAL_KEY,
					pubkey,
					label: input.label,
					relays: input.relays,
					privateKey: input.privkey,
					unlockedAtMs,
					wrappedDataKeyCiphertext,
				},
			};
		}
		case IdentityType.SANCTUM: {
			const sdk = createSanctumDK({
				url: SANCTUM_URL,
				tokenDataAdapter: {
					getTokenData: () => input.tokensData,
					setTokenData: () => { },
					clearTokenData: () => { },
				},
			});

			const pubkey = await sdk.api.getPublicKey();
			const wrappedDataKeyCiphertext = await generateAndWrapDataKey(
				pubkey,
				adaptSanctumDKApiToIdentityNostrApi(sdk.api),
			);
			const [wrappedDataKey, sanctumTokens] = await Promise.all([
				toWrappedDataKeyStorage(pubkey, wrappedDataKeyCiphertext),
				toSanctumTokensStorage(pubkey, input.tokensData),
			]);

			return {
				identity: {
					type: IdentityType.SANCTUM,
					pubkey,
					label: input.label,
					wrappedDataKey,
					sanctumTokens,
					createdAt: unlockedAtMs,
				},
				runtime: {
					type: IdentityType.SANCTUM,
					pubkey,
					label: input.label,
					tokensData: input.tokensData,
					reauthReason: null,
					unlockedAtMs,
					wrappedDataKeyCiphertext,
				},
			};
		}
		case IdentityType.NIP07: {
			const nostrIdentityApi = await getNostrExtensionIdentityApi();
			const pubkey = await nostrIdentityApi.getPublicKey();
			const wrappedDataKeyCiphertext = await generateAndWrapDataKey(pubkey, nostrIdentityApi);
			const wrappedDataKey = await toWrappedDataKeyStorage(pubkey, wrappedDataKeyCiphertext);

			return {
				identity: {
					type: IdentityType.NIP07,
					pubkey,
					label: input.label,
					relays: input.relays,
					wrappedDataKey,
					createdAt: unlockedAtMs,
				},
				runtime: {
					type: IdentityType.NIP07,
					pubkey,
					label: input.label,
					relays: input.relays,
					unlockedAtMs,
					wrappedDataKeyCiphertext,
				},
			};
		}
	}
}
