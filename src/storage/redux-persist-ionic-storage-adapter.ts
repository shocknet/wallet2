import { Drivers, Storage } from '@ionic/storage';

const ionicStorage = new Storage({
	name: "_shockwallet",
	driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
});
const storageReady = ionicStorage.create(); // Promise assignment


const IonicStorageAdapter = {
	getItem: async (key: string): Promise<string | null> => {
		await storageReady;
		const value = await ionicStorage.get(key);
		return value ?? null;
	},
	setItem: async (key: string, value: string): Promise<void> => {
		await storageReady;
		await ionicStorage.set(key, value);
	},
	removeItem: async (key: string): Promise<void> => {
		await storageReady;
		await ionicStorage.remove(key);
	}
}

export default IonicStorageAdapter;
