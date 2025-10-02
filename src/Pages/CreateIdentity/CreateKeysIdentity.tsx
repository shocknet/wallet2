import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
	IonInput, IonList, IonButton, IonNote, IonTextarea, IonToggle,
	useIonRouter,
	IonButtons,
	IonBackButton,
	IonText,
	IonGrid,
	IonRow,
	IonCol,
	useIonAlert,
	useIonModal,
	IonIcon
} from "@ionic/react";
import { useMemo, useState } from "react";
import { getPublicKey, nip19 } from "nostr-tools";
import { generateNewKeyPair } from "@/Api/helpers";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { utils } from "nostr-tools";
import { getLocalKeysIdentityApi } from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { IdentityKeys, IdentityType } from "@/State/identitiesRegistry/types";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { useAppDispatch } from "@/State/store/hooks";
import { useToast } from "@/lib/contexts/useToast";
import { RouteComponentProps } from "react-router";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from "@/constants";
import { arrowBackOutline, chevronBack, chevronBackOutline, cloudUploadOutline } from "ionicons/icons";
import { BackupKeysDialog, DownloadFileBackupDialog } from "@/Components/Modals/DialogeModals";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";


const CreateKeysIdentityPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const [presentKeysBackup, dismissKeysBackup] = useIonModal(BackupKeysDialog, {
		dismiss: (data: undefined, role: "cancel" | "file" | "done") => dismissKeysBackup(data, role),
	});
	const [presentFileBackup, dismissFileBackup] = useIonModal(DownloadFileBackupDialog, {
		dismiss: (data: undefined, role: "cancel" | "done") => dismissFileBackup(data, role),
	});

	const [label, setLabel] = useState("");
	const [_privkey, setPrivkey] = useState("");
	const [_relays, setRelays] = useState<string>("wss://strfry.shock.network");
	const [isImport, setIsImport] = useState(false);
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const router = useIonRouter();

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



	const relays = useMemo(() => {
		try {
			return _relays.split(" ").map(utils.normalizeURL)
		} catch {
			return []
		}
	}, [_relays])

	const canCreate = !!label && (!!parsedPriv || !isImport);

	const handleGenerate = async () => {
		// stub: generate hex privkey
		const { privateKey } = generateNewKeyPair();
		setPrivkey(privateKey);

		if (!label) setLabel("My identity");
	}

	const onSubmit = async () => {
		if (!parsedPriv || relays.length === 0) return;
		try {
			const pubkey = getPublicKey(hexToBytes(parsedPriv))
			await getLocalKeysIdentityApi({ publicKey: pubkey, privateKey: parsedPriv }, ["wss://strfry.shock.network"]);


			const identity: IdentityKeys = {
				type: IdentityType.LOCAL_KEY,
				privkey: parsedPriv,
				pubkey: pubkey,
				relays,
				label: "New Sanctum Identity",
				createdAt: Date.now()
			}
			await dispatch(createIdentity(identity));
			localStorage.setItem(NOSTR_PRIVATE_KEY_STORAGE_KEY, "true");
		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.messge || "An error occured when creating identity"
			});
			return;
		}

		router.push("/identity/overview", "root", "replace");
	}

	const openKeysBackDialog = () => {
		presentKeysBackup({
			onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => {
				console.log("dismissed")
				if (event.detail.role === "cancel") return;
				if (event.detail.role === "file") {
					console.log("file!!")
					presentFileBackup({
						cssClass: "dialog-modal wallet-modal"
					})
				}

			},
			cssClass: "dialog-modal wallet-modal"
		});
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
							Nostr Keys
						</IonText>

					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonGrid
					style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}
				>

					<IonRow style={{ flex: 0.5, minHeight: 0 }} />
					<IonRow className="ion-align-items-center ion-justify-content-center">
						<IonCol size="12">
							<IonRow style={{ gap: "8px" }}>
								<IonCol size="8" offset="2">
									<IonInput
										placeholder="Input a Nostr nsec or backup file"
										fill="outline"
										className="pill-input"
									></IonInput>
								</IonCol>
								<IonCol size="auto">
									<IonButton fill="clear" size="large" className="ion-float-right">
										<IonIcon icon={cloudUploadOutline} slot="icon-only" />
									</IonButton>
								</IonCol>
							</IonRow>

						</IonCol>

					</IonRow>
					<IonRow
						className="ion-justify-content-center"
						style={{ marginTop: "5rem", marginBottom: "5rem" }}>
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
								onClick={openKeysBackDialog}
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
							<IonText className="ion-text-wrap ion-text-center text-md text-low ">
								You will be prompted to save your key to your password manager, or download a file backup.
							</IonText>
						</IonCol>
					</IonRow>

				</IonGrid>
				<IonRow style={{ flex: 0.5, minHeight: 0 }} />
			</IonContent>
		</IonPage>
	);
}

export default CreateKeysIdentityPage;
