import type { NprofileView } from "@/State/scoped/backups/sources/selectors";
import type { Satoshi } from "@/lib/types/units";
import { InputClassification } from "@/lib/types/parse";

const hasBalance = (s: { maxWithdrawableSats?: number }) =>
	(s.maxWithdrawableSats ?? 0) > 0;

export function pickDefaultSource(
	nprofileViews: NprofileView[],
	favoriteSourceId: string | null,
): NprofileView {
	const favorite = nprofileViews.find((s) => s.sourceId === favoriteSourceId);
	if (favorite && hasBalance(favorite)) return favorite;
	const withBalance = nprofileViews.find(hasBalance);
	if (withBalance) return withBalance;
	return nprofileViews[0];
}

export function pickSourceCoveringAmount(
	sources: NprofileView[],
	amount: Satoshi,
	favoriteSourceId?: string | null,
): NprofileView | null {
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


