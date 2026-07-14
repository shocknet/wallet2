import {
	IonBackButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonToolbar,
	useIonLoading,
} from "@ionic/react";
import { useRef } from "react";
import type { TokensData } from "sanctum-sdk";
import { chevronBackOutline } from "ionicons/icons";
import { SanctumAuthWidget } from "@/Components/SanctumAuthWidget";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import { useEventCallback } from "@/lib/hooks/useEventCallbck/useEventCallback";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { enqueueBootstrapIfNoBackup } from "@/shell/pendingNav";

export function CreateSanctumPage() {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const [presentLoading, dismissLoading] = useIonLoading();
	const authHandledRef = useRef(false);

	const onAuthenticated = useEventCallback(
		async (tokensData: TokensData) => {
			if (authHandledRef.current) return;
			authHandledRef.current = true;
			try {
				await presentLoading({ message: "Creating profile…" });
				const { foundBackup, identityId } = await dispatch(
					createIdentity({
						type: IdentityType.SANCTUM,
						label: "New Sanctum Identity",
						tokensData,
					}),
				);
				dispatch(enqueueBootstrapIfNoBackup({ foundBackup, identityId }));
			} catch (err: unknown) {
				authHandledRef.current = false;
				showToast({
					color: "danger",
					message:
						err instanceof Error
							? err.message
							: "Could not create Sanctum profile",
				});
			} finally {
				await dismissLoading();
			}
		},
	);

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton text="Back" icon={chevronBackOutline} />
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="min-h-full flex flex-col gap-10 justify-center items-center">
					<div className="w-full max-w-md flex flex-col items-center gap-6 pt-2">
						<ShockwalletHero />
						<p className="text-lg font-normal tracking-tight text-center text-secondary">
							Use Sanctum to access your money
						</p>
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
		</>
	);
}
