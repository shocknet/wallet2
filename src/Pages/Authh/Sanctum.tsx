import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent

} from "@ionic/react";
import { SANCTUM_URL } from "../../constants";
import { useSelector } from '../../State/store/store';
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";
import SanctumBox from '../../Components/SanctumBox';
import { useAppDispatch } from '@/State/store/hooks';









export default function SanctumIdentity() {


	const dispatch = useAppDispatch()

	const backupStates = useSelector(state => state.backupStateSlice);


	const onsSubmit = async (accessToken: string, identifer: string) => {
		/* 		const sanctum = await getSanctum({ accessToken })
				if (!sanctum) {
					console.error("no sanctum");
					return;
				}
				const pubkey = await sanctum.getPublicKey()
				//dispatch(identitiesRegistryActions.createSanctumIdentity({ label: identifer || "Sanctum", accessToken, pubkey }));
				dispatch(identitySwitchRequested({ pubkey: pubkey })); */
	}

	return (

		<IonPage className="ion-page-width">
			<IonHeader>
				<IonToolbar>
					<IonTitle>Sanctum</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<SanctumBox
					loggedIn={backupStates.subbedToBackUp}
					successCallback={(creds) => {
						onsSubmit(creds.accessToken, creds.identifier)
					}}
					errorCallback={(reason) => toast.error(<Toast title="Sanctum Error" message={reason} />)}
					sanctumUrl={SANCTUM_URL}
				/>
			</IonContent>
		</IonPage>

	)
}


