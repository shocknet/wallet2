import {
	IonModal,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonIcon,
	IonContent,
	IonList,
	IonItem,
	IonLabel,
	IonInput,
	IonNote,
	IonText,
	IonAccordionGroup,
	IonAccordion,
	IonBackButton,
	IonListHeader,
	useIonLoading,
} from "@ionic/react";
import { closeOutline, addOutline, qrCodeOutline } from "ionicons/icons";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/index.module.scss";
import classNames from "classnames";
import useDebounce from "@/Hooks/useDebounce";
import { InputClassification, ParsedLightningAddressInput, ParsedNprofileInput } from "@/lib/types/parse";
import { useToast } from "@/lib/contexts/useToast";
import { InputState } from "@/Pages/Send/types";
import { RecipentInputHelperText } from "@/lib/jsxHelperts";
import { RelayManager } from "@/Components/RelayManager";
import CardishList from "@/Components/CardishList";
import LnurlInfoDisplay from "@/Components/common/info/lnurlInfoDisplay";
import { useAppDispatch } from "@/State/store/hooks";
import { addLightningAddressSource, addNprofileSource } from "@/State/scoped/backups/sources/thunks";
import { PubSourceStatus } from "../helpers";
import { useQrScanner } from "@/lib/hooks/useQrScanner";


interface AddSourceNavModalProps {
	open: boolean;
	onClose: () => void;
	integrationData?: {
		token: string
		lnAddress: string
	}
	invitationToken?: string;
	receivedInputState: InputState;

}

const AddSourceNavModal = memo(({
	open,
	onClose,
	integrationData,
	invitationToken,
	receivedInputState
}: AddSourceNavModalProps) => {



	return (
		<IonModal className="wallet-modal" isOpen={open} onDidDismiss={onClose}>
			<AddSourceStart
				onClose={onClose}
				integrationData={integrationData}
				invitationToken={invitationToken}
				receivedInputState={receivedInputState}
			/>
		</IonModal>
	);
});

AddSourceNavModal.displayName = "AddSourceNavModal";
export default AddSourceNavModal;


type AddSourceStartProps = Omit<AddSourceNavModalProps, "open">
const AddSourceStart = ({
	onClose,
	integrationData,
	invitationToken,
	receivedInputState,

}: AddSourceStartProps) => {
	const [input, setInput] = useState(receivedInputState.inputValue || "");

	const [isTouched, setIsTouched] = useState(false);

	const inputRef = useRef<HTMLIonInputElement>(null);
	const [inputState, setInputState] = useState<InputState>(receivedInputState);
	const dispatch = useAppDispatch();

	const debouncedInput = useDebounce(input, 800);
	const { showToast } = useToast();


	const { scanSingleBarcode } = useQrScanner();
	const openScan = async () => {
		const instruction = "Scan a Lightning Invoice, Noffer string, Bitcoin Address, Lnurl, or Lightning Address";

		try {
			const scanned = await scanSingleBarcode(instruction);
			setInput(scanned);
		} catch {
			/*  */
		}
	}




	useEffect(() => {
		if (!debouncedInput.trim()) {
			setInputState({ status: "idle", inputValue: "" });
			return;
		}
		import("@/lib/parse")
			.then(({ identifyBitcoinInput, parseBitcoinInput }) => {
				const { classification, value: normalizedInput } = identifyBitcoinInput(
					debouncedInput,
					{
						allowed: [InputClassification.NPROFILE, InputClassification.LN_ADDRESS]
					}
				);
				if (classification === InputClassification.UNKNOWN) {
					setInputState({ status: "error", inputValue: normalizedInput, classification, error: "Unidentified input" });
					return;
				}
				setInputState({
					status: "loading",
					inputValue: normalizedInput,
					classification
				});

				parseBitcoinInput(normalizedInput, classification)
					.then(parsed => {
						setInputState({
							status: "parsedOk",
							inputValue: normalizedInput,
							parsedData: parsed
						});
					})
					.catch((err: any) => {
						setInputState({
							status: "error",
							inputValue: normalizedInput,
							error: err.message,
							classification
						});
					})
			})
			.catch(() => {
				showToast({ message: 'Failed to lazy-load "@/lib/parse"', color: "danger" })
			})

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedInput]);

	const clearRecipientError = () => {
		if (inputRef.current) {
			inputRef.current.classList.remove("ion-invalid")
		}
	}

	const onInputChange = (e: CustomEvent) => {
		setInput(e.detail.value || "");
		setInputState({ status: "idle", inputValue: "" });
		clearRecipientError();
	}



	const parsedNprofile = useMemo(() => (inputState.status === "parsedOk" && inputState.parsedData.type === InputClassification.NPROFILE)
		? inputState.parsedData
		: null,
		[inputState]);

	const parsedLnAddress = useMemo(() => (inputState.status === "parsedOk" && inputState.parsedData.type === InputClassification.LN_ADDRESS)
		? inputState.parsedData
		: null,
		[inputState]);

	const [presentLoading, dismissLoading] = useIonLoading();


	const handleAddNProfileSource = useCallback(async () => {

		if (!parsedNprofile) return;



		try {

			if (parsedNprofile.relays.length === 0) {
				throw new Error("This nprofile has no relays");
			}
			await presentLoading({ message: "Processing Source..." });
			const resultMessage = await dispatch(addNprofileSource({
				lpk: parsedNprofile.pubkey,
				relays: parsedNprofile.relays,
				adminEnrollToken: parsedNprofile.adminEnrollToken,
				bridgeUrl: null,
				label: undefined,
				integrationData,
				inviteToken: invitationToken
			}));

			showToast({
				color: "success",
				message: resultMessage
			});
			await dismissLoading()
			onClose()

		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.message || "Failed to add pub source"
			});
			await dismissLoading();
			onClose()
		}

	}, [
		showToast,
		dispatch,
		parsedNprofile,
		onClose,
		presentLoading,
		dismissLoading,
		integrationData,
		invitationToken
	]);


	const addLnAddressSource = useCallback(() => {
		if (!parsedLnAddress) return;

		try {
			dispatch(addLightningAddressSource({
				lightningAddress: parsedLnAddress.data,
				label: null
			}))
			onClose();
		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.message || "Failed to add lightning address source"
			});
			onClose();
		}
	}, [parsedLnAddress, onClose, dispatch, showToast]);

	const addSource = useCallback(async () => {
		if (parsedNprofile) {
			await handleAddNProfileSource();
		} else if (parsedLnAddress) {
			addLnAddressSource();
		}
	}, [addLnAddressSource, handleAddNProfileSource, parsedNprofile, parsedLnAddress]);


	return (
		<>
			<IonHeader>
				<IonToolbar>

					<IonTitle>
						<span className={classNames("text-medium", styles["modal-header"])}>
							<IonIcon icon={addOutline} />
							Add Source
						</span>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onClose}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="ion-margin-top" style={{ marginBottom: 8 }}>
					<IonText className="text-low">
						Paste an <strong className="text-medium">nprofile</strong>. We’ll do the rest.
					</IonText>
				</div>

				<IonInput
					color="primary"
					placeholder="nprofile1..."
					value={input}
					onIonInput={onInputChange}
					fill="solid"
					mode="md"
					ref={inputRef}
					className={classNames({
						["ion-invalid"]: inputState.status === "error",
						["ion-touched"]: isTouched,
						["ion-margin-top"]: true,
						[styles["source-input"]]: true,
						["filled-input"]: true
					})}
					onIonBlur={() => setIsTouched(true)}
					errorText={inputState.status === "error" ? inputState.error : ""}
				>
					<IonButton size="small" fill="clear" slot="end" aria-label="scan" onClick={openScan}>
						<IonIcon slot="icon-only" icon={qrCodeOutline} />
					</IonButton>
				</IonInput>
				<div style={{ display: "flex", alignItems: "center", marginTop: 10, gap: 10 }}>
					<RecipentInputHelperText inputState={inputState} />
				</div>





				<div style={{ display: (parsedNprofile || parsedLnAddress) ? "block" : "none", marginTop: "3rem" }}>
					<IonButton expand="block" color="primary" onClick={addSource}>
						Save
					</IonButton>



				</div>



			</IonContent >
		</>
	);
}

type AddNprofileScreenProps = Omit<AddSourceNavModalProps, "open" | "receivedInputState"> & { parsedNprofileData: ParsedNprofileInput }
const _AddNprofileScreen = ({
	parsedNprofileData,
	onClose,
	integrationData,
	invitationToken,

}: AddNprofileScreenProps) => {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();

	const [label, setLabel] = useState("");
	const [bridgeUrl, setBridgeUrl] = useState("");
	const [relays, setRelays] = useState<string[]>(parsedNprofileData.relays);

	const [isEditingRelays, setIsEditingRelays] = useState(false);
	const [presentLoading, dismissLoading] = useIonLoading();




	const canAdd = relays.length !== 0;

	const handleAddNProfileSource = useCallback(async () => {
		await presentLoading({ message: "Processing Source..." });

		try {
			const resultMessage = await dispatch(addNprofileSource({
				lpk: parsedNprofileData.pubkey,
				relays,
				adminEnrollToken: parsedNprofileData.adminEnrollToken,
				bridgeUrl: bridgeUrl || null,
				label: label,
				integrationData,
				inviteToken: invitationToken
			}));

			showToast({
				color: "success",
				message: resultMessage
			});
			await dismissLoading()
			onClose()

		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.message || "Failed to add pub source"
			});
			await dismissLoading();
			onClose()
		}

	}, [
		showToast,
		dispatch,
		parsedNprofileData,
		relays,
		bridgeUrl,
		label,
		onClose,
		presentLoading,
		dismissLoading,
		integrationData,
		invitationToken
	]);

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton color="light"></IonBackButton>
					</IonButtons>
					<IonTitle>
						<span className={classNames("text-medium", styles["modal-header"])}>
							<IonIcon icon={addOutline} />
							Add Pub Source
						</span>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton
							type="submit"
							disabled={!canAdd}
							color="primary"
							onClick={handleAddNProfileSource}
							strong
						>
							<IonIcon icon={addOutline} />
							Add
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding wallet-box-shadow">
				<PubSourceStatus pubkey={parsedNprofileData.pubkey} relays={parsedNprofileData.relays} />

				<CardishList listHeader="Source Info" className={classNames(styles["edit-list"], "ion-margin-top")} lines="none">

					<IonItem className={classNames(styles["edit-item-input"], "ion-margin-top")}>

						<IonInput
							placeholder="My savings source"
							color="primary"
							labelPlacement="stacked"
							label="Label"
							value={label}
							onIonChange={(e) => setLabel(e.detail.value ?? "")}
							mode="md"
							fill="outline"
							style={{ "--padding-end": "50px" }}
							className="ion-margin-top"

						/>
					</IonItem>
					<IonItem>
						<IonInput
							color="primary"
							label="Bridge URL"
							labelPlacement="stacked"
							inputmode="url"
							placeholder="https://…"
							value={bridgeUrl}
							onIonChange={(e) => setBridgeUrl(e.detail.value ?? "")}
							mode="md"
							fill="outline"
							className="ion-margin-top"
							style={{ "--padding-end": "50px" }}
						/>
					</IonItem>
				</CardishList>
				<IonNote style={{ display: "block" }} className="ion-margin-horizontal ion-margin-top ion-margin-vertical">
					<IonText className="text-low">
						Bridge URL is used to assign a Lightning Address for this Pub source.
					</IonText>
				</IonNote>
				<div style={{ marginTop: "2rem" }}>
					<IonList

						lines="none"
						style={{ borderRadius: "12px", marginTop: "0.5rem" }}

					>
						<IonListHeader className="text-medium" style={{ fontWeight: "600", fontSize: "1rem" }} lines="full">
							<IonLabel >Relays</IonLabel>
							{
								isEditingRelays
									?
									<IonButton style={{ marginRight: "0.5rem" }} onClick={() => setIsEditingRelays(false)}>
										<IonIcon icon={closeOutline} slot="icon-only" />
									</IonButton>
									:
									<IonButton style={{ marginRight: "0.5rem" }} onClick={() => setIsEditingRelays(true)}>
										Edit
									</IonButton>
							}
						</IonListHeader>
						{
							isEditingRelays
								? (
									<>
										<IonItem>
											<IonLabel color="warning">
												<IonText>
													Your node should be listening on relays you add here
												</IonText>
											</IonLabel>
										</IonItem>
										<RelayManager relays={relays} setRelays={setRelays} />
									</>
								)
								: relays.map(r => (
									<IonItem key={r}>
										<IonText>
											{r}
										</IonText>
									</IonItem>
								))
						}
					</IonList>
				</div>
			</IonContent >
		</>
	);
}


const _AddLnAddress = ({

	parsedLnAddress,
	onClose,
}: {

	parsedLnAddress: ParsedLightningAddressInput;
	onClose: () => void;
}) => {
	const [label, setLabel] = useState("");
	const dispatch = useAppDispatch();
	const { showToast } = useToast()

	const addSource = useCallback(() => {
		try {

			dispatch(addLightningAddressSource({
				lightningAddress: parsedLnAddress.data,
				label: label || null
			}))
			onClose();
		} catch (err: any) {
			showToast({
				message: err?.message || "Failed to add lightning address source"
			});
		}
	}, [label, parsedLnAddress, onClose, dispatch, showToast]);


	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton color="light"></IonBackButton>
					</IonButtons>
					<IonTitle>
						<span className={classNames("text-medium", styles["modal-header"])}>
							<IonIcon icon={addOutline} />
							Add Lightning Address Source
						</span>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton
							type="submit"
							color="primary"
							onClick={addSource}
							strong
						>
							<IonIcon icon={addOutline} />
							Add
						</IonButton>
					</IonButtons>
				</IonToolbar>

			</IonHeader>
			<IonContent className="ion-padding">
				<CardishList listHeader="Source Info" className={classNames(styles["edit-list"], "ion-margin-top")} lines="none">
					<IonItem className={classNames(styles["edit-item-input"], "ion-margin-top")}>
						<IonInput
							placeholder="My savings source"
							color="primary"
							labelPlacement="stacked"
							label="Label"
							value={label}
							onIonChange={(e) => setLabel(e.detail.value ?? "")}
							mode="md"
							fill="outline"
							style={{ "--padding-end": "50px" }}
							className="ion-margin-top"

						/>
					</IonItem>
				</CardishList>
				<IonAccordionGroup style={{ marginTop: "60px" }}>
					<IonAccordion value="lnurl-info">
						<IonItem slot="header" lines="none">
							<IonLabel>
								<IonText className="text-low">
									lightning address info
								</IonText></IonLabel>
						</IonItem>
						<div slot="content">
							<LnurlInfoDisplay lnurlData={parsedLnAddress} inset />
						</div>
					</IonAccordion>
				</IonAccordionGroup>
			</IonContent>
		</>
	);
}


