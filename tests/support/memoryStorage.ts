import type { Storage } from "redux-persist";

export type MemoryStorage = Storage & {
	snapshot: () => Record<string, string>;
};

export function memoryStorage(): MemoryStorage {
	const items = new Map<string, string>();
	return {
		getItem(key) {
			const value = items.get(key);
			return Promise.resolve(value === undefined ? null : value);
		},
		setItem(key, value) {
			items.set(key, value);
			return Promise.resolve();
		},
		removeItem(key) {
			items.delete(key);
			return Promise.resolve();
		},
		snapshot() {
			return Object.fromEntries(items);
		},
	};
}
