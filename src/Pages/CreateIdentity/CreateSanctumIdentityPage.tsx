import {
	IonPage, IonHeader, IonToolbar, IonContent,
	useIonRouter,
	IonButtons,
	IonBackButton,
	useIonLoading,
	IonFooter,
} from "@ionic/react";
import { useRef } from "react";
import type { TokensData } from "sanctum-sdk";
import { useAppDispatch } from "@/State/store/hooks";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { useToast } from "@/lib/contexts/useToast";
import { RouteComponentProps } from "react-router";
import { chevronBackOutline } from "ionicons/icons";
import { SanctumAuthWidget } from "@/Components/SanctumAuthWidget";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import { useEventCallback } from "@/lib/hooks/useEventCallbck/useEventCallback";



const CreateSanctumIdentityPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const router = useIonRouter();
	const [presentLoading, dismissLoading] = useIonLoading();
	const authHandledRef = useRef(false);

	const onAuthenticated = useEventCallback(
		async (tokensData: TokensData) => {
			if (authHandledRef.current) return;
			authHandledRef.current = true;
			try {
				await presentLoading({ message: "Loading identity" });
				const { foundBackup } = await dispatch(createIdentity({
					type: IdentityType.SANCTUM,
					label: "New Sanctum Identity",
					tokensData,
				}));
				await dismissLoading();

				if (foundBackup) {
					router.push("/sources", "root", "replace");
				} else {
					router.push("/identity/bootstrap", "root", "replace");
				}
			} catch (err: unknown) {
				authHandledRef.current = false;
				const message = err instanceof Error ? err.message : "An error occured when creating identity";
				showToast({ color: "danger", message });
			} finally {
				dismissLoading();
			}
		});

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton text="Back" icon={chevronBackOutline} defaultHref="/identity/create" />
					</IonButtons>
				</IonToolbar>
				<div className="w-[93%] mx-auto flex flex-col justify-center items-center gap-10">
					<ShockwalletHero />
				</div>
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="min-h-full flex flex-col gap-12 justify-center items-center">
					<div className="text-lg font-normal tracking-tight text-center text-secondary">
						Use Sanctum to access your money
					</div>
					<SanctumAuthWidget
						onTokensUpdated={onAuthenticated}
						className="w-full max-w-md"
					/>
				</div>
			</IonContent>
			<IonFooter className="ion-no-border">
				<DisclaimerFooter />
			</IonFooter>
		</IonPage>
	);
};

export default CreateSanctumIdentityPage;
