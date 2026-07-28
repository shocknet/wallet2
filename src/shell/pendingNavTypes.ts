
export type PendingNav = {
	kind: "route";
	path: string;
	state?: Record<string, unknown>;
	identityId?: string;
};

export type RoutePendingNav = PendingNav;

export function isRoutePendingNav(
	nav: PendingNav,
): nav is RoutePendingNav {
	return nav.kind === "route";
}
