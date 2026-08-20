import {
	IonAvatar,
	IonButton,
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
import { qrCodeOutline, } from "ionicons/icons";
import styles from "./styles/index.module.scss";
import classNames from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { selectFavoriteSourceView, selectSourceViews, SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import { CustomSelect } from "@/Components/CustomSelect";
import { Satoshi } from "@/lib/types/units";
import { formatSatoshi } from "@/lib/units";
import { InputState } from "@/Pages/Send/types";
import useDebounce from "@/Hooks/useDebounce";
import { InputClassification, ParsedNprofileInput } from "@/lib/types/parse";
import { parseAs } from "@/lib/parse";
import cn from "clsx";
import { useQrScanner } from "@/Hooks/useQrScanner";






export const SweepLnurlwDialog = ({ dismiss, lnurlwAmount }: { dismiss: (data: { selectedSource: SourceView } | null, role: "cancel" | "confirm") => void, lnurlwAmount: Satoshi }) => {


	const sourceViews = useAppSelector(selectSourceViews);
	const favoriteSourceView = useAppSelector(selectFavoriteSourceView)!;


	const [selectedSource, setSelectedSource] = useState(favoriteSourceView);




	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-secondary text-lg text-weight-high">
							Sweep LNURL-W to one of your sources
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<IonText className="text-secondary">
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
												<IonNote className="ion-text-no-wrap text-muted" style={{ display: "block" }}>
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
									<IonText className="text-secondary">
										{source?.label || ''}
										<IonNote className="text-muted" style={{ display: 'block' }}>
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
		const trimmed = debouncedInput.trim();
		setInputState({
			status: "loading",
			inputValue: trimmed,
			classification: InputClassification.NPROFILE,
		});
		void parseAs(trimmed, InputClassification.NPROFILE)
			.then(parsed => {
				setInputState({
					status: "parsedOk",
					inputValue: parsed.data,
					parsedData: parsed,
				});
			})
			.catch((err: unknown) => {
				setInputState({
					status: "error",
					inputValue: trimmed,
					error: err instanceof Error ? err.message : "Failed to parse input",
					classification: InputClassification.NPROFILE,
				});
			});

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
						<IonText className="text-secondary text-lg text-weight-high">
							Add Node Connection
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<div className={classNames(styles["wrapper"], "ion-padding")}>
				<div className="flex flex-col">
					<IonText className="text-muted ion-text-wrap text-base">
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
