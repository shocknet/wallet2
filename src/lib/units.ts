import { SATS_PER_BTC } from "./constants/units";
import { Bitcoin, MilliSatoshi, Satoshi } from "./types/units";




const asBitcoin = (value: number): Bitcoin => value as Bitcoin;
const asSatoshi = (value: number): Satoshi => value as Satoshi;



export function btcToSats(btc: Bitcoin): Satoshi {
	return asSatoshi(Math.round(btc * SATS_PER_BTC));
}

export function satsToBtc(sats: Satoshi): Bitcoin {
	return asBitcoin(sats / SATS_PER_BTC);
}

export function formatBitcoin(btc: Bitcoin, decimalPlaces = 8) {
	return btc.toFixed(decimalPlaces);
}


export function formatSatoshi(sats: Satoshi): string {
	return sats.toLocaleString();
}

export function msatsToSats(
	msats: number,
	rounding: "floor" | "ceil" | "round" = "floor"
): Satoshi {
	const raw = msats / 1000;
	switch (rounding) {
		case "floor": return asSatoshi(Math.floor(raw));
		case "ceil": return asSatoshi(Math.ceil(raw));
		case "round": return asSatoshi(Math.round(raw));
	}
}

export function parseUserInputToSats(input: string, unit: "BTC" | "sats"): Satoshi {
	const raw = input.replace(/,/g, "").trim(); // remove commas & spaces
	if (!raw) return asSatoshi(0);

	const numeric = Number(raw);
	if (Number.isNaN(numeric) || numeric < 0) {
		throw new Error("Invalid amount");
	}

	if (unit === "BTC") {
		const btcAmount = asBitcoin(numeric);
		return btcToSats(btcAmount);
	} else {
		return asSatoshi(Math.round(numeric));
	}
}


// Decoding invoices and parsing lnurl params responses
// gives values in millisats, so we validate those values
// since invoices and lnurls are outsiders
export function isValidMSats(value: unknown): value is MilliSatoshi {
	if (typeof value !== "number") return false;
	if (!Number.isFinite(value)) return false;
	if (value < 0) return false;
	if (value > Number.MAX_SAFE_INTEGER) return false;

	return true;
}