

export const WALLET_CLIENT_KEY_STORAGE_KEY = "WALLET_CLIENT_KEY";

export const getClientKey = () => {
	let clientKey = localStorage.getItem(WALLET_CLIENT_KEY_STORAGE_KEY);
	if (clientKey) {
		return clientKey
	}

	clientKey = makeId(16);
	localStorage.setItem(WALLET_CLIENT_KEY_STORAGE_KEY, clientKey);
	return clientKey;
}

export const formatTime = (seconds: number) => {
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	return `${minutes
		.toString()
		.padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const makeId = (length: number) => {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
