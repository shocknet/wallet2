import { IonContent, IonIcon, IonMenu, IonMenuToggle, useIonRouter } from "@ionic/react";
import { useLocation } from "react-router-dom";
import { DashBrand, DashSourceChip } from "./DashBoardPageChrome";
import { DASH_MENU_ID, DASH_NAV, isDashNavActive } from "./dashNav";
import { useWalletAvatar } from "@/Assets/Images/wallet-avatar";

export function DashRailMenu() {
	const router = useIonRouter();
	const walletAvatar = useWalletAvatar();
	return (
		<IonMenu menuId={DASH_MENU_ID} contentId="dash-main" className="pub-dash-rail-menu">
			<IonContent>
				<div className="pub-dash-rail">
					<div className="pub-dash-rail-brand">
						<DashBrand showWordmark />
					</div>
					<div className="pub-dash-rail-links">
						<DashRailNavLinks />
					</div>
					<div className="pub-dash-rail-foot">
						<DashSourceChip />
						<button
							type="button"
							className="pub-dash-wallet-btn"
							onClick={() => router.push("/home", "root")}
						>
							<img src={walletAvatar} alt="" aria-hidden />
							Back to ShockWallet
						</button>
					</div>
				</div>
			</IonContent>
		</IonMenu>
	);
}

function DashRailNavLinks() {
	const router = useIonRouter();
	const { pathname } = useLocation();

	return (
		<nav className="pub-dash-links" aria-label="Dashboard">
			{DASH_NAV.map((item) => {
				const active = isDashNavActive(item.href, pathname, item.exact);
				return (
					<IonMenuToggle key={item.href} menu={DASH_MENU_ID} autoHide={false}>
						<button
							type="button"
							className={`pub-dash-link${active ? " is-active" : ""}`}
							onClick={() => router.push(item.href, "root")}
						>
							<IonIcon icon={item.icon} />
							{item.label}
						</button>
					</IonMenuToggle>
				);
			})}
		</nav>
	);
}
