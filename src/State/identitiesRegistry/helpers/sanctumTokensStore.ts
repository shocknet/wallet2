import { Capacitor } from "@capacitor/core";
import type { TokensData } from "sanctum-sdk";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import {
	deleteSanctumSession,
	getSanctumTokensData,
	sanctumTokensStorageKey,
	setSanctumTokensData,
} from "./secureSecrets";


export async function readSanctumTokens(pubkey: string): Promise<TokensData | null> {
	if (Capacitor.isNativePlatform()) {
		return getSanctumTokensData(sanctumTokensStorageKey(pubkey));
	}
	const raw = await IonicStorageAdapter.getItem(sanctumTokensStorageKey(pubkey));
	if (!raw) return null;
	try {
		return JSON.parse(raw) as TokensData;
	} catch {
		return null;
	}
}

export async function writeSanctumTokens(
	pubkey: string,
	tokensData: TokensData,
): Promise<void> {
	if (Capacitor.isNativePlatform()) {
		await setSanctumTokensData(pubkey, tokensData);
		return;
	}
	await IonicStorageAdapter.setItem(sanctumTokensStorageKey(pubkey), JSON.stringify(tokensData));
}

export async function deleteSanctumTokens(pubkey: string): Promise<void> {
	if (Capacitor.isNativePlatform()) {
		await deleteSanctumSession(sanctumTokensStorageKey(pubkey));
		return;
	}
	await IonicStorageAdapter.removeItem(sanctumTokensStorageKey(pubkey));
}
