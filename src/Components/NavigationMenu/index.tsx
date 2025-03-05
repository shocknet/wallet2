import { IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonMenu, IonMenuToggle, IonTitle, IonToolbar } from "@ionic/react"
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
	logoBitcoin
} from "ionicons/icons"
const menuItems = [
	{ title: "Automation", icon: calendarNumberOutline, path: "/automation" },
	{ title: "Contacts", icon: peopleOutline, path: "/contacts" },
	{ title: "Linked Apps", icon: starOutline, path: "/lapps" },
	{ title: "Offer Codes", icon: pricetagOutline, path: "/offers" },
	{ title: "Preferences", icon: settingsOutline, path: "/prefs" },
	{ title: "Manage Sources", icon: flashOutline, path: "/sources" },
	{ title: "Node Invitations", icon: personAddOutline, path: "/invitations" },
	{ title: "Auth", icon: keyOutline, path: "/auth" },
]

const NavigationMenu = () => {
	return (
		<IonMenu type="push" contentId="main-content" side="end">
			<IonHeader>
				<IonToolbar color="secondary">
					<IonTitle color="light" className="ion-text-center">Shockwallet</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList lines="none">
					<IonItemGroup>
						{
							menuItems.map((item, index) => {
								return (
									<IonMenuToggle key={index} autoHide={false}>
										<IonItem routerLink={item.path} routerDirection="none">
											<IonIcon color="primary" icon={item.icon} slot="start" />
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

					</IonItemGroup>
				</IonList>
			</IonContent>
		</IonMenu>
	)
}

export default NavigationMenu;