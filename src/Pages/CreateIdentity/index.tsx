import {
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonIcon,
	IonImg,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonText,
	IonToolbar,
} from '@ionic/react';

import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";
import { cloudOutline, keyOutline } from 'ionicons/icons';

import { useAppSelector } from '@/State/store/hooks';
import { identitiesSelectors, selectActiveIdentityId } from '@/State/identitiesRegistry/slice';

const CreateIdentityPage = () => {
	const isBoostrapped = useAppSelector(state => state.appState.bootstrapped);

	const activeIdentity = useAppSelector(selectActiveIdentityId);
	const identitiesCount = useAppSelector(identitiesSelectors.selectTotal);

	const canLeave = !!isBoostrapped && !!activeIdentity;
	const canGoToIdentities = identitiesCount > 0;

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					{canLeave && (
						<IonButtons slot="start">
							<IonButton shape="round" routerLink="/home">
								<IonImg
									slot="start"
									src={logo}
									style={{ width: "30px", height: "auto" }}
								/>
							</IonButton>
						</IonButtons>
					)}

					{canGoToIdentities && (
						<IonButtons slot="end">
							<IonButton fill="clear" color="primary" routerLink="/identities">
								My identities
							</IonButton>
						</IonButtons>
					)}
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding ion-content-no-footer">
				<div className="page-outer">
					<div className="page-body">

						<section className="hero-block">
							<div
								style={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									width: "64px",
									height: "64px",
									maxWidth: "80px",
									maxHeight: "80px",
								}}
							>
								<IonImg
									src={logo}
									style={{
										width: "100%",
										height: "auto",
									}}
								/>
							</div>

							<div
								style={{
									marginTop: "1rem",
									maxWidth: "300px",
									width: "100%",
								}}
							>
								<IonImg
									src={shockwalletText}
									style={{
										display: "block",
										width: "100%",
										height: "auto",
										objectFit: "contain",
									}}
								/>
							</div>

							<h1
								className="mt-6 text-base sm:text-lg md:text-xl font-medium leading-tight text-center text-high"
							>
								Set up your identity
							</h1>
						</section>

						<section className="main-block">
							<IonCard
								style={{
									borderRadius: 12,
									backgroundColor: "var(--ion-color-secondary)",
								}}
							>
								<IonCardHeader>
									<IonCardTitle>
										<IonText
											className="text-lg md:text-xl font-medium leading-snug text-high"
										>
											Select a method for device sync, backups and user settings
										</IonText>
									</IonCardTitle>
								</IonCardHeader>

								<IonCardContent>
									<IonList className="round secondary" lines="none">
										<IonItem
											detail
											routerLink="/identity/create/sanctum"
											routerDirection="forward"
										>
											<IonIcon
												slot="start"
												icon={cloudOutline}
												size="large"
												className="text-medium"
											/>
											<IonLabel>
												<h2
													className="text-base font-medium leading-snug text-high"
												>
													Log-In or Sign-Up with Email
												</h2>
												<IonText
													className="block text-sm leading-snug text-low"
												>
													Use the Nostr network via a cloud based policy engine.
												</IonText>
											</IonLabel>
										</IonItem>

										<IonItem
											detail
											routerLink="/identity/create/keys"
											routerDirection="forward"
										>
											<IonIcon
												slot="start"
												icon={keyOutline}
												size="large"
												className="text-medium"
											/>
											<IonLabel>
												<h2
													className="text-base font-medium leading-snug text-high"
												>
													Nostr Keys
												</h2>

												<IonText
													className="block text-sm leading-snug text-low"
												>
													Use your existing Nostr key or generate a new one.
												</IonText>

												<IonText
													className="block text-sm leading-snug text-low mt-2"
												>
													Includes a file based backup and NIP-07 extensions.
												</IonText>
											</IonLabel>
										</IonItem>
									</IonList>
								</IonCardContent>
							</IonCard>
						</section>
						<section className="disclaimer-block text-low pb-2">
							By proceeding you acknowledge that this is bleeding-edge software,
							and agree to the providers{" "}
							<a
								href="https://docs.shock.network/terms/"
								target="_blank"
								rel="noreferrer"
								className="underline text-high"
							>
								terms
							</a>{" "}
							regarding any services herein.
						</section>

					</div>
				</div>

			</IonContent>


		</IonPage>
	);
};

export default CreateIdentityPage;
