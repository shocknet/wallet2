import type { ReactNode } from "react";
import { useCallback } from "react";
import {
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonToolbar,
	useIonRouter,
} from "@ionic/react";
import { useLocation } from "react-router-dom";
import { homeOutline } from "ionicons/icons";
import { DASH_NAV, isDashNavActive } from "./dashNav";
import {
	LIGHTNING_PUB_MARK_HEIGHT,
	LIGHTNING_PUB_WORDMARK_HEIGHT,
	useLightningPubLogo,
} from "@/Assets/Images/lightning-pub";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import { useDashboardSource, useDashboardSourceSwitch } from "@/Pages/Metrics/DashboardSourceContext";

type DashBoardPageChromeProps = {
	title: string;
	children: ReactNode;
	headerExtra?: ReactNode;
	backHref?: string;
};

export function DashBoardPageChrome({
	title,
	children,
	headerExtra,
	backHref,
}: DashBoardPageChromeProps) {
	const router = useIonRouter();
	return (
		<IonPage data-product="lnpub">
			<IonHeader className="ion-no-border">
				<DashMobileToolbar title={title} />
				<DashNavLinks />
				{headerExtra && (
					<IonToolbar className="pub-dash-extra" mode="md">{headerExtra}</IonToolbar>
				)}
			</IonHeader>
			<IonContent className="ion-content-only">
				<div className="pub-dash-page-content">
					<div className="pub-dash-heading">
						<h1>{title}</h1>
						{backHref && (
							<button
								type="button"
								className="pub-dash-desktop-toolbar-back"
								onClick={() => router.push(backHref, "back")}
							>
								Back
							</button>
						)}
					</div>
					{children}
				</div>
			</IonContent>
		</IonPage>
	);
}

let dashLogoTaps = 0
let dashLogoTimer: ReturnType<typeof setTimeout> | null = null

function useDashLogoTaps(onSingle: () => void, onTriple: () => void) {
	return useCallback(() => {
		if (dashLogoTimer) clearTimeout(dashLogoTimer)
		dashLogoTaps += 1
		if (dashLogoTaps >= 3) {
			dashLogoTaps = 0
			onTriple()
			return
		}
		dashLogoTimer = setTimeout(() => {
			const n = dashLogoTaps
			dashLogoTaps = 0
			dashLogoTimer = null
			if (n === 1) onSingle()
		}, 500)
	}, [onSingle, onTriple])
}

export function DashBrand({ showWordmark = false }: { showWordmark?: boolean }) {
	const router = useIonRouter();
	const mark = useLightningPubLogo("mark");
	const wordmark = useLightningPubLogo("full");
	const onLogoClick = useDashLogoTaps(
		useCallback(() => router.push("/dashboard", "root"), [router]),
		useCallback(() => router.push("/home", "back"), [router]),
	);

	return (
		<button
			type="button"
			className="pub-dash-brand"
			aria-label="Dashboard overview"
			onClick={onLogoClick}
		>
			{showWordmark ? (
				<img
					src={wordmark}
					alt="Lightning.pub"
					className="pub-dash-brand-word"
					style={{ height: LIGHTNING_PUB_WORDMARK_HEIGHT.nav, width: "auto" }}
				/>
			) : (
				<img
					src={mark}
					alt=""
					style={{ height: LIGHTNING_PUB_MARK_HEIGHT.inline, width: "auto" }}
				/>
			)}
		</button>
	);
}

export function DashNavLinks() {
	const router = useIonRouter();
	const { pathname } = useLocation();

	return (
		<IonToolbar className="pub-dash-mobile-nav">
			<nav className="pub-dash-links" aria-label="Dashboard">
				{DASH_NAV.map((item) => {
					const active = isDashNavActive(item.href, pathname, item.exact);
					return (
						<button
							key={item.href}
							type="button"
							className={`pub-dash-link${active ? " is-active" : ""}`}
							onClick={() => router.push(item.href, "root")}
						>
							<IonIcon icon={item.icon} />
							{item.label}
						</button>
					);
				})}
			</nav>
		</IonToolbar>
	);
}

export function DashSourceChip() {
	const { open } = useDashboardSourceSwitch();
	const source = useDashboardSource()
	const name = sourceDisplayName(source);
	const warn = source.beaconStale === "stale" || source.beaconStale === "warmingUp";

	return (
		<button
			type="button"
			className={`pub-dash-source-chip${warn ? " is-warn" : ""}`}
			onClick={open}
			title={name}
			aria-haspopup="dialog"
			aria-label="Switch admin source"
		>
			<span className="pub-dash-source-dot" />
			<span className="pub-dash-source-name">{name}</span>
		</button>
	);
}

function DashExit() {
	const router = useIonRouter();
	return (
		<button
			type="button"
			className="pub-dash-exit"
			aria-label="Back to wallet"
			onClick={() => router.push("/home", "back")}
		>
			<IonIcon icon={homeOutline} />
		</button>
	);
}

function DashMobileToolbar({ title }: { title: string }) {
	return (
		<IonToolbar className="pub-dash-mobile-toolbar">
			<div>
				<DashBrand />
				<h1 className="pub-dash-top-title">{title}</h1>
				<div className="pub-dash-source">
					<DashSourceChip />
					<DashExit />
				</div>
			</div>
		</IonToolbar>
	);
}

export default DashBoardPageChrome;
