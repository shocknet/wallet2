import { ChooseMethod } from "@/Components/common/identityCreate/ChooseMethod";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import StackPageToolbar from "@/Layout2/StackPageToolbar";
import {
	IonContent,
	IonFooter,
	IonHeader,
	IonNav,
	IonPage,
} from "@ionic/react";

function AddIdentityMethodRoot() {
	return (
		<>
			<IonHeader className="ion-no-border">
				<StackPageToolbar title="Add New Profile" />
			</IonHeader>
			<IonContent className="ion-padding">
				<ChooseMethod tagline="Add a new profile" />
			</IonContent>
			<IonFooter className="ion-no-border">
				<DisclaimerFooter />
			</IonFooter>
		</>
	);
}

function AddNewIdentity() {
	return (
		<IonPage className="ion-page-width">
			<IonNav root={() => <AddIdentityMethodRoot />} />
		</IonPage>
	);
}

export default AddNewIdentity;
