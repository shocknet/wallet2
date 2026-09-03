import {
	gitNetworkOutline,
	globeOutline,
	peopleOutline,
	repeatOutline,
	settingsOutline,
	statsChartOutline,
	swapHorizontalOutline,
	trendingUpOutline,
	walletOutline,
} from "ionicons/icons";

export type DashNavItem = {
	href: string;
	label: string;
	icon: string;
	exact?: boolean;
};

export const DASH_NAV: DashNavItem[] = [
	{ href: "/metrics", label: "Overview", icon: statsChartOutline, exact: true },
	{ href: "/metrics/channels", label: "Channels", icon: gitNetworkOutline },
	{ href: "/metrics/peers", label: "Peers", icon: globeOutline },
	{ href: "/metrics/earnings", label: "Earnings", icon: trendingUpOutline },
	{ href: "/metrics/routing", label: "Routing", icon: swapHorizontalOutline },
	{ href: "/metrics/users", label: "Users", icon: peopleOutline },
	{ href: "/metrics/swaps", label: "Swaps", icon: repeatOutline },
	{ href: "/metrics/assets-liabilities", label: "Assets", icon: walletOutline },
	{ href: "/metrics/manage", label: "Manage", icon: settingsOutline },
];

export function isDashNavActive(href: string, pathname: string, exact?: boolean): boolean {
	if (exact) {
		return pathname === href || pathname === `${href}/`;
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}
