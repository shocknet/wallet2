import { useCallback } from "react";
import { RuntimeIdentity } from "@/State/identitiesRegistry/types";
import { IdentityType, type Identity } from "@/State/identitiesRegistry/types";
import { createSanctumDK, type TokensData } from "sanctum-sdk";
import {
	unlockIdentity,
	type UnlockIdentityOptions,
} from "@/State/identitiesRegistry/helpers/unlockIdentity";
import { useAppDispatch } from "@/State/store/hooks";
import { setIdentitySanctumTokensData } from "@/State/identitiesRegistry/helpers/platformSecretStorage";
import { useAskSanctumReauth } from "@/Components/Modals/SanctumReauthModal";
import { withDeviceAuth } from "@/lib/deviceAuth/guard";
import { useAskPassword } from "@/Components/password/InputPasswordModal";
import { SANCTUM_URL } from "@/constants";
import { makeIdentityPrivateKeyPmUsername } from "../pmParams";
import { BiometryError, BiometryErrorType } from "@aparajita/capacitor-biometric-auth";



function needsUserPassword(identity: Identity): boolean {
	return (
		identity.type === IdentityType.LOCAL_KEY &&
		identity.localSecret.storage === "inline_encrypted" &&
		identity.localSecret.passwordMode === "user"
	);
}

function needsSanctumReauth(identity: Identity): boolean {
	return (
		identity.type === IdentityType.SANCTUM &&
		(Boolean(identity.reauthReason) || identity.sanctumTokens === undefined)
	);
}



/**
 * UI-facing identity unlock orchestrator.
 *
 * This hook wraps the core `unlockIdentity` helper with user interactions that
 * may be required before the actual unlock can happen:
 * - asks for password when a web local-key identity uses `passwordMode: "user"`
 * - opens Sanctum reauth modal when Sanctum tokens are missing/expired
 * - validates reauth result belongs to the same identity pubkey
 * - persists fresh Sanctum tokens before continuing
 * - runs device auth when the OS supports it (biometrics or screen lock)
 *
 * Returns `prepareWithUi(identity, options)`, which resolves to:
 * - `RuntimeIdentity` on success
 * - throws on failures (mismatch, reauth failure, password required, storage/crypto/auth errors)
 */
export function useUnlockIdentity() {
	const askPassword = useAskPassword();
	const askSanctumReauth = useAskSanctumReauth();
	const dispatch = useAppDispatch();


	const verifySanctumIdentityMatch = useCallback(
		async (expectedPubkey: string, tokensData: TokensData): Promise<void> => {
			const sdk = createSanctumDK({
				url: SANCTUM_URL,
				tokenDataAdapter: {
					getTokenData: () => tokensData,
					setTokenData: () => { },
					clearTokenData: () => { },
				},
			});

			const actualPubkey = await sdk.api.getPublicKey();
			if (actualPubkey !== expectedPubkey) {
				throw new Error("Reauthenticated Sanctum account does not match selected identity");
			}
		},
		[]
	);

	const prepareWithUi = useCallback(
		async (
			identity: Identity,
			options: UnlockIdentityOptions = {}
		): Promise<RuntimeIdentity> => {
			let userPassword: string | null | undefined = options.userPassword;
			let sanctumTokensData: TokensData | undefined = options.sanctumTokensData;

			if (needsUserPassword(identity) && !userPassword) {
				userPassword = await askPassword({
					title: "Unlock Identity",
					description: `Enter password for "${identity.label}"`,
					username: makeIdentityPrivateKeyPmUsername(identity.pubkey),
				});
				if (!userPassword) throw new BiometryError("Password required to unlock identity", BiometryErrorType.userCancel);
			}

			if (needsSanctumReauth(identity)) {
				const tokensFromReauth = await askSanctumReauth({ pubkey: identity.pubkey });
				if (!tokensFromReauth) throw new Error("Sanctum reauth required to unlock identity");
				await verifySanctumIdentityMatch(identity.pubkey, tokensFromReauth);
				await dispatch(
					setIdentitySanctumTokensData({
						pubkey: identity.pubkey,
						tokensData: tokensFromReauth,
					})
				);
				sanctumTokensData = tokensFromReauth;
			}

			return withDeviceAuth({
				reason: "Authenticate to unlock this identity",
			}, () => unlockIdentity(identity, {
				...options,
				userPassword: userPassword ?? undefined,
				sanctumTokensData: sanctumTokensData ?? undefined,
			}))
		},
		[
			askSanctumReauth,
			askPassword,
			dispatch,
			verifySanctumIdentityMatch,
		]
	);

	return {
		prepareWithUi,
	};
}
