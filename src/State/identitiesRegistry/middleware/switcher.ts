import type { AppstartListening } from "@/State/store/listenerMiddleware";
import { REHYDRATE } from "redux-persist";

const waiters = new Map<string, Array<() => void>>();

export async function waitForRehydrateKeys(keys: string[]) {
	const promises = keys.map(key => new Promise<void>((resolve) => {
		const arr = waiters.get(key) ?? [];
		arr.push(resolve);
		waiters.set(key, arr);
	}));
	return Promise.all(promises);
}
export const addHydrationListener = (startAppListening: AppstartListening) => {
	startAppListening({
		type: REHYDRATE,
		effect: async (action) => {
			if (
				"key" in action && typeof action.key === "string"
			) {
				const arr = waiters.get(action.key)
				if (arr?.length) {
					waiters.delete(action.key);
					for (const resolve of arr) resolve();
				}
			}
		}
	})
}
