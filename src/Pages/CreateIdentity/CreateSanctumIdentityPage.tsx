import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
	useIonRouter,
	IonButtons,
	IonBackButton,
	IonText
} from "@ionic/react";
import { SANCTUM_URL } from "../../constants";
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";
import SanctumBox from '../../Components/SanctumBox';
import { useAppDispatch } from '@/State/store/hooks';
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { IdentitySanctum, IdentityType } from "@/State/identitiesRegistry/types";
import { getSanctumIdentityApi } from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { useToast } from "@/lib/contexts/useToast";
import { RouteComponentProps } from "react-router";
import { chevronBackOutline } from "ionicons/icons";
import { setPrivateKey } from "@/State/Slices/nostrPrivateKey";



const CreateSanctumIdentityPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const dispatch = useAppDispatch()
	const { showToast } = useToast();
	const router = useIonRouter();


	const onSubmit = async (accessToken: string) => {
		try {

			const api = await getSanctumIdentityApi({ accessToken });
			const pubkey = await api.getPublicKey();

			const identity: IdentitySanctum = {
				type: IdentityType.SANCTUM,
				accessToken: accessToken,
				pubkey: pubkey,
				label: "New Sanctum Identity",
				createdAt: Date.now()
			}
			await dispatch(createIdentity(identity));
			dispatch(setPrivateKey());
		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.messge || "An error occured when creating identity"
			});
			return;
		}

		router.push("/identity/overview", "root", "replace");
	}

	return (

		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton icon={chevronBackOutline} defaultHref="/identity/create"></IonBackButton>
					</IonButtons>
					<IonTitle>
						<IonText className="wallet-title-text">
							Sanctum
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
					<SanctumBox
						loggedIn={false}
						successCallback={(creds) => {
							onSubmit(creds.accessToken)
						}}
						errorCallback={(reason) => toast.error(<Toast title="Sanctum Error" message={reason} />)}
						sanctumUrl={SANCTUM_URL}
					/>
				</div>

			</IonContent>
		</IonPage>

	)
}

export default CreateSanctumIdentityPage;


