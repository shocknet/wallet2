
import { IonButton, IonButtons, IonIcon, IonLabel, IonMenuButton, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import { chevronBack } from 'ionicons/icons';

interface BackHeaderProps {
	title?: string;
}

const BackToolbar: React.FC<BackHeaderProps> = ({ title }: BackHeaderProps) => {

	const router = useIonRouter();



	return (

		<IonToolbar>
			<IonButtons slot="start">
				<IonButton onClick={() => router.goBack()}>
					<IonIcon color='primary' icon={chevronBack} />
					<IonLabel>Back</IonLabel>
				</IonButton>
			</IonButtons>
			{title && <IonTitle className="android-centered-title">{title}</IonTitle>}
			<IonButtons slot="end">
				<IonMenuButton color="primary"></IonMenuButton>
			</IonButtons>
		</IonToolbar>
	);
};

export default BackToolbar;
