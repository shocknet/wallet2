import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonFooter, IonGrid, IonIcon, IonImg, IonItem, IonLabel, IonList, IonPage, IonRow, IonToolbar, isPlatform, useIonRouter } from "@ionic/react";
import { NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from "../../constants";
import { useDispatch, useSelector } from "../../State/store/store";
import { addPaySources } from "../../State/Slices/paySourcesSlice";
import { addSpendSources } from "../../State/Slices/spendSourcesSlice";
import { generateNewKeyPair } from "../../Api/helpers";
import { nip19 } from "nostr-tools";
import { SourceTrustLevel } from "../../globalTypes";
import styles from "./styles/index.module.scss";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";
import OutlinedButton from "@/Components/Buttons/GradientButton/OutlinedButton";
import classNames from "classnames";
import { cloudOutline, extensionPuzzleOutline, keyOutline } from "ionicons/icons";

const NodeUp = () => {
	const router = useIonRouter();
	const hasNip07 = typeof (window as any).nostr !== "undefined";
	const isNative = isPlatform("ios") || isPlatform("android");




	const dispatch = useDispatch();
	const paySources = useSelector((state) => state.paySource);
	const spendSources = useSelector((state) => state.spendSource);
	const toMainPage = () => {
		addBootStrapSources();
		setTimeout(() => {
			router.push("/loader")
		}, 100);
	};

	const toSourcePage = () => {
		router.push("/sources")
	};

	const toRecoverPage = () => {
		router.push("/auth")
	}








	const addBootStrapSources = async () => {
		if (Object.values(paySources.sources || {}).length !== 0 && Object.values(spendSources.sources || {}).length !== 0) {
			return;
		} else {
			const keyPair = generateNewKeyPair();
			const id = `${NOSTR_PUB_DESTINATION}-${keyPair.publicKey}`;

			const bootstrapBalance = "0";
			const nprofile = nip19.nprofileEncode({
				pubkey: NOSTR_PUB_DESTINATION,
				relays: NOSTR_RELAYS,
			})


			dispatch(addPaySources({
				source: {
					id: id,
					label: "Bootstrap Node",
					pasteField: nprofile,
					option: SourceTrustLevel.LOW,
					icon: "0",
					pubSource: true,
					keys: keyPair
				}
			}));
			dispatch(addSpendSources({
				source: {
					id: id,
					label: "Bootstrap Node",
					pasteField: nprofile,
					option: SourceTrustLevel.LOW,
					icon: "0",
					balance: bootstrapBalance,
					pubSource: true,
					keys: keyPair
				}
			}));
		}
	}

	return (
		<IonPage className="ion-page-width">
			<IonContent className={`${styles["nodeup-ioncontent"]} ion-padding`}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
					<IonGrid

						style={{


						}}
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
										<IonList className="round secondary" lines="full">
											<IonItem button detail /* onClick={() => history.push("/welcome/sanctum")} */>
												<IonIcon slot="start" icon={cloudOutline} />
												<IonLabel>
													<h2 className="text-high">Sanctum remote-signer (recommended)</h2>
													<p className="text-low">Use a trusted remote service to hold your keys and authorize actions from this app.</p>
												</IonLabel>
											</IonItem>
											<IonItem button detail routerLink="/auth/keys">
												<IonIcon slot="start" icon={keyOutline} />
												<IonLabel>
													<h2 className="text-high">Nostr Kepyair</h2>
													<p className="text-low">Bring in your nostr key pair or generate a new one</p>
												</IonLabel>
											</IonItem>

											{/* Hide NIP-07 on native if you want */}
											{(!isNative && hasNip07) && (
												<IonItem button detail /* onClick={() => history.push("/welcome/nip07")} */>
													<IonIcon slot="start" icon={extensionPuzzleOutline} />
													<IonLabel>
														<h2 className="text-high">NIP-07 Extension</h2>
														<p className="text-low">Use a Nostr-compatible extension to manage your identity on this browser.</p>
													</IonLabel>
												</IonItem>
											)}


										</IonList>
										{!hasNip07 && !isNative && (
											<div className="ion-padding-top">
												<small>NIP-07 not detected. Install a Nostr extension to enable that option.</small>
											</div>
										)}
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

export default NodeUp;
