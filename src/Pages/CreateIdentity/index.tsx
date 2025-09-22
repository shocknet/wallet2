import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonContent, IonFooter, IonGrid, IonIcon, IonImg, IonItem, IonLabel, IonList, IonPage, IonRow, IonToolbar, isPlatform, useIonRouter } from '@ionic/react';

import styles from "./styles/index.module.scss";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";

import { cloudOutline, extensionPuzzleOutline, keyOutline } from 'ionicons/icons';
import { RouteComponentProps } from 'react-router';
import { Capacitor } from '@capacitor/core';


const CreateIdentityPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const hasNip07 = typeof (window as any).nostr !== "undefined";
	const isNative = Capacitor.isNativePlatform();

	return (
		<IonPage className="ion-page-width">
			<IonContent className={`${styles["nodeup-ioncontent"]} ion-padding`}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
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
											<IonItem detail routerLink="/createidentity/sanctum" routerDirection="forward">
												<IonIcon slot="start" icon={cloudOutline} />
												<IonLabel>
													<h2 className="text-high">Sanctum remote-signer (recommended)</h2>
													<p className="text-low">Use a trusted remote service to hold your keys and authorize actions from this app.</p>
												</IonLabel>
											</IonItem>
											<IonItem detail routerLink="/createidentity/keys" routerDirection="forward">
												<IonIcon slot="start" icon={keyOutline} />
												<IonLabel>
													<h2 className="text-high">Nostr Kepyair</h2>
													<p className="text-low">Bring in your nostr key pair or generate a new one</p>
												</IonLabel>
											</IonItem>


											{/* {(!isNative && hasNip07) && (
												<IonItem button detail >
													<IonIcon slot="start" icon={extensionPuzzleOutline} />
													<IonLabel>
														<h2 className="text-high">NIP-07 Extension</h2>
														<p className="text-low">Use a Nostr-compatible extension to manage your identity on this browser.</p>
													</IonLabel>
												</IonItem>
											)} */}


										</IonList>
										{/* {!hasNip07 && !isNative && (
											<div className="ion-padding-top">
												<small>NIP-07 not detected. Install a Nostr extension to enable that option.</small>
											</div>
										)} */}
									</IonCardContent>
								</IonCard>
							</IonCol>
						</IonRow>
					</IonGrid>

				</div>








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
