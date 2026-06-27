import { IonBackButton, IonButtons, IonMenuButton, IonTitle, IonToolbar } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';

interface BackHeaderProps {
	title?: string;
}

const BackToolbar: React.FC<BackHeaderProps> = ({ title }: BackHeaderProps) => {

	return (

		<IonToolbar>
			<IonButtons slot="start">
				<IonBackButton defaultHref="/home" text="Back" icon={chevronBackOutline}></IonBackButton>
			</IonButtons>
			{title && <IonTitle className="android-centered-title">{title}</IonTitle>}
			<IonButtons slot="end">
				<IonMenuButton color="primary"></IonMenuButton>
			</IonButtons>
		</IonToolbar>
	);
};

export default BackToolbar;
