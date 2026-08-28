import type { AmountLimits } from "@/Components/AmountField";
import { OfferPriceType } from "@shocknet/clink-sdk";
import { InputClassification, type ParsedInput } from "@/lib/types/parse";
import type { Satoshi } from "@/lib/types/units";
import { satoshi } from "@/lib/units";
import type { AmountRange } from "./types";

export type AmountIntent = {
	fixedSats: Satoshi | null;
	limits: AmountLimits;
	// focus amount field
	focusAmount: boolean;
};

export function getAmountFieldIntent(
	parsed: ParsedInput | null,
	maxWithdrawable: Satoshi,
	nofferRange: AmountRange | null = null,
): AmountIntent {
	const base = {
		min: satoshi(1),
		max: maxWithdrawable,
	};

	if (!parsed) {
		return { fixedSats: null, limits: base, focusAmount: false };
	}

	switch (parsed.type) {
		case InputClassification.LN_INVOICE:
			return {
				fixedSats: parsed.amount,
				limits: base,
				focusAmount: false,
			};

		case InputClassification.LNURL_PAY:
		case InputClassification.LN_ADDRESS:
			return {
				fixedSats: null,
				limits: {
					min: parsed.min,
					max: satoshi(Math.min(parsed.max, maxWithdrawable)),
				},
				focusAmount: true,
			};

		case InputClassification.NOFFER: {
			if (parsed.noffer.priceType !== OfferPriceType.Spontaneous) {
				const price = parsed.noffer.price;
				if (!price) {
					return { fixedSats: null, limits: base, focusAmount: false };
				}
				return {
					fixedSats: satoshi(price),
					limits: base,
					focusAmount: false,
				};
			}

			if (nofferRange) {
				return {
					fixedSats: null,
					limits: {
						min: nofferRange.min,
						max: satoshi(Math.min(nofferRange.max, maxWithdrawable)),
					},
					focusAmount: true,
				};
			}

			return {
				fixedSats: null,
				limits: base,
				focusAmount: true,
			};
		}

		default:
			return { fixedSats: null, limits: base, focusAmount: false };
	}
}
