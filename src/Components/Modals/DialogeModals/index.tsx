import {
	IonAvatar,
	IonButton,
	IonButtons,
	IonCol,
	IonGrid,
	IonHeader,
	IonIcon,
	IonInput,
	IonLabel,
	IonNote,
	IonRow,
	IonText,
	IonTitle,
	IonToolbar
} from "@ionic/react";
import { checkmark, closeOutline, qrCodeOutline, } from "ionicons/icons";
import styles from "./styles/index.module.scss";
import classNames from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { useAppSelector } from "@/State/store/hooks";
import { selectFavoriteSourceView, selectSourceViews, SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
import { CustomSelect } from "@/Components/CustomSelect";
import { Satoshi } from "@/lib/types/units";
import { formatSatoshi } from "@/lib/units";
import { InputState } from "@/Pages/Send/types";
import useDebounce from "@/Hooks/useDebounce";
import { InputClassification, ParsedNprofileInput } from "@/lib/types/parse";
import cn from "clsx";
import { useQrScanner } from "@/lib/hooks/useQrScanner";




export const BackupKeysDialog = (
	{
		dismiss, privKey
	}: {
		dismiss: (data: undefined, role: "cancel" | "file" | "confirm") => void,
		privKey: string
	}
) => {

	const recoveryInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (recoveryInputRef.current) {
			recoveryInputRef.current.value = privKey;
			const event = new Event('input', { bubbles: true });
			recoveryInputRef.current.dispatchEvent(event);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [privKey])


	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-high text-lg text-weight-high">
							Backup Keys
						</IonText>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss(undefined, "cancel")}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<IonText className="text-medium ion-text-wrap">
					Save this key to your preferred password manager, you may use it to log in and sync across devices, or recover your node connections and settings if you get logged out.
				</IonText>


				<IonGrid style={{ margin: 0 }}>
					<form
						id="backup"
						method="post"
						onSubmit={(e) => e.preventDefault()}
					>
						<label
							htmlFor="pm-username"
							style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}
						>
							Username
						</label>



						<IonRow className="ion-margin-top" style={{ alignItems: "baseline" }}>
							<IonCol style={{ flex: 1 }}>
								<IonInput
									fill="solid"
									className={classNames(styles["password-input"], "filled-input")}
									type="password"
									readonly
									value={privKey}
								/>


								<input
									ref={recoveryInputRef}
									id="shockwallet-nsec-p-m"
									autoComplete="new-password"
									type="password"
									defaultValue=""
									readOnly
									style={{ display: "none" }}
								/>
							</IonCol>
							<IonCol style={{ flex: 0 }}>
								<CopyMorphButton fill="clear" value={privKey} />
							</IonCol>
						</IonRow>
						<IonRow className="ion-justify-content-end">
							<IonCol size="auto">
								<IonButton type="submit" color="secondary">Save</IonButton>
							</IonCol>
						</IonRow>
					</form>


					<IonRow className="ion-justify-content-end" style={{ gap: 12, marginTop: "2rem" }}>
						<IonCol size="auto">
							<IonButton color="secondary" onClick={() => dismiss(undefined, "file")}>
								Download as file
							</IonButton>
						</IonCol>
						<IonCol size="auto">
							<IonButton onClick={() => dismiss(undefined, "confirm")}>
								Done
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>

			</div>
		</>
	);
};

export const DecryptFileDialog = (
	{
		dismiss
	}: {
		dismiss: (data: { passphrase: string } | null, role: "cancel" | "confirm") => void,
	}) => {
	const [passphrase, setPassphrase] = useState("");


	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-high text-lg text-weight-high">
							Decrypt backup file
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<IonText className="text-medium ion-text-wrap">
					Input the passphrase for this backup file
				</IonText>
				<IonGrid>
					<IonRow className="ion-margin-top" style={{ alignItems: "baseline" }}>
						<IonCol style={{ flex: 1 }}>
							<IonInput
								fill="solid"
								id="shockwallet-file-back-passphrase-entry"
								className={classNames(styles["password-input"], "filled-input")}
								type="password"
								name="shockwallet-file-back-passphrase-entry"
								value={passphrase}
								onIonInput={e => setPassphrase(e.detail.value || "")}
							/>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-end" style={{ gap: 12, marginTop: "2rem" }}>
						<IonCol size="auto">
							<IonButton fill="clear" color="medium" onClick={() => dismiss(null, "cancel")}>
								Cancel
							</IonButton>
						</IonCol>
						<IonCol size="auto">
							<IonButton color="primary" disabled={!passphrase} onClick={() => dismiss({ passphrase }, "confirm")}>
								Confrim
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
			</div>
		</>
	);
};


export const DownloadFileBackupDialog = ({ dismiss }: { dismiss: (data: { passphrase: string } | null, role: "cancel" | "confirm") => void }) => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");


	const match = password.length && password === confirmPassword;

	const handleConfirm = () => {
		dismiss({ passphrase: password }, "confirm");
	}


	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-medium text-lg text-weight-high">
							Encrypt File
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<IonText className="text-medium">
					Add an encryption password to your backup file so that no unauthorized software can read it.
				</IonText>
				<IonGrid>
					<IonRow className="ion-margin-top ion-nowrap ion-justify-content-center ion-align-items-center" >
						<IonCol size="5" style={{ marginRight: "0.9rem" }}>
							<IonInput
								fill="solid"
								className={classNames(styles["password-input"], "filled-input")}
								type="password"
								autocomplete="off"
								value={password}
								onIonInput={(e) => setPassword(e.detail.value || "")}

							></IonInput>
						</IonCol>
						<IonCol size="5">
							<IonInput
								fill="solid"
								className={classNames(styles["password-input"], "filled-input")}
								type="password"
								autocomplete="off"
								value={confirmPassword}
								onIonInput={(e) => setConfirmPassword(e.detail.value || "")}
							></IonInput>
						</IonCol>
						<IonCol size="2">
							<IonRow className="ion-justify-content-center">
								<IonCol size="auto">
									{
										match && <IonIcon icon={checkmark} color="success" size="large" />
									}

								</IonCol>
							</IonRow>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-end" style={{ gap: "12px", marginTop: "2rem" }}>
						<IonCol size="auto">
							<IonButton fill="clear" color="medium" onClick={() => dismiss(null, "cancel")}>
								Cancel
							</IonButton>
						</IonCol>
						<IonCol size="auto">
							<IonButton fill="clear" color="primary" disabled={!match} onClick={handleConfirm}>
								Done
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
			</div>
		</>
	);
};



export const SweepLnurlwDialog = ({ dismiss, lnurlwAmount }: { dismiss: (data: { selectedSource: SourceView } | null, role: "cancel" | "confirm") => void, lnurlwAmount: Satoshi }) => {


	const sourceViews = useAppSelector(selectSourceViews);
	const favoriteSourceView = useAppSelector(selectFavoriteSourceView)!;


	const [selectedSource, setSelectedSource] = useState(favoriteSourceView);




	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-medium text-lg text-weight-high">
							Sweep LNURL-W to one of your sources
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<IonText className="text-medium">
					Choose a source to sweep {formatSatoshi(lnurlwAmount)} sats to.
				</IonText>
				<IonGrid>
					<IonRow className="ion-margin-top ion-nowrap ion-justify-content-center ion-align-items-center">
						<IonCol>
							<CustomSelect<SourceView>
								items={sourceViews}
								selectedItem={selectedSource}
								onSelect={setSelectedSource}
								getIndex={(source) => source.sourceId}
								title="Select Source"
								subTitle="Select the source you want to spend from"
								renderItem={(source) => {
									return (
										<>
											<IonAvatar slot="start">
												<img src={`https://robohash.org/${source.sourceId}.png?bgset=bg1`} alt='Avatar' />
											</IonAvatar>
											<IonLabel style={{ width: "100%" }}>
												<h2>{source.label}</h2>
												<IonNote className="ion-text-no-wrap text-low" style={{ display: "block" }}>
													{source.type === SourceType.NPROFILE_SOURCE ? "Lightning.Pub Source" : "Lightning Address Source"}
												</IonNote>
											</IonLabel>
											<IonText slot="end" color="primary">
												{
													source.type === SourceType.NPROFILE_SOURCE
													&&
													`${+(source.balanceSats || 0 as Satoshi).toLocaleString()} sats`
												}

											</IonText>
										</>
									)
								}}
								renderSelected={(source) => (
									<IonText className="text-medium">
										{source?.label || ''}
										<IonNote className="text-low" style={{ display: 'block' }}>
											{
												source.type === SourceType.NPROFILE_SOURCE
												&&
												`${+(source.balanceSats || 0 as Satoshi).toLocaleString()} sats`
											}
										</IonNote>
									</IonText>
								)}
							>
							</CustomSelect>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-end" style={{ gap: "12px", marginTop: "2rem" }}>
						<IonCol size="auto">
							<IonButton color="medium" onClick={() => dismiss(null, "cancel")}>
								Cancel
							</IonButton>
						</IonCol>
						<IonCol size="auto">
							<IonButton color="primary" disabled={!selectedSource} onClick={() => dismiss({ selectedSource }, "confirm")}>
								Sweep
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
			</div>
		</>
	);
};


export const AddConnectionDialog = (
	{
		dismiss
	}: {
		dismiss: (data: { parsedNprofile: ParsedNprofileInput } | null, role: "cancel" | "confirm") => void,
	}
) => {
	const [input, setInput] = useState("");
	const [isTouched, setIsTouched] = useState(false);


	const inputRef = useRef<HTMLIonInputElement>(null);
	const [inputState, setInputState] = useState<InputState>({
		status: "idle",
		inputValue: ""
	});


	const debouncedInput = useDebounce(input, 800);

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
						allowed: [InputClassification.NPROFILE]
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
				//showToast({ message: 'Failed to lazy-load "@/lib/parse"', color: "danger" })
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


	const { scanSingleBarcode } = useQrScanner();
	const openScan = async () => {
		const instruction = "Scan an nprofile string";

		try {
			const input = await scanSingleBarcode(instruction);
			setInput(input);
		} catch {
			/*  */
		}
	}

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-medium text-lg text-weight-high">
							Add Node Connection
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<div className="flex flex-col">
					<IonText className="text-low ion-text-wrap text-base">
						Add an nprofile associated with a Lightning.Pub instance
					</IonText>
					<div>
						<IonInput
							color="primary"
							placeholder="Input a node nprofile to connect"
							fill="solid"
							mode="md"
							value={input}
							onIonInput={onInputChange}
							ref={inputRef}
							className={cn(
								"filled-input ion-margin-top ",
								isTouched && "ion-touched",
								inputState.status === "error" && "ion-invalid"
							)}
							onIonBlur={() => setIsTouched(true)}
							errorText={inputState.status === "error" ? inputState.error : ""}
						>
							<IonButton size="small" fill="clear" slot="end" aria-label="scan" onClick={openScan}>
								<IonIcon slot="icon-only" icon={qrCodeOutline} />
							</IonButton>
						</IonInput>
					</div>
					<div className="flex justify-end gap-2 mt-12">
						<IonButton color="medium" onClick={() => dismiss(null, "cancel")}>
							Cancel
						</IonButton>
						<IonButton color="primary" disabled={!parsedNprofile} onClick={() => dismiss({ parsedNprofile: parsedNprofile! }, "confirm")}>
							Done
						</IonButton>
					</div>
				</div>

			</div>
		</>
	);
};
