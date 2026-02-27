import { Preferences } from "@capacitor/preferences";

let cached: string | null = null;

const KEY = "push_token";

export function getCachedPushToken(): string | null {
	return cached;
}

export async function hydratePushTokenCache() {
	if (cached !== null) return;
	const { value } = await Preferences.get({ key: KEY });
	cached = value ?? null;
}

export async function setCachedPushToken(t: string) {
	cached = t;
	await Preferences.set({ key: KEY, value: t });
}

export async function clearCachedPushToken() {
	cached = null;
	await Preferences.remove({ key: KEY });
}
