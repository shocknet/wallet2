import { Preferences } from "@capacitor/preferences";

let cached: string | undefined;

const KEY = "push_token";

export async function getCachedPushToken(): Promise<string | undefined> {
	if (!cached) {
		const { value } = await Preferences.get({ key: KEY });
		if (value) {
			cached = value;
			return value;
		}
	}
	return cached;
}



export async function setCachedPushToken(t: string) {
	cached = t;
	await Preferences.set({ key: KEY, value: t });
}

export async function clearCachedPushToken() {
	cached = undefined;
	await Preferences.remove({ key: KEY });
}
