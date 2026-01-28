import { SATS_PER_BTC } from "./constants/units";
import { Bitcoin, MilliSatoshi, Satoshi } from "./types/units";




const asBitcoin = (value: number): Bitcoin => value as Bitcoin;
const asSatoshi = (value: number): Satoshi => value as Satoshi;


function btcToSats(btc: string): Satoshi {

	const [integer, fraction] = btc.split(".");
	const whole = integer === "" ? "0" : integer;

	let frac = (fraction ?? "").slice(0, 8);
	while (frac.length < 8) frac += "0";

	let satsStr = (whole + frac).replace(/^0+(?=\d)/, "");
	if (satsStr === "") satsStr = "0";

	const sats = Number(satsStr);
	if (!Number.isFinite(sats) || sats < 0) throw new Error("invalid");

	return asSatoshi(sats);
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
	const trimmed = input.trim();
	if (!trimmed) return asSatoshi(0);


	if (unit === "sats") {
		const digits = trimmed.replace(/\D/g, ""); // remove anything but digits
		const numeric = Number(digits);
		if (!Number.isFinite(numeric) || numeric < 0) {
			throw new Error("Invalid amount");
		}

		return asSatoshi(numeric);
	}


	return btcToSats(trimmed);
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
