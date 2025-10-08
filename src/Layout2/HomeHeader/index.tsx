
import { IonButton, IonButtons, IonHeader, IonIcon, IonImg, IonMenuButton, IonToolbar, } from '@ionic/react';
import logo from "@/Assets/Images/isolated logo.png";
/* import { useEffect, useState } from 'react'; */


import { personCircleOutline } from 'ionicons/icons';





const HomeHeader = ({ children }: { children?: React.ReactNode }) => {
	/* 	const router = useIonRouter() */

	/* 	const [logoClickCounter, setLogoClickCounter] = useState(0);
		useEffect(() => {
			let singleClickTimer: NodeJS.Timeout;
			let tripeClickTimer: NodeJS.Timeout;
			if (logoClickCounter === 1) {
				singleClickTimer = setTimeout(() => {
					router.push("/home");
					setLogoClickCounter(0);
				}, 500);
			} else {
				if (logoClickCounter === 3) {
					router.push("/metrics");
				}
				tripeClickTimer = setTimeout(() => {
					setLogoClickCounter(0);
				}, 500);
			}
			return () => {
				clearTimeout(singleClickTimer)
				clearTimeout(tripeClickTimer);
			};
		}, [logoClickCounter, router]); */



	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" routerLink="/home" routerDirection="back">
						<IonImg
							slot="start"
							src={logo}
							style={{ width: "25px", height: "auto" }}
						>
						</IonImg>
					</IonButton>
				</IonButtons>
				<IonButtons slot="end">
					<IonButton shape="round" routerLink="/identities" routerDirection="root" routerOptions={{ unmount: true }}>

						<IonIcon color="light" icon={personCircleOutline} />
					</IonButton>
					<IonMenuButton color="primary"></IonMenuButton>
				</IonButtons>
			</IonToolbar>
			{children}
		</IonHeader>
	);
};

export default HomeHeader;
