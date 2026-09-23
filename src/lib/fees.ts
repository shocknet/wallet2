import axios from "axios";
import { defaultMempool } from "@/constants";

export interface FeeTier {
	rate: number;
	description: string;
	label: string;
	key: "economy" | "average" | "fast";
}


export function resolveFeeUrl(url?: string | null): string {
	const trimmed = (url || "").trim();
	if (!trimmed) return defaultMempool;
	try {
		const parsed = new URL(trimmed);
		if (!parsed.pathname || parsed.pathname === "/") {
			parsed.pathname = "/api/v1/fees/recommended";
			return parsed.toString();
		}
	} catch {
		return defaultMempool;
	}
	return trimmed;
}

export function feeHostLabel(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return "mempool";
	}
}

export async function getFeeTiers(mempoolUrl: string): Promise<FeeTier[]> {
	try {
		const response = await axios.get(mempoolUrl)
		return [
			{
				rate: response.data.economyFee,
				label: "Economy",
				description: "~1-24 hours (cheapest)",
				key: "economy"
			},
			{
				rate: Math.ceil((response.data.hourFee + response.data.halfHourFee) / 2),
				label: "Average",
				description: "~30-60 minutes",
				key: "average"
			},
			{
				rate: response.data.fastestFee,
				label: "Fast",
				description: "~10-20 minutes",
				key: "fast"
			}
		]
	} catch (err: any) {
		if (err.response) {
			throw new Error("Lnurl service responded with status: " + err.response.status);
		} else if (err.request) {
			throw new Error("No response from lnurl service");
		} else {
			throw new Error("Unknown error occured when trying to fetch lnurl service");
		}
	}
}