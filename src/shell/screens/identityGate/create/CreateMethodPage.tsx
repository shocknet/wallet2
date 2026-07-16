import {
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonNavLink,
	IonText,
	IonToolbar,
	useIonRouter,
} from "@ionic/react";
import { cloudOutline, keyOutline } from "ionicons/icons";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import { useAppSelector } from "@/State/store/hooks";
import { identitiesSelectors, selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { IdentitiesListPage } from "../IdentitiesListPage";
import { CreateKeysPage } from "./CreateKeysPage";
import { CreateSanctumPage } from "./CreateSanctumPage";

export function CreateMethodPage() {
	const router = useIonRouter();
	const identitiesCount = useAppSelector(identitiesSelectors.selectTotal);
	const activeIdentityId = useAppSelector(selectActiveIdentity)?.pubkey ?? null;
	// ReadyApp mounts this under /profile/create while a session is active
	const fromReadyApp = !!activeIdentityId;
	const canGoToIdentities = !fromReadyApp && identitiesCount > 0;

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					{fromReadyApp ? (
						<IonButtons slot="start">
							<IonButton
								fill="clear"
								color="light"
								onClick={() =>
									router.push("/home", "back", "pop")
								}
							>
								Cancel
							</IonButton>
						</IonButtons>
					) : canGoToIdentities ? (
						<IonButtons slot="end">
							<IonNavLink
								routerDirection="root"
								component={() => <IdentitiesListPage />}
							>
								<IonButton fill="clear" color="light">
									My profiles
								</IonButton>
							</IonNavLink>
						</IonButtons>
					) : null}
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="min-h-full flex flex-col justify-center items-center">
					<ShockwalletHero size="lg" tagline="Set up your profile" />
					<IonCard className="w-full max-w-md rounded-xl mt-7">
						<IonCardHeader>
							<IonCardTitle>
								<div className="text-lg  font-medium leading-snug tracking-wide text-primary">
									Select a method for device sync, backups and user settings
								</div>
							</IonCardTitle>
						</IonCardHeader>

						<IonCardContent>
							<IonList className="round" lines="none">
								<IonNavLink
									routerDirection="forward"
									component={() => <CreateSanctumPage />}
								>
									<IonItem detail button>
										<IonIcon
											slot="start"
											icon={cloudOutline}
											size="large"
											className="text-secondary"
										/>
										<IonLabel>
											<h2 className="text-base font-medium leading-snug text-primary">
												Log-In or Sign-Up with Email
											</h2>
											<IonText className="block text-sm leading-snug text-muted">
												Use the Nostr network via a cloud based policy engine.
											</IonText>
										</IonLabel>
									</IonItem>
								</IonNavLink>

								<IonNavLink
									routerDirection="forward"
									component={() => <CreateKeysPage />}
								>
									<IonItem detail button>
										<IonIcon
											slot="start"
											icon={keyOutline}
											size="large"
											className="text-secondary"
										/>
										<IonLabel>
											<h2 className="text-base font-medium leading-snug text-primary">
												Nostr Keys
											</h2>
											<IonText className="block text-sm leading-snug text-muted">
												Use your existing Nostr key or generate a new one.
											</IonText>
											<IonText className="block text-sm leading-snug text-muted mt-2">
												Includes a file based backup and NIP-07 extensions.
											</IonText>
										</IonLabel>
									</IonItem>
								</IonNavLink>
							</IonList>
						</IonCardContent>
					</IonCard>
				</div>
			</IonContent>
			<IonFooter className="ion-no-border">
				<DisclaimerFooter />
			</IonFooter>
		</>
	);
}
