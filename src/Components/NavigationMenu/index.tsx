import {
	IonContent,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonItemGroup,
	IonLabel,
	IonList,
	IonMenu,
	IonMenuToggle,
} from "@ionic/react"
import {
	calendarNumberOutline,
	peopleOutline,
	starOutline,
	pricetagOutline,
	settingsOutline,
	flashOutline,
	personAddOutline,
	helpCircleOutline,
	logoBitcoin,
	analyticsOutline,
	bugOutline,
} from "ionicons/icons"
import { memo, useEffect, useState } from "react"
import { App } from "@capacitor/app"
import { Capacitor } from "@capacitor/core"
import { useAppSelector } from "@/State/store/hooks"
import { selectAdminNprofileViews } from "@/State/scoped/backups/sources/selectors"
import { selectActiveIdentityId } from "@/State/identitiesRegistry/slice"
import { exportDebugReport } from "@/lib/debugReportExport"


interface AppBuildInfo {
	appId: string;
	versionCode: string;
	versionName: string;
}
const getMenuItems = (hasAdminSoures: boolean) => {
	const items: { title: string, icon: any, path: string, color?: string }[] = [
		{ title: "Automation", icon: calendarNumberOutline, path: "/automation" },
		{ title: "Contacts", icon: peopleOutline, path: "/contacts" },
		{ title: "Linked Apps", icon: starOutline, path: "/lapps" },
		{ title: "Offer Codes", icon: pricetagOutline, path: "/offers" },
		{ title: "Preferences", icon: settingsOutline, path: "/prefs" },
		{ title: "Manage Sources", icon: flashOutline, path: "/sources" },
		{ title: "Node Invitations", icon: personAddOutline, path: "/invitations" },
	]
	if (hasAdminSoures) {
		items.push({ title: "Dashboard", icon: analyticsOutline, path: "/metrics", color: '#c740c7' })
	}
	return items
}

const NavigationMenu = memo(() => {
	const activeIdentityId = useAppSelector(selectActiveIdentityId);

	if (!activeIdentityId) return null;
	return <Inner />
})
NavigationMenu.displayName = "NavigationMenu";

const Inner = () => {
	const [appInfo, setAppInfo] = useState<AppBuildInfo | null>(null)
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
						versionName: res.version
					})
				} else {
					setAppInfo({
						appId: 'web-build',
						versionCode: __WEB_APP_VERSION_CODE__,
						versionName: __WEB_APP_VERSION__
					})
				}
			} catch (err: any) {
				console.error("Error getting app build info: ", err?.message || "")
			}
		}
		setupAppBuildInfo();
	}, [])


	return (
		<IonMenu type="overlay" contentId="main-content" side="end">
			{/* <NavMenuHeader /> */}
			{/* <IonHeader>
				<IonToolbar color="secondary">
					<IonTitle color="light" className="ion-text-center">Shockwallet</IonTitle>
				</IonToolbar>
			</IonHeader> */}
			<IonContent className="ion-padding">
				<IonList lines="none">

					<IonItemGroup>
						{
							getMenuItems(hasAdminSources).map((item, index) => {
								return (
									<IonMenuToggle key={index} autoHide={false}>
										<IonItem routerLink={item.path} routerDirection="forward">
											{item.color && <IonIcon style={{ color: item.color }} icon={item.icon} slot="start" />}
											{!item.color && <IonIcon color="primary" icon={item.icon} slot="start" />}
											<IonLabel style={{ "--color": "var(--ion-text-color-step-150)" }}>{item.title}</IonLabel>
										</IonItem>
									</IonMenuToggle>
								)
							})
						}
					</IonItemGroup>
					<IonItemGroup>
						<IonItemDivider style={{ minHeight: "0.5px" }} color="primary"> </IonItemDivider>
						<IonItem button>
							<IonIcon style={{ color: "orange" }} icon={logoBitcoin} slot="start" />
							<IonLabel>Buy Bitcoin</IonLabel>
						</IonItem>
						<IonItem href="https://docs.shock.network/" target="_blank" button>
							<IonIcon color="success" icon={helpCircleOutline} slot="start" />
							<IonLabel>Help/About</IonLabel>
						</IonItem>
						<IonItem button onClick={exportDebugReport}>
							<IonIcon slot="start" icon={bugOutline} />
							<IonLabel>Export debug log</IonLabel>
						</IonItem>


						<IonItem>

						</IonItem>

					</IonItemGroup>
				</IonList>
				<div
					style={{
						position: "absolute",
						bottom: "5px",
						transform: "translateX(50%)",
						color: "var(--ion-text-color-step-700)",
						fontSize: "0.8rem"
					}}>
					{
						(appInfo !== null) &&
						Object.entries(appInfo).map(([key, value]) => (
							<div key={key}>
								<span>{key}:&nbsp;</span><span>{value}</span>
							</div>
						))
					}
				</div>
			</IonContent>
		</IonMenu>
	)
}

export default NavigationMenu;
