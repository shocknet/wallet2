import { createSanctumDK, type SanctumDK, type TokenDataAdapter } from "sanctum-sdk";
import { SANCTUM_URL } from "@/constants";



const sanctumSdksByPubkey = new Map<string, SanctumDK>();

export function getOrCreateSanctumIdentitySdk(args: {
	pubkey: string;
	tokenDataAdapter: TokenDataAdapter;
	onReauthRequired?: (reason?: string) => void;
}): SanctumDK {
	const existing = sanctumSdksByPubkey.get(args.pubkey);
	if (existing) return existing;

	const sdk = createSanctumDK({
		url: SANCTUM_URL,
		tokenDataAdapter: args.tokenDataAdapter,
	});
	sdk.events.onReauthRequired(({ reason }) => {
		args.onReauthRequired?.(reason);
	});

	sanctumSdksByPubkey.set(args.pubkey, sdk);
	return sdk;
}

export function clearSanctumIdentitySdk(pubkey: string): void {
	const existing = sanctumSdksByPubkey.get(pubkey);
	if (!existing) return;

	void existing.destroy();
	sanctumSdksByPubkey.delete(pubkey);
}
