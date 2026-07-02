import { IonButton, IonButtons, IonIcon, IonTitle, IonToolbar } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';

interface BackHeaderProps {
	title?: string;
	backHref?: string;
}

const MetricsSubPageToolbar: React.FC<BackHeaderProps> = ({ title, backHref = "/metrics" }: BackHeaderProps) => {

	return (

		<IonToolbar>
			<IonButtons slot="start">
				<IonButton routerLink={backHref} routerDirection="back">
					<IonIcon icon={chevronBackOutline} />
				</IonButton>
			</IonButtons>
			{title && <IonTitle className="android-centered-title">{title}</IonTitle>}
		</IonToolbar>
	);
};

export default MetricsSubPageToolbar;
