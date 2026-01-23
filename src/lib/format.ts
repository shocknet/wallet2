import { MAX_BTC, MAX_DECIMALS, MAX_SATS } from "./constants/units";



function formatSatsInput(input: string): string {
	let cleaned = input.replace(/\D/g, "");

	cleaned = cleaned.replace(/^0+/, "");
	if (cleaned === "") {
		return "";
	}

	let asNumber = Number(cleaned);
	if (asNumber > MAX_SATS) {
		asNumber = MAX_SATS;
	}
	return asNumber.toLocaleString();
}

function formatBtcInput(input: string): string {
	const cleaned = input.replace(/[^0-9.]/g, "");


	let [integer = "", fraction = ""] = cleaned.split(".");


	if (integer !== "0" && integer !== "") {
		integer = integer.replace(/^0+/, "");
	}

	// Limit fraction to 8 decimals
	fraction = fraction.slice(0, MAX_DECIMALS);

	// Ensure at least one decimal point
	// If there's only a decimal point, add a leading zero
	const hasDecimal = cleaned.includes(".") || input.endsWith(".");
	let sanitizedString = `${integer}${hasDecimal ? "." : ""}${fraction}`.replace(/^\./, "0.");

	// Ensure the number is not greater than the max BTC
	const asNumber = parseFloat(sanitizedString);
	if (!Number.isNaN(asNumber) && asNumber > MAX_BTC) {
		sanitizedString = MAX_BTC.toFixed(MAX_DECIMALS).replace(/\.?0+$/, "");
	}
	return sanitizedString;
}


/**
 * Clean and format user input based on the selected unit.
 * - BTC: remove extra decimals, remove leading zeros in integer part
 * - Sats: allow digits only, add commas, remove leading zeros
 */
export function validateAndFormatAmountInput(raw: string, unit: "BTC" | "sats"): string {
	if (unit === "BTC") {
		return formatBtcInput(raw);
	} else {
		return formatSatsInput(raw);
	}
}


export function formatFiat(
	amount: number | null,
	currency: string
): string {
	if (amount === null) return "";

	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}


export function truncateTextMiddle(
	address: string,
	startChars = 7,
	endChars = 7,
	separator = '...'
): string {
	if (!address || address.length <= startChars + endChars) return address;
	return `${address.substring(0, startChars)}${separator}${address.substring(address.length - endChars)}`;
}

export function capFirstLetter(
	text: string
): string {
	if (!text) return text;
	return text.charAt(0).toUpperCase() + text.slice(1);
}
