/** Keep a module singleton across Vite HMR so we do not open a second relay socket. */
export function readHotData<T>(key: string): T | undefined {
	return import.meta.hot?.data?.[key] as T | undefined;
}

export function persistHotData<T>(key: string, getValue: () => T | null): void {
	import.meta.hot?.dispose((data) => {
		const value = getValue();
		if (value != null) data[key] = value;
	});
}

export function acceptHotModule(): void {
	import.meta.hot?.accept();
}
