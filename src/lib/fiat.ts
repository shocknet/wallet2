import axios from "axios";
import { type Satoshi } from "./types/units";
import { satsToBtc } from "./units";

interface CurrencyCache {
	rate: number | null;
	timestamp: number;
}


const CACHE_DURATION = 5 * 60 * 1000;
const cache: Record<string, CurrencyCache> = {};


async function fetchExchangeRates(url: string): Promise<number | null> {


	try {
		const response = await axios.get(url);



		const { amount } = response.data.data;
		return parseFloat(amount);

	} catch (err) {

		console.error('Error fetching exchange rate:', err);
		return null;
	}
}


async function getExchangeRate(currency: string, url: string): Promise<number | null> {
	const now = Date.now();
	const cached = cache[currency];

	if (cached && (now - cached.timestamp) < CACHE_DURATION) {
		return cached.rate;
	}

	const rate = await fetchExchangeRates(url);
	cache[currency] = { rate, timestamp: now };
	return rate;
}


export async function convertSatsToFiat(
	sats: Satoshi,
	currency: string,
	url: string
): Promise<number | null> {
	if (typeof sats !== 'number' || sats < 0) {
		return null;
	}

	const rate = await getExchangeRate(currency, url);
	if (!rate) return null;

	return satsToBtc(sats) * rate


}



