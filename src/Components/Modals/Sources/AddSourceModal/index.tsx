import {
	IonModal,
	IonNav,
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
	IonNavLink,
	IonBackButton,
	IonListHeader,
} from "@ionic/react";
import { closeOutline, addOutline } from "ionicons/icons";
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


const AddSourceNavModal = memo(({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) => {
	return (
		<IonModal className="wallet-modal" isOpen={open} onDidDismiss={onClose}>
			<IonNav
				root={() =>
					<AddSourceStart
						onClose={onClose}
					/>
				}
			/>
		</IonModal>
	);
});

AddSourceNavModal.displayName = "AddSourceNavModal";
export default AddSourceNavModal;


const AddSourceStart = ({
	onClose,
}: {
	onClose: () => void;
}) => {
	const [input, setInput] = useState("");

	const [isTouched, setIsTouched] = useState(false);

	const inputRef = useRef<HTMLIonInputElement>(null);
	const [inputState, setInputState] = useState<InputState>({
		status: "idle",
		inputValue: ""
	});

	const debouncedInput = useDebounce(input, 800);
	const { showToast } = useToast();




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
						Paste an <strong className="text-medium">nprofile</strong> or a <strong className="text-medium">Lightning Address</strong>. We’ll do the rest.
					</IonText>
				</div>

				<IonInput
					color="primary"
					placeholder="nprofile1...  •  name@domain.com"
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
				/>
				<div style={{ display: "flex", alignItems: "center", marginTop: 10, gap: 10 }}>
					<RecipentInputHelperText inputState={inputState} />
				</div>




				<div style={{ display: parsedNprofile ? "block" : "none", marginTop: "3rem" }}>
					<IonNavLink
						routerDirection="forward"
						component={() => <AddNprofileScreen onClose={onClose} parsedNprofileData={parsedNprofile as ParsedNprofileInput} />
						}
					>
						<IonButton expand="block" color="primary" disabled={inputState.status !== "parsedOk"}>

							Continue
						</IonButton>
					</IonNavLink>
				</div>

				<div style={{ display: parsedLnAddress ? "block" : "none", marginTop: "3rem" }}>
					<IonNavLink
						routerDirection="forward"
						component={() => <AddLnAddress onClose={onClose} parsedLnAddress={parsedLnAddress as ParsedLightningAddressInput} />
						}
					>
						<IonButton expand="block" color="primary" disabled={inputState.status !== "parsedOk"}>

							Continue
						</IonButton>
					</IonNavLink>
				</div>

			</IonContent >
		</>
	);
}

// ------------- Screen 2a: nprofile -------------
const AddNprofileScreen = ({
	parsedNprofileData,
	onClose,

}: {
	parsedNprofileData: ParsedNprofileInput
	onClose: () => void;

}) => {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();

	const [label, setLabel] = useState("");
	const [bridgeUrl, setBridgeUrl] = useState("");
	const [relays, setRelays] = useState<string[]>(parsedNprofileData.relays);

	const [isEditingRelays, setIsEditingRelays] = useState(false);


	const canAdd = relays.length !== 0;

	const handleAddNProfileSource = useCallback(() => {
		try {

			dispatch(addNprofileSource({
				lpk: parsedNprofileData.pubkey,
				relays,
				adminToken: null,
				bridgeUrl: bridgeUrl || null,
				label: label || null
			}))
			onClose();
		} catch (err: any) {
			showToast({
				message: err?.message || "Failed to add lightning address source"
			});
		}
	}, [showToast, dispatch, parsedNprofileData, relays, bridgeUrl, label, onClose]);

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


const AddLnAddress = ({

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


