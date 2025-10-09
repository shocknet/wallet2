import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonInput,
	IonButton,
	useIonRouter,
	IonButtons,
	IonBackButton,
	IonText,
	IonGrid,
	IonRow,
	IonCol,
	useIonModal,
	IonIcon,
	useIonLoading,
} from "@ionic/react";
import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { getPublicKey, nip19 } from "nostr-tools";
import { generateNewKeyPair } from "@/Api/helpers";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { utils } from "nostr-tools";
import { IdentityKeys, IdentityType } from "@/State/identitiesRegistry/types";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { useAppDispatch } from "@/State/store/hooks";
import { useToast } from "@/lib/contexts/useToast";
import { RouteComponentProps } from "react-router";
import { chevronBackOutline, cloudUploadOutline, keyOutline } from "ionicons/icons";
import { BackupKeysDialog, DecryptFileDialog, DownloadFileBackupDialog } from "@/Components/Modals/DialogeModals";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { downloadNsecBackup, importBackupFileText } from "@/lib/file-backup";
import { getSourcesFromLegacyFileBackup, SourceToMigrate } from "@/State/identitiesRegistry/helpers/migrateToIdentities";
import { setPrivateKey } from "@/State/Slices/nostrPrivateKey";

const defaultRelay = utils.normalizeURL("wss://relay.lightning.pub");

const CreateKeysIdentityPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const [generatedPrivKey, setGeneratedPrivKey] = useState("");

	const [presentKeysBackup, dismissKeysBackup] = useIonModal(
		<BackupKeysDialog dismiss={(data: undefined, role: "cancel" | "file" | "confirm") => dismissKeysBackup(data, role)} privKey={generatedPrivKey} />
	);
	const [presentFileBackup, dismissFileBackup] = useIonModal(
		<DownloadFileBackupDialog
			dismiss={(data: { passphrase: string } | null, role: "cancel" | "confirm") => dismissFileBackup(data, role)}
		/>
	);

	const [presentDecryptFile, dismissDecryptFile] = useIonModal(
		<DecryptFileDialog
			dismiss={(data: { passphrase: string } | null, role: "cancel" | "confirm") => dismissDecryptFile(data, role)}
		/>
	);

	const [presentLoading, dismissLoading] = useIonLoading();



	const [_privkey, setPrivkey] = useState("");


	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const router = useIonRouter();

	const fileInputRef = useRef<HTMLInputElement>(null);




	const parsedPriv = useMemo(() => {
		try {
			if (!_privkey) return null;
			if (_privkey.startsWith("nsec")) {
				const result = nip19.decode(_privkey);
				return result.type === "nsec" ? bytesToHex(result.data) : null;
			}
			return _privkey.match(/^[0-9a-f]{64}$/i) ? _privkey : null;
		} catch { return null; }
	}, [_privkey]);








	const handleImportedNsec = async () => {
		if (!parsedPriv) return;
		addSource(parsedPriv);

	}

	const addSource = useCallback(async (privateKey: string, sources?: SourceToMigrate[]) => {

		let pubkey;
		try {
			pubkey = getPublicKey(hexToBytes(privateKey))
		} catch {
			throw new Error("Invalid Nostr private key")
		}


		const identity: IdentityKeys = {
			type: IdentityType.LOCAL_KEY,
			privkey: privateKey,
			pubkey: pubkey,
			relays: [defaultRelay],
			label: "New Sanctum Identity",
			createdAt: Date.now()
		}

		await presentLoading({
			message: "Creating identity...",
		});

		try {
			const { foundBackup } = await dispatch(createIdentity(identity, sources));
			await dismissLoading();


			dispatch(setPrivateKey());
			if (foundBackup) {
				router.push("/sources", "root", "replace");

			} else {
				router.push("/identity/bootstrap", "root", "replace");
			}
		} catch (err: any) {
			await dismissLoading();
			showToast({
				color: "warning",
				message: err?.message || "An error occured when creating the identity"
			})
			return;
		}





	}, [dispatch, router, showToast, presentLoading, dismissLoading]);


	const handleBackupFileDownload = useCallback(async (passphrase: string, privateKey: string) => {
		try {
			await downloadNsecBackup(privateKey, passphrase);
		} catch {
			showToast({
				color: "danger",
				message: "File backup download failed"
			});
			return;
		}

		addSource(privateKey);
	}, [addSource, showToast]);

	const handleGenerateKeys = useCallback(async () => {
		const { privateKey } = generateNewKeyPair();
		setGeneratedPrivKey(privateKey);
		presentKeysBackup({
			onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => {
				if (event.detail.role === "cancel") return;
				if (event.detail.role === "file") {
					presentFileBackup({
						onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => {
							if (event.detail.role === "cancel") return;
							if (event.detail.role === "confirm") {
								handleBackupFileDownload(event.detail.data.passphrase, privateKey);

							}
						},
						cssClass: "dialog-modal wallet-modal"
					})
					return;
				}

				if (event.detail.role === "confirm") {
					addSource(privateKey);
				}

			},
			cssClass: "dialog-modal wallet-modal"
		});
	}, [addSource, handleBackupFileDownload, presentFileBackup, presentKeysBackup])


	const readImportedBackupFile = useCallback(async (fileText: string, passphrase: string) => {
		try {
			const res = await importBackupFileText(fileText, passphrase);
			if (res.kind === "nsec") {
				await addSource(res.nsec)
			} else {
				const sources = getSourcesFromLegacyFileBackup(res.parsed);
				const { privateKey } = generateNewKeyPair();
				await addSource(privateKey, sources);
			}
		} catch (err: any) {
			console.error(err)
			showToast({
				color: "danger",
				message: err?.message || "An unknown error occured when importing the file backup."
			});
		}


	}, [addSource, showToast]);


	const getDatafromBackup = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
		const file: File | undefined = e.target.files?.[0];
		if (file) {
			let fileText;
			try {
				fileText = await file.text();
			} catch {
				showToast({
					color: "danger",
					message: "An error occured when reading the file"
				})
				e.target.value = "";
				return;
			}

			if (fileText) {
				presentDecryptFile({
					onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => {
						if (event.detail.role === "cancel") {
							e.target.value = "";
							return;
						}

						if (event.detail.role === "confirm") {
							readImportedBackupFile(fileText, event.detail.data.passphrase);
						}
					},
					cssClass: "dialog-modal wallet-modal"
				})
			}

		}
		e.target.value = "";
	}, [presentDecryptFile, readImportedBackupFile, showToast]);



	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton icon={chevronBackOutline} defaultHref="/identity/create"></IonBackButton>
					</IonButtons>
					<IonTitle>
						<IonText className="wallet-title-text">
							Nostr Keys
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonGrid
					style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}
				>
					<IonRow style={{ flex: 0.3, minHeight: 0 }} />
					<IonRow className="ion-justify-content-center">
						<IonCol size="auto">
							<IonIcon icon={keyOutline} style={{ fontSize: "6rem", color: "var(--ion-text-color-step-200)" }} />
						</IonCol>

					</IonRow>
					<IonRow className="ion-align-items-center ion-justify-content-center" style={{ marginTop: "4rem" }}>
						<IonCol size="12">
							<IonRow style={{ gap: "8px" }}>
								<IonCol size="8" offset="2">
									<IonInput
										placeholder="Input a Nostr nsec or backup file"
										fill="solid"
										className="filled-input"
										autocomplete="current-password"
										id="shockwallet-nsec-p-m"
										type="password"
										label="Nostr secret"
										labelPlacement="stacked"
										value={_privkey}
										onIonInput={(e) => setPrivkey(e.detail.value || "")}
									></IonInput>
								</IonCol>
								<IonCol size="auto">
									<input type='file' ref={fileInputRef} onChange={(e) => { getDatafromBackup(e) }} style={{ display: "none" }} />
									<IonButton onClick={() => fileInputRef.current?.click()} fill="clear" size="large" className="ion-float-right">
										<IonIcon icon={cloudUploadOutline} slot="icon-only" />
									</IonButton>
								</IonCol>
							</IonRow>

						</IonCol>


					</IonRow>
					<IonRow
						className="ion-justify-content-center ion-margin-top"
					>
						<IonCol size="auto">
							<IonButton onClick={handleImportedNsec} disabled={!parsedPriv}>Continue</IonButton>
						</IonCol>
					</IonRow>
					<IonRow
						className="ion-justify-content-center"
						style={{ marginTop: "4rem", marginBottom: "5rem" }}>
						<IonCol size="auto" >
							<IonText className="text-low text-lg text-weight-high">
								or
							</IonText>
						</IonCol>
					</IonRow>
					<IonRow

					>
						<IonCol size="8" offset="2">
							<IonButton
								className="pill-button"
								expand="full"
								size="large"
								shape="round"
								onClick={handleGenerateKeys}
							>
								Generate Keys
							</IonButton>
						</IonCol>
					</IonRow>

					<IonRow
						className="ion-justify-content-center"
						style={{ marginTop: "3rem" }}
					>
						<IonCol size="auto" >
							<div className="ion-text-wrap ion-text-center text-lg text-x-low">
								You will be prompted to save your key to your password manager, or download a file backup.
							</div>
						</IonCol>
					</IonRow>

				</IonGrid>
				<IonRow style={{ flex: 0.5, minHeight: 0 }} />
			</IonContent>
		</IonPage>
	);
}

export default CreateKeysIdentityPage;
