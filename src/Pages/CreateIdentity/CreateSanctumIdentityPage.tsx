import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
	useIonRouter,
	IonButtons,
	IonBackButton,
	IonText,

	useIonLoading
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



const CreateSanctumIdentityPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const dispatch = useAppDispatch()
	const { showToast } = useToast();
	const router = useIonRouter();
	const [presentLoading, dismissLoading] = useIonLoading();


	const onSubmit = async (accessToken: string, refreshToken?: string) => {
		try {
			await presentLoading({ message: "Loading identity" });
			const api = await getSanctumIdentityApi({ accessToken });
			const pubkey = await api.getPublicKey();

			const identity: IdentitySanctum = {
				type: IdentityType.SANCTUM,
				accessToken: accessToken,
				refreshToken: refreshToken,
				pubkey: pubkey,
				label: "New Sanctum Identity",
				createdAt: Date.now()
			}
			const { foundBackup } = await dispatch(createIdentity(identity));
			await dismissLoading()

			if (foundBackup) {
				router.push("/sources", "root", "replace");
			} else {
				router.push("/identity/bootstrap", "root", "replace");
			}
		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.message || "An error occured when creating identity"
			});
			return;
		}


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
							onSubmit(creds.accessToken, creds.refreshToken)
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


