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
	keyOutline,
	helpCircleOutline,
	logoBitcoin,
	analyticsOutline,
	personCircleOutline,
} from "ionicons/icons"
import { useEffect, useState } from "react"
import { App } from "@capacitor/app"
import { type AdminSource, getAdminSource } from "../AdminGuard/helpers"
import { Capacitor } from "@capacitor/core"
import { useAppSelector } from "@/State/store/hooks"
import { selectHealthyNprofileViews } from "@/State/scoped/backups/sources/selectors"
import { nip19 } from "nostr-tools"


interface AppBuildInfo {
	appId: string;
	versionCode: string;
	versionName: string;
}
const getMenuItems = (adminSource: AdminSource | undefined) => {
	const items: { title: string, icon: any, path: string, color?: string }[] = [
		{ title: "Automation", icon: calendarNumberOutline, path: "/automation" },
		{ title: "Contacts", icon: peopleOutline, path: "/contacts" },
		{ title: "Linked Apps", icon: starOutline, path: "/lapps" },
		{ title: "Offer Codes", icon: pricetagOutline, path: "/offers" },
		{ title: "Preferences", icon: settingsOutline, path: "/prefs" },
		{ title: "Manage Sources", icon: flashOutline, path: "/sources" },
		{ title: "Node Invitations", icon: personAddOutline, path: "/invitations" },
		{ title: "Backup and Sync", icon: keyOutline, path: "/auth" },
		{ title: "Identities", icon: personCircleOutline, path: "/identities" },
	]
	if (adminSource) {
		items.push({ title: "Dashboard", icon: analyticsOutline, path: "/metrics", color: '#c740c7' })
	}
	return items
}

const NavigationMenu = () => {
	const [appInfo, setAppInfo] = useState<AppBuildInfo | null>(null)
	const healthyNprofileSourceViews = useAppSelector(selectHealthyNprofileViews);
	const [adminSource, setAdminSource] = useState<AdminSource | undefined>(undefined)
	useEffect(() => {
		const adminSource = getAdminSource()
		if (adminSource) {
			setAdminSource(adminSource)
			return
		}
		const foundAdminSource = healthyNprofileSourceViews.find(p => p.adminToken !== null)
		if (foundAdminSource) {
			console.log("admin source found", foundAdminSource)
			setAdminSource({ nprofile: nip19.nprofileEncode({ pubkey: foundAdminSource.lpk, relays: foundAdminSource.relays }), keys: foundAdminSource.keys })
		}
	}, [healthyNprofileSourceViews])

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
							getMenuItems(adminSource).map((item, index) => {
								return (
									<IonMenuToggle key={index} autoHide={false}>
										<IonItem routerLink={item.path} routerDirection="none">
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
