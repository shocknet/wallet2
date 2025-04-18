import { Preferences } from '@capacitor/preferences';
import { useEffect, useState, useCallback } from 'react';
import { App } from '@capacitor/app';

type PreferenceChangeEventDetail = {
	key: string;
};

declare global {
	interface WindowEventMap {
		'preferenceChange': CustomEvent<PreferenceChangeEventDetail>;
	}
}

export const usePreference = <T>(key: string, defaultValue: T) => {
	const [cachedValue, setCachedValue] = useState<T>(defaultValue);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		let isActive = true;

		const loadPreference = async () => {
			try {
				const { value } = await Preferences.get({ key });

				if (isActive) {
					const parsed = value ? JSON.parse(value) : defaultValue;
					setCachedValue(parsed);
					setIsLoaded(true);
				}
			} catch (error) {
				console.error(`Failed to load preference ${key}:`, error);
				if (isActive) {
					setCachedValue(defaultValue);
					setIsLoaded(true);
				}
			}
		};

		loadPreference();

		return () => {
			isActive = false;
		};
	}, [key, defaultValue]);



	// Emergency save on app pause
	useEffect(() => {
		const handler = App.addListener('pause', async () => {
			await Preferences.set({
				key,
				value: JSON.stringify(cachedValue)
			});
		});

		return () => {
			handler.remove();
		};
	}, [key, cachedValue]);

	// Cross-tab synchronization
	useEffect(() => {
		const handler = async (event: CustomEvent) => {
			if (event.detail.key === key) {
				setCachedValue(await getStoredValue());
			}
		};

		window.addEventListener('preferenceChange', handler);
		return () => {
			window.removeEventListener('preferenceChange', handler);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	// Helper to safely get stored value
	const getStoredValue = useCallback(async (): Promise<T> => {
		try {
			const { value } = await Preferences.get({ key });
			return value ? JSON.parse(value) : defaultValue;
		} catch {
			return defaultValue;
		}
	}, [defaultValue, key]);

	// Save to storage when value changes
	const setValue = useCallback(async (newValue: T) => {
		try {
			setCachedValue(newValue);

			// Persist to storage
			await Preferences.set({
				key,
				value: JSON.stringify(newValue)
			});
			notifyPreferenceChange(key); // Notify other tabs/windows
		} catch (error) {
			console.error(`Failed to save preference ${key}:`, error);
			// Revert on error
			setCachedValue(await getStoredValue());
		}
	}, [key, getStoredValue]);

	return { cachedValue, setValue, isLoaded };
};


const notifyPreferenceChange = (key: string) => {
	const event = new CustomEvent<PreferenceChangeEventDetail>('preferenceChange', {
		detail: { key }
	});
	window.dispatchEvent(event);
};