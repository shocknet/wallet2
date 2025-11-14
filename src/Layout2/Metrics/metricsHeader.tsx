
import { IonButton, IonButtons, IonHeader, IonImg, IonTitle, IonToolbar } from '@ionic/react';
import logo from "@/Assets/Images/bootstrap_source.jpg";


const MetricsHeader = ({ children }: { children?: React.ReactNode }) => {

	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" routerLink="/home" routerDirection="back">
						<IonImg
							slot="start"
							src={logo}
							className="w-16 h-auto"
						/>
					</IonButton>
				</IonButtons>
				<IonTitle className="android-centered-title">Metrics</IonTitle>
			</IonToolbar>
			{children}
		</IonHeader>
	);
};

export default MetricsHeader;
