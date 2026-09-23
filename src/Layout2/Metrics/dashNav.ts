import {
	cloudUploadOutline,
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

export const DASH_MENU_ID = "dash-rail";

export const DASH_NAV: DashNavItem[] = [
	{ href: "/dashboard", label: "Overview", icon: statsChartOutline, exact: true },
	{ href: "/dashboard/assets-liabilities", label: "Assets", icon: walletOutline },
	{ href: "/dashboard/earnings", label: "Earnings", icon: trendingUpOutline },
	{ href: "/dashboard/backups", label: "Backups", icon: cloudUploadOutline },
	{ href: "/dashboard/channels", label: "Channels", icon: gitNetworkOutline },
	{ href: "/dashboard/peers", label: "Peers", icon: globeOutline },
	{ href: "/dashboard/routing", label: "Routing", icon: swapHorizontalOutline },
	{ href: "/dashboard/users", label: "Users", icon: peopleOutline },
	{ href: "/dashboard/swaps", label: "Swaps", icon: repeatOutline },
	{ href: "/dashboard/manage", label: "Manage", icon: settingsOutline },
];

export function isDashNavActive(href: string, pathname: string, exact?: boolean): boolean {
	if (exact) {
		return pathname === href || pathname === `${href}/`;
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}
