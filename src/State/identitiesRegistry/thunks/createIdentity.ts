import { SANCTUM_URL } from "@/constants";
import dLogger from "@/Api/helpers/debugLog";
import type { ScopedRuntimeIdentity } from "@/shell/types";
import type { AppThunk, RootState } from "@/State/store/store";
import { hexToBytes } from "@noble/hashes/utils";
import { getPublicKey } from "nostr-tools";
import { createSanctumDK, type TokensData } from "sanctum-sdk";
import { appStateActions } from "../../appState/slice";
import { generateAndWrapDataKey } from "../helpers/datakey";
import {
	adaptSanctumDKApiToIdentityNostrApi,
	getIdentityNostrApi,
	getLocalKeysIdentityApi,
	getNostrExtensionIdentityApi,
} from "../helpers/identityNostrApi";
import {
	toLocalPrivateKeyStorage,
	toWrappedDataKeyStorage,
} from "../helpers/platformSecretStorage";
import { writeSanctumTokens } from "../helpers/sanctumTokensStore";
import { identitiesRegistryActions } from "../slice";
import { IdentityType, type Identity } from "../types";

export type CreateIdentityInput =
	| { type: IdentityType.LOCAL_KEY; privkey: string; label: string; relays: string[]; userPassword?: string }
	| { type: IdentityType.SANCTUM; tokensData: TokensData; label: string }
	| { type: IdentityType.NIP07; label: string; relays: string[] };

export const createIdentity = (
	input: CreateIdentityInput,
): AppThunk<Promise<ScopedRuntimeIdentity>> => {
	return async (dispatch, getState) => {
		const unlockedAtMs = Date.now();
		const { identity, runtime } = await buildIdentity(input, getState, unlockedAtMs);

		const log = dLogger.withContext({
			procedure: "create-identity",
			data: { pubkey: identity.pubkey, identityType: identity.type },
		});
		if (getState().identitiesRegistry.entities[identity.pubkey]) {
			log.error("identity-already-exists");
			throw new Error("This identity already exists.");
		}

		await getIdentityNostrApi(runtime);

		dispatch(identitiesRegistryActions._createNewIdentity({ identity }));
		dispatch(appStateActions.setAppBootstrapped());
		return runtime;
	};
};

async function buildIdentity(
	input: CreateIdentityInput,
	getState: () => RootState,
	unlockedAtMs: number,
): Promise<{ identity: Identity; runtime: ScopedRuntimeIdentity }> {
	switch (input.type) {
		case IdentityType.LOCAL_KEY: {
			const pubkey = getPublicKey(hexToBytes(input.privkey));
			const nostrApi = await getLocalKeysIdentityApi(
				{ publicKey: pubkey, privateKey: input.privkey },
				input.relays,
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
					privateKey: input.privkey,
					relays: input.relays,
					unlockedAtMs,
				},
			};
		}
		case IdentityType.SANCTUM: {
			let tokensData: TokensData | null = input.tokensData;
			const sdk = createSanctumDK({
				url: SANCTUM_URL,
				tokenDataAdapter: {
					getTokenData: () => tokensData,
					setTokenData: (next) => {
						tokensData = next;
					},
					clearTokenData: () => {
						tokensData = null;
					},
				},
			});

			try {
				const pubkey = await sdk.api.getPublicKey();

				/*
				* Existing identity check before writing the sanctum tokens.
				* This is to prevent overwriting an existing identity's sanctum tokens.
				*/
				if (getState().identitiesRegistry.entities[pubkey]) {
					throw new Error("This identity already exists.");
				}
				const wrappedDataKeyCiphertext = await generateAndWrapDataKey(
					pubkey,
					adaptSanctumDKApiToIdentityNostrApi(sdk.api),
				);
				if (!tokensData) {
					throw new Error("Sanctum session was cleared before the profile was created");
				}
				const [wrappedDataKey] = await Promise.all([
					toWrappedDataKeyStorage(pubkey, wrappedDataKeyCiphertext),
					writeSanctumTokens(pubkey, tokensData),
				]);

				return {
					identity: {
						type: IdentityType.SANCTUM,
						pubkey,
						label: input.label,
						wrappedDataKey,
						createdAt: unlockedAtMs,
					},
					runtime: {
						type: IdentityType.SANCTUM,
						pubkey,
						unlockedAtMs,
					},
				};
			} finally {
				await sdk.destroy();
			}
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
					unlockedAtMs,
					relays: input.relays,
				},
			};
		}
	}
}
