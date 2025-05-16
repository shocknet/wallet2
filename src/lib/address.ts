import { Network, validate } from 'bitcoin-address-validation';

export function validateAddress(address: string) {
	const isValidAddress = validate(address, Network.mainnet);
	if (!isValidAddress) {
		throw new Error("Invalid bitcoin address");
	}
}