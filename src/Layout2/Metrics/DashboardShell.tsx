import type { ReactNode } from "react";
import { useCallback } from "react";
import { IonContent, IonHeader, IonIcon, IonPage, useIonRouter } from "@ionic/react";
import { useLocation } from "react-router-dom";
import { homeOutline } from "ionicons/icons";
import { DASH_NAV, isDashNavActive } from "./dashNav";
import {
	LIGHTNING_PUB_MARK_HEIGHT,
	LIGHTNING_PUB_WORDMARK_HEIGHT,
	useLightningPubLogo,
} from "@/Assets/Images/lightning-pub";
import { useAppSelector } from "@/State/store/hooks";
import { selectAdminSourceViews } from "@/State/scoped/backups/sources/selectors";
import { selectSelectedMetricsAdminSourceId } from "@/State/runtime/slice";

type DashboardShellProps = {
	title: string;
	children: ReactNode;
	withContent?: boolean;
	headerExtra?: ReactNode;
	backHref?: string;
	contentClassName?: string;
};

export function DashboardShell({
	title,
	children,
	withContent = true,
	headerExtra,
	backHref,
	contentClassName = "ion-content-no-footer",
}: DashboardShellProps) {
	return (
		<IonPage className="pub-dash" data-product="lnpub">
			<DashRail />
			<div className="pub-dash-stage">
				<IonHeader className="ion-no-border pub-dash-top">
					<DashTopbar title={title} />
					<DashNavLinks />
				</IonHeader>
				{headerExtra && <div className="pub-dash-extra">{headerExtra}</div>}
				{withContent ? (
					<IonContent className={contentClassName}>
						<div className="pub-dash-page">
							<DashPageHeading title={title} backHref={backHref} />
							{children}
						</div>
					</IonContent>
				) : (
					children
				)}
			</div>
		</IonPage>
	);
}

function DashPageHeading({ title, backHref }: { title: string; backHref?: string }) {
	const router = useIonRouter();
	return (
		<div className="pub-dash-heading">
			<h1>{title}</h1>
			{backHref && (
				<button
					type="button"
					className="pub-dash-heading-back"
					onClick={() => router.push(backHref, "back")}
				>
					Back
				</button>
			)}
		</div>
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

function DashBrand({ showWordmark = false }: { showWordmark?: boolean }) {
	const router = useIonRouter();
	const mark = useLightningPubLogo("mark");
	const wordmark = useLightningPubLogo("full");
	const onLogoClick = useDashLogoTaps(
		useCallback(() => router.push("/metrics", "root"), [router]),
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

function DashNavLinks() {
	const router = useIonRouter();
	const { pathname } = useLocation();

	return (
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
	);
}

function DashSourceChip() {
	const router = useIonRouter();
	const admins = useAppSelector(selectAdminSourceViews);
	const selectedId = useAppSelector(selectSelectedMetricsAdminSourceId);
	const source = admins.find((a) => a.sourceId === selectedId);
	const name = source
		? source.beaconName || source.label || source.vanityName || `pub ${source.lpk.slice(0, 8)}`
		: "No source";
	const warn = source?.beaconStale === "stale" || source?.beaconStale === "warmingUp";

	return (
		<button
			type="button"
			className={`pub-dash-source-chip${warn ? " is-warn" : ""}`}
			onClick={() => router.push("/metrics/select", "forward")}
			title={name}
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

function DashTopbar({ title }: { title: string }) {
	return (
		<div className="pub-dash-topbar">
			<DashBrand />
			<h1 className="pub-dash-top-title">{title}</h1>
			<div className="pub-dash-source">
				<DashSourceChip />
				<DashExit />
			</div>
		</div>
	);
}

function DashRail() {
	const router = useIonRouter();
	return (
		<aside className="pub-dash-rail" aria-label="Dashboard">
			<div className="pub-dash-rail-brand">
				<DashBrand showWordmark />
			</div>
			<div className="pub-dash-rail-links">
				<DashNavLinks />
			</div>
			<div className="pub-dash-rail-foot">
				<DashSourceChip />
				<button
					type="button"
					className="pub-dash-wallet-btn"
					onClick={() => router.push("/home", "back")}
				>
					ShockWallet
				</button>
			</div>
		</aside>
	);
}

export default DashboardShell;
