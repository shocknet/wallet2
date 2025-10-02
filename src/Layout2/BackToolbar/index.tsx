import { IonBackButton, IonButtons, IonMenuButton, IonTitle, IonToolbar } from '@ionic/react';
import { chevronBack } from 'ionicons/icons';

interface BackHeaderProps {
	title?: string;
}

const BackToolbar: React.FC<BackHeaderProps> = ({ title }: BackHeaderProps) => {

	return (

		<IonToolbar>
			<IonButtons slot="start">
				<IonButtons slot="start">
					<IonBackButton text="Back" icon={chevronBack}></IonBackButton>
				</IonButtons>
			</IonButtons>
			{title && <IonTitle className="android-centered-title">{title}</IonTitle>}
			<IonButtons slot="end">
				<IonMenuButton color="primary"></IonMenuButton>
			</IonButtons>
		</IonToolbar>
	);
};

export default BackToolbar;
