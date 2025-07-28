import { IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonMenu, IonMenuToggle, IonTitle, IonToolbar, isPlatform } from "@ionic/react"
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
	informationCircle
} from "ionicons/icons"
import { useCallback, useEffect, useState } from "react"
import { AdminSource, getAdminSource } from "../AdminGuard"
import { useSelector } from "../../State/store"
import { App } from "@capacitor/app"
import { useAlert } from "@/lib/contexts/useAlert"
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
	]
	if (adminSource) {
		items.push({ title: "Dashboard", icon: analyticsOutline, path: "/metrics", color: '#c740c7' })
	}
	return items
}

const NavigationMenu = () => {
	const { showAlert } = useAlert();
	const spendSources = useSelector(state => state.spendSource)
	const [adminSource, setAdminSource] = useState<AdminSource | undefined>(undefined)
	useEffect(() => {
		const adminSource = getAdminSource()
		if (adminSource) {
			setAdminSource(adminSource)
			return
		}
		const adminSourceId = spendSources.order.find(p => !!spendSources.sources[p].adminToken)
		if (adminSourceId) {
			console.log("admin source found", adminSourceId)
			setAdminSource({ nprofile: spendSources.sources[adminSourceId].pasteField, keys: spendSources.sources[adminSourceId].keys })
		}
	}, [spendSources])


	const reportAppBuildInfo = useCallback(async () => {
		const appInfo = await App.getInfo();
		showAlert({
			header: "App build version",
			message: `App ID: ${appInfo.id}\n
			Vesrion Code: ${appInfo.build}\n
			Version Name: ${appInfo.version}
			`
		})
	}, [showAlert]);

	return (
		<IonMenu type="overlay" contentId="main-content" side="end">
			<IonHeader>
				<IonToolbar color="secondary">
					<IonTitle color="light" className="ion-text-center">Shockwallet</IonTitle>
				</IonToolbar>
			</IonHeader>
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
											<IonLabel>{item.title}</IonLabel>
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
						{
							isPlatform("hybrid") &&
							<IonItem button onClick={reportAppBuildInfo}>
								<IonIcon color="primary" icon={informationCircle} slot="start" />
								<IonLabel>App Info</IonLabel>
							</IonItem>
						}
					</IonItemGroup>
				</IonList>
			</IonContent>
		</IonMenu>
	)
}

export default NavigationMenu;
