import {
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonCol,
	IonContent,
	IonFooter,
	IonGrid,
	IonHeader,
	IonIcon,
	IonImg,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonRow,
	IonText,
	IonToolbar,
} from '@ionic/react';
import styles from "./styles/index.module.scss";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";
import { cloudOutline, keyOutline } from 'ionicons/icons';


import { useAppSelector } from '@/State/store/hooks';
import { identitiesSelectors, selectActiveIdentityId } from '@/State/identitiesRegistry/slice';
/* import { Capacitor } from '@capacitor/core'; */


const CreateIdentityPage = () => {
	/* 	const hasNip07 = typeof (window as any).nostr !== "undefined";
		const isNative = Capacitor.isNativePlatform(); */
	const isBoostrapped = useAppSelector(state => state.appState.bootstrapped);

	const activeIdentity = useAppSelector(selectActiveIdentityId);
	const identitiesCount = useAppSelector(identitiesSelectors.selectTotal)

	const canLeave = !!isBoostrapped && !!activeIdentity;

	const canGoToIdentities = identitiesCount > 0




	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					{
						canLeave
						&&
						<IonButtons slot="start">
							<IonButton shape="round" routerLink="/home">
								<IonImg
									slot="start"
									src={logo}
									style={{ width: "30px", height: "auto" }}
								>
								</IonImg>
							</IonButton>
						</IonButtons>


					}
					{
						canGoToIdentities
						&&
						<IonButtons slot="end">
							<IonButton fill="clear" color="primary" routerLink="/identities">
								My identities
							</IonButton>
						</IonButtons>
					}


				</IonToolbar>

			</IonHeader>


			<IonContent className={`${styles["nodeup-ioncontent"]} ion-padding`}>
				<IonGrid
					className="ion-padding-top"

					style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}
				>

					<IonRow style={{ flex: 0.5, minHeight: 0 }} />


					<IonRow className="ion-justify-content-center ion-text-center">
						<IonCol size="2" sizeMd="1">
							<IonImg src={logo} style={{ width: "100%", height: "auto" }} />
						</IonCol>
					</IonRow>

					<IonRow className="ion-justify-content-center ion-text-center ion-margin-top">
						<IonCol size="11" sizeMd="6">
							<IonImg src={shockwalletText} style={{ width: "auto", height: "100%" }} />
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-center ion-text-center" style={{ marginTop: "1.5rem" }}>
						<IonCol size="12">
							<h1 className="text-medium text-lg text-weight-medium">Set up your identity</h1>
						</IonCol>
					</IonRow>



					<IonRow className="ion-justify-content-center" style={{ marginTop: "4rem" }}>
						<IonCol size="12">
							<IonCard color="secondary" style={{ borderRadius: 12 }}>
								<IonCardHeader>
									<IonCardTitle>
										<IonText className="ion-text-wrap text-lg text-high">
											Select a method for device sync, backups and user settings
										</IonText>

									</IonCardTitle>
								</IonCardHeader>
								<IonCardContent>
									<IonList className="round secondary" lines="none">
										<IonItem detail routerLink="/identity/create/sanctum" routerDirection="forward">
											<IonIcon slot="start" className="text-medium" icon={cloudOutline} size="large" />
											<IonLabel>
												<h2 className="text-high text-md">Log-In or Sign-Up with Email</h2>
												<IonText className="text-low text-sm">
													Use the Nostr network via a cloud based policy engine.
												</IonText>
											</IonLabel>
										</IonItem>

										<IonItem detail routerLink="/identity/create/keys" routerDirection="forward">
											<IonIcon slot="start" className="text-medium" icon={keyOutline} size="large" />
											<IonLabel>
												<h2 className="text-high text-md">Nostr Keys</h2>
												<IonText className="text-low text-sm">
													Use your existing Nostr key or generate a new one.

												</IonText>
												<br />
												<IonText className="text-low text-sm">
													Includes a file based backup and NIP-07 extensions.
												</IonText>
											</IonLabel>
										</IonItem>
									</IonList>
								</IonCardContent>
							</IonCard>
						</IonCol>
					</IonRow>

				</IonGrid>
				{/* 	<div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
					<IonGrid
						className="ion-padding-top"
					>
						<IonRow className="ion-justify-content-center ion-text-center">
							<IonCol size="2" sizeMd="1">
								<IonImg
									src={logo}
									style={{ width: "100%", height: "auto" }}
								>
								</IonImg>
							</IonCol>
						</IonRow>
						<IonRow className="ion-justify-content-center ion-text-center ion-margin-top">
							<IonCol size="10" sizeMd="6" >
								<IonImg
									src={shockwalletText}
									style={{ width: "auto", height: "100%" }}
								>
								</IonImg>
							</IonCol>
						</IonRow>
						<IonRow className="ion-justify-content-center ion-text-center" style={{ marginTop: "2rem" }}>
							<IonCol size="12">
								<div className={styles["page-title"]}>Set up your identity</div>
							</IonCol>
						</IonRow>
						<IonRow className="ion-justify-content-center" style={{ marginTop: "4rem" }}>
							<IonCol size="12">
								<IonCard color="secondary">
									<IonCardHeader>
										<IonCardTitle style={{ color: "var(--ion-text-color-step-150)" }}>Choose how to set up your identity</IonCardTitle>
									</IonCardHeader>
									<IonCardContent>
										<IonList className='round secondary' lines="full">
											<IonItem detail routerLink="/identity/create/sanctum" routerDirection="forward">
												<IonIcon slot="start" icon={cloudOutline} />
												<IonLabel>
													<h2 className="text-high">Sanctum remote-signer (recommended)</h2>
													<p className="text-low">Use a trusted remote service to hold your keys and authorize actions from this app.</p>
												</IonLabel>
											</IonItem>
											<IonItem detail routerLink="/identity/create/keys" routerDirection="forward">
												<IonIcon slot="start" icon={keyOutline} />
												<IonLabel>
													<h2 className="text-high">Nostr Kepyair</h2>
													<p className="text-low">Bring in your nostr key pair or generate a new one</p>
												</IonLabel>
											</IonItem>





										</IonList>

									</IonCardContent>
								</IonCard>
							</IonCol>
						</IonRow>
					</IonGrid>

				</div>
 */}

			</IonContent>
			<IonFooter className="ion-no-border">
				<IonToolbar>
					<IonGrid >
						<IonRow className="ion-justify-content-center ion-align-items-center">
							<IonCol size="10">
								<div className={styles["footer"]} >
									By proceeding you acknowledge that this is bleeding-edge software, and agree to the providers <a href="https://docs.shock.network/terms/" target="_blank" rel="noreferrer">terms</a> regarding any services herein.
								</div>
							</IonCol>

						</IonRow>
					</IonGrid>
				</IonToolbar>
			</IonFooter>
		</IonPage>

	)
}

export default CreateIdentityPage;
