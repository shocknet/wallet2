import type { Satoshi } from "@/lib/types/units";

export type SpendableSource = {
	sourceId: string;
	maxWithdrawableSats: number;
};
import { InputClassification, type ParsedInput } from "@/lib/types/parse";
import { OfferPriceType } from "@shocknet/clink-sdk";
import { isSendParsedInput } from "./nav";

const hasBalance = (s: { maxWithdrawableSats?: number }) =>
	(s.maxWithdrawableSats ?? 0) > 0;

export function pickDefaultSource(
	sources: SpendableSource[],
	favoriteSourceId: string | null,
): SpendableSource | undefined {
	const favorite = sources.find((s) => s.sourceId === favoriteSourceId);
	if (favorite && hasBalance(favorite)) return favorite;
	const withBalance = sources.find(hasBalance);
	if (withBalance) return withBalance;
	return sources[0];
}

export function pickSourceCoveringAmount(
	sources: SpendableSource[],
	amount: Satoshi,
	favoriteSourceId?: string | null,
): SpendableSource | null {
	const covering = sources.filter((s) => s.maxWithdrawableSats >= amount);
	if (covering.length === 0) return null;
	const favorite = covering.find((s) => s.sourceId === favoriteSourceId);
	return favorite ?? covering[0];
}

// Send ignores chain addresses and nprofiles
// note: chain addresses will be allowed in the future
export const SEND_DISALLOWED_CLASSIFICATIONS = [
	InputClassification.BITCOIN_ADDRESS,
	InputClassification.NPROFILE,
] as const;

export function validateSendRecipient(parsed: ParsedInput): string | null {
	if (parsed.type === InputClassification.LNURL_WITHDRAW) {
		return "Lnurl cannot be a lnurl-withdraw";
	}
	if (parsed.type === InputClassification.LN_INVOICE && !parsed.amount) {
		return "Zero value invoices are not supported";
	}
	if (
		parsed.type === InputClassification.NOFFER &&
		parsed.noffer.priceType !== OfferPriceType.Spontaneous &&
		!parsed.noffer.price
	) {
		return "Invalid offer price for a fixed-price offer";
	}
	if (!isSendParsedInput(parsed)) {
		return "Unsupported recipient";
	}
	return null;
}

