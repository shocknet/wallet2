
import { IonButton, IonButtons, IonHeader, IonIcon, IonLabel, IonMenuButton, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import { chevronBack } from 'ionicons/icons';

interface BackHeaderProps {
	title?: string;
}

const BackHeader: React.FC<BackHeaderProps> = ({ title }: BackHeaderProps) => {

	const router = useIonRouter();



	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton onClick={() => router.goBack()}>
						<IonIcon color='primary' icon={chevronBack} />
						<IonLabel>Back</IonLabel>
					</IonButton>
				</IonButtons>
				<IonButtons slot="end">
					<IonMenuButton color="primary"></IonMenuButton>
				</IonButtons>
				{title && <IonTitle>{title}</IonTitle>}
			</IonToolbar>
		</IonHeader>
	);
};

export default BackHeader;