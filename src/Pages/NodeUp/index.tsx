import { IonButton, IonCol, IonContent, IonFooter, IonGrid, IonImg, IonPage, IonRow, IonToolbar, useIonRouter } from '@ionic/react';
import { NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from "../../constants";
import { useDispatch, useSelector } from "../../State/store";
import { addPaySources } from "../../State/Slices/paySourcesSlice";
import { addSpendSources } from "../../State/Slices/spendSourcesSlice";
import { generateNewKeyPair } from "../../Api/helpers";
import { nip19 } from "nostr-tools";
import { SourceTrustLevel } from "../../globalTypes";
import styles from "./styles/index.module.scss";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";
import OutlinedButton from '@/Components/Buttons/GradientButton/OutlinedButton';
import classNames from 'classnames';

const NodeUp = () => {
	const router = useIonRouter();




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
				<IonGrid
					style={{
						height: "100%",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
					}}
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
							<div className={styles["page-title"]}>Node Up</div>
						</IonCol>
					</IonRow>


					<IonRow className="ion-justify-content-center ion-text-center" style={{ marginTop: "2rem" }}>
						<IonCol size="12">
							<div className={styles["description-text"]}>
								Continue to bootstrap the wallet with a trusted server, you may add a node later.
							</div>
						</IonCol>
					</IonRow>


					<IonRow className="ion-justify-content-center ion-text-center" style={{ marginTop: "2.2rem" }}>
						<IonCol size="12">
							<div className={styles["description-text"]}>
								Add Connection to link a node now, or recover from backup.
							</div>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-center ion-text-center" style={{ marginTop: "3.2rem" }}>
						<IonCol size="auto">
							<OutlinedButton onClick={toMainPage} expand="block" className={styles["main-button"]}>
								<div className={styles["button-text"]} style={{ color: "var(--ion-text-color-step-100)" }}>Continue</div>
							</OutlinedButton>
						</IonCol>
					</IonRow>
					<IonRow className={classNames("ion-justify-content-center ion-align-items-center ion-text-center", styles["option-buttons"])}>
						<IonCol size="auto">
							<IonButton onClick={toSourcePage} fill="clear">
								<div className={styles["button-text"]}>Add Connection</div>
							</IonButton>
						</IonCol>
						<IonCol size="auto" className={styles["button-text"]}>|</IonCol>
						<IonCol size="auto">
							<IonButton onClick={toRecoverPage} fill="clear">
								<div className={styles["button-text"]}>Recover Backup</div>
							</IonButton>
						</IonCol>
					</IonRow>

				</IonGrid>




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
