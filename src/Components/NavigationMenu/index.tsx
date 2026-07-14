import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonImg,
	IonItem,
	IonItemDivider,
	IonItemGroup,
	IonLabel,
	IonList,
	IonMenu,
	IonMenuToggle,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import {
	analyticsOutline,
	bugOutline,
	calendarNumberOutline,
	closeOutline,
	flashOutline,
	helpCircleOutline,
	logoBitcoin,
	peopleOutline,
	personAddOutline,
	pricetagOutline,
	settingsOutline,
	starOutline,
	swapHorizontalOutline,
} from "ionicons/icons";
import { memo, useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";
import { useAppSelector } from "@/State/store/hooks";
import { selectAdminNprofileViews } from "@/State/scoped/backups/sources/selectors";
import { exportDebugReport } from "@/lib/debugReportExport";
import { SwitchProfileSheet } from "@/Components/User/SwitchProfileSheet";
import { ProfilePicture } from "@/Components/User/ProfilePicture";
import { RuntimeIdentity } from "@/shell/types";

interface AppBuildInfo {
	appId: string;
	versionCode: string;
	versionName: string;
}

const itemClass =
	"[--background:transparent] [--background-hover:transparent] [--background-activated:transparent] [--background-focused:transparent]";

const getMenuItems = (hasAdminSources: boolean) => {
	const items: {
		title: string;
		icon: string;
		path: string;
		color?: string;
	}[] = [
			{ title: "Automation", icon: calendarNumberOutline, path: "/automation" },
			{ title: "Address Book", icon: peopleOutline, path: "/contacts" },
			{ title: "Linked Apps", icon: starOutline, path: "/lapps" },
			{ title: "Static Offers", icon: pricetagOutline, path: "/offers" },
			{ title: "Preferences", icon: settingsOutline, path: "/prefs" },
			{ title: "Node Connections", icon: flashOutline, path: "/sources" },
		];
	if (hasAdminSources) {
		items.push({
			title: "Invite Links",
			icon: personAddOutline,
			path: "/invitations",
		});
		items.push({
			title: "Dashboard",
			icon: analyticsOutline,
			path: "/metrics",
			color: "#c740c7",
		});
	}
	return items;
};
interface NavigationMenuProps {
	activeIdentity: RuntimeIdentity;
}
export const NavigationMenu = memo(function NavigationMenu({
	activeIdentity,
}: NavigationMenuProps) {
	const [appInfo, setAppInfo] = useState<AppBuildInfo | null>(null);
	const [switchOpen, setSwitchOpen] = useState(false);
	const healthyAdminSources = useAppSelector(selectAdminNprofileViews);
	const hasAdminSources = healthyAdminSources.length > 0;

	useEffect(() => {
		const setupAppBuildInfo = async () => {
			try {
				if (Capacitor.isNativePlatform()) {
					const res = await App.getInfo();
					setAppInfo({
						appId: res.id,
						versionCode: res.build,
						versionName: res.version,
					});
				} else {
					setAppInfo({
						appId: "web-build",
						versionCode: __WEB_APP_VERSION_CODE__,
						versionName: __WEB_APP_VERSION__,
					});
				}
			} catch (err: unknown) {
				console.error(
					"Error getting app build info: ",
					err instanceof Error ? err.message : "",
				);
			}
		};
		void setupAppBuildInfo();
	}, []);

	return (
		<>
			<IonMenu type="overlay" contentId="main-content" side="end">
				<IonHeader className="ion-no-border">
					<IonToolbar className="[--background:transparent]">
						<IonTitle>
							<div className="flex items-center gap-2.5 min-w-0">
								<IonImg
									src={logo}
									alt=""
									className="h-7 w-7 shrink-0"
								/>
								<IonImg
									src={shockwalletText}
									alt="ShockWallet"
									className="h-4 w-auto max-w-[8.5rem] object-contain opacity-90"
								/>
							</div>
						</IonTitle>
						<IonButtons slot="end">
							<IonMenuToggle autoHide={false}>
								<IonButton fill="clear" aria-label="Close menu">
									<IonIcon
										icon={closeOutline}
										slot="icon-only"
										className="text-xl text-secondary"
									/>
								</IonButton>
							</IonMenuToggle>
						</IonButtons>
					</IonToolbar>
					<IonToolbar className="px-4">
						<IonButtons slot="start">
							<IonMenuToggle autoHide={false}>
								<IonButton
									fill="clear"
									className="normal-case [--color:var(--app-text-secondary)]"
									onClick={() => setSwitchOpen(true)}
								>
									<IonIcon
										slot="start"
										icon={swapHorizontalOutline}
										className="text-muted"
									/>
									Switch account
								</IonButton>
							</IonMenuToggle>
						</IonButtons>

						<IonButtons slot="end">
							<IonMenuToggle autoHide={false}>
								<IonButton
									fill="clear"
									routerLink="/profile"
									routerDirection="forward"
									shape="round"
									aria-label="Open profile"
								>
									<ProfilePicture
										identity={activeIdentity}
										size="sm"
										variant="flat"
										className="size-10"
									/>
								</IonButton>
							</IonMenuToggle>
						</IonButtons>
					</IonToolbar>
				</IonHeader>

				<IonContent className="">
					<IonList lines="none" className="bg-transparent p-0">
						<IonItemDivider
							className="min-h-px my-1 [--background:transparent]"
							color="dark"
						/>

						<IonItemGroup>
							{getMenuItems(hasAdminSources).map((item) => (
								<IonMenuToggle key={item.path} autoHide={false}>
									<IonItem
										routerLink={item.path}
										routerDirection="forward"
										className={itemClass}
									>
										{item.color ? (
											<IonIcon
												style={{ color: item.color }}
												icon={item.icon}
												slot="start"
											/>
										) : (
											<IonIcon
												color="medium"
												icon={item.icon}
												slot="start"
											/>
										)}
										<IonLabel className="text-secondary">
											{item.title}
										</IonLabel>
									</IonItem>
								</IonMenuToggle>
							))}
						</IonItemGroup>

						<IonItemDivider
							className="min-h-px my-1 [--background:transparent]"
							color="dark"
						/>

						<IonItemGroup>
							<IonItem button className={itemClass}>
								<IonIcon
									style={{ color: "orange" }}
									icon={logoBitcoin}
									slot="start"
								/>
								<IonLabel className="text-secondary">
									Buy Bitcoin
								</IonLabel>
							</IonItem>
							<IonItem
								href="https://docs.shock.network/"
								target="_blank"
								button
								className={itemClass}
							>
								<IonIcon
									color="success"
									icon={helpCircleOutline}
									slot="start"
								/>
								<IonLabel className="text-secondary">
									Help/About
								</IonLabel>
							</IonItem>
							<IonItem
								button
								className={itemClass}
								onClick={exportDebugReport}
							>
								<IonIcon slot="start" icon={bugOutline} />
								<IonLabel className="text-secondary">
									Export debug log
								</IonLabel>
							</IonItem>
						</IonItemGroup>
					</IonList>

					{appInfo ? (
						<div className="mt-6 px-1 text-xs text-faint">
							{Object.entries(appInfo).map(([key, value]) => (
								<div key={key}>
									<span>{key}: </span>
									<span>{value}</span>
								</div>
							))}
						</div>
					) : null}
				</IonContent>
			</IonMenu>

			<SwitchProfileSheet
				isOpen={switchOpen}
				onDidDismiss={() => setSwitchOpen(false)}
			/>
		</>
	);
});
