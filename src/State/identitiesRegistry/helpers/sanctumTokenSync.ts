import { getStoredState } from "redux-persist";
import type { TokenDataAdapter, TokensData } from "sanctum-sdk";
import store, { persistor } from "@/State/store/store";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { withSanctumRefreshLock } from "@/lib/sanctumRefreshLock";
import { identitiesRegistryPersistKey, type IdentitiesState } from "../slice";
import { IdentityType } from "../types";
import { setIdentitySanctumTokensData } from "../identitySyncThunks";
import { resolveSanctumTokensData } from "./platformSecretStorage";

// Must match sanctum-sdk's ACCESS_TOKEN_REFRESH_SKEW_MS so the SDK never refreshes outside the lock.
const SDK_REFRESH_SKEW_MS = 60_000;

type TokensMessage = { pubkey: string; tokensData: TokensData };

const channel = typeof BroadcastChannel === "undefined"
	? null
	: new BroadcastChannel("sanctum-tokens");

function needsRefresh(tokensData: TokensData | null): boolean {
	return !!tokensData && Date.now() >= tokensData.expires_at - SDK_REFRESH_SKEW_MS;
}

async function readSavedTokens(pubkey: string): Promise<TokensData | null> {
	const saved = await getStoredState({
		key: identitiesRegistryPersistKey,
		storage: IonicStorageAdapter,
	}) as IdentitiesState | undefined;
	const identity = saved?.entities[pubkey];
	if (identity?.type !== IdentityType.SANCTUM) return null;
	return resolveSanctumTokensData(identity);
}

/**
 * Refreshes at most once across all tabs: whoever gets the lock second
 * picks up the tokens the first one saved instead of reusing the old refresh token.
 */
export async function ensureFreshSanctumTokens(args: {
	pubkey: string;
	adapter: TokenDataAdapter;
	refresh: () => Promise<unknown>;
}): Promise<void> {
	if (!needsRefresh(await args.adapter.getTokenData())) return;

	await withSanctumRefreshLock(async () => {
		if (!needsRefresh(await args.adapter.getTokenData())) return;

		const saved = await readSavedTokens(args.pubkey);
		if (saved && !needsRefresh(saved)) {
			await args.adapter.setTokenData(saved);
			return;
		}
		await args.refresh();
	});
}

/** A rotated refresh token is the only valid one, so it goes to disk and to other tabs right away. */
export async function saveSanctumTokens(pubkey: string, tokensData: TokensData): Promise<void> {
	if (!store.getState().identitiesRegistry.entities[pubkey]) return;

	await store.dispatch(setIdentitySanctumTokensData({ pubkey, tokensData }));
	await persistor.flush();
	channel?.postMessage({ pubkey, tokensData } satisfies TokensMessage);
}

export function listenForSanctumTokensFromOtherTabs(): void {
	channel?.addEventListener("message", (event: MessageEvent<TokensMessage>) => {
		void store.dispatch(setIdentitySanctumTokensData(event.data));
	});
}
