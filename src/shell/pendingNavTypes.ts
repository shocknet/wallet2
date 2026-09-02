
import type { ParsedLnurlWithdrawInput } from "@/lib/types/parse";

export type RoutePendingNav = {
	kind: "route";
	path: string;
	state?: Record<string, unknown>;
	identityId?: string;
};

export type SweepLnurlwPendingNav = {
	kind: "sweep-lnurlw";
	parsed: ParsedLnurlWithdrawInput;
	identityId?: string;
};

export type PendingNav = RoutePendingNav | SweepLnurlwPendingNav;

export function isRoutePendingNav(
	nav: PendingNav,
): nav is RoutePendingNav {
	return nav.kind === "route";
}

export function isSweepLnurlwPendingNav(
	nav: PendingNav,
): nav is SweepLnurlwPendingNav {
	return nav.kind === "sweep-lnurlw";
}
