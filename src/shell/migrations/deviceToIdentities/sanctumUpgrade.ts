import { isAxiosError } from "axios";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import type { TokensData } from "sanctum-sdk";
import { generateNewKeyPair } from "@/Api/helpers";
import { getKeyLinkClient } from "@/Api/keylink/http";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from "@/constants";
import { DeviceToIdentitiesMigrationError } from "./errors";

function resolveLegacySanctumClientKey(): string {
	const privkey = localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY);
	if (privkey) {
		return getPublicKey(hexToBytes(privkey));
	}

	return generateNewKeyPair().publicKey;
}

export async function upgradeLegacySanctumAccessToken(
	legacyAccessToken: string,
): Promise<TokensData> {
	const client = getKeyLinkClient(legacyAccessToken);

	try {
		const result = await client.UpgradeLegacyAccessToken({
			access_token: legacyAccessToken,
			client_key: resolveLegacySanctumClientKey(),
		});

		if (result.status === "ERROR") {
			throw new DeviceToIdentitiesMigrationError(
				"sanctum-upgrade-failed",
				result.reason,
				"sanctum",
			);
		}

		const { status: _status, ...tokensData } = result;
		return tokensData as TokensData;
	} catch (error) {
		if (error instanceof DeviceToIdentitiesMigrationError) {
			throw error;
		}

		if (isAxiosError(error) && !error.response) {
			throw new DeviceToIdentitiesMigrationError(
				"sanctum-upgrade-network-failed",
				"Could not reach Sanctum to upgrade your access token.",
				"sanctum",
				{ cause: error },
			);
		}

		const message = error instanceof Error ? error.message : String(error);
		throw new DeviceToIdentitiesMigrationError(
			"sanctum-upgrade-failed",
			message,
			"sanctum",
			{ cause: error },
		);
	}
}
