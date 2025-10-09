import {
	IonPage,
	IonContent,
	IonInput,
	IonButton,
	useIonRouter,
	IonText,
	IonGrid,
	IonRow,
	IonCol,
	IonToolbar,
	IonTitle,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch } from "@/State/store/hooks";
import { useToast } from "@/lib/contexts/useToast";
import useDebounce from "@/Hooks/useDebounce";
import { InputState } from "../Send/types";
import { InputClassification } from "@/lib/types/parse";
import { addBootstrapSource, addNprofileSource } from "@/State/scoped/backups/sources/thunks";
import classNames from "classnames";
import HomeHeader from "@/Layout2/HomeHeader";



const BootstrapSource = () => {
	const router = useIonRouter();
	const { showToast } = useToast();
	const [input, setInput] = useState("");
	const [isTouched, setIsTouched] = useState(false);

	const inputRef = useRef<HTMLIonInputElement>(null);
	const [inputState, setInputState] = useState<InputState>({
		status: "idle",
		inputValue: ""
	});
	const dispatch = useAppDispatch();

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

	const handleAddNProfileSource = useCallback(async () => {

		if (!parsedNprofile) return;



		try {

			if (parsedNprofile.relays.length === 0) {
				throw new Error("This nprofile has no relays");
			}
			const resultMessage = await dispatch(addNprofileSource({
				lpk: parsedNprofile.pubkey,
				relays: parsedNprofile.relays,
				adminEnrollToken: parsedNprofile.adminEnrollToken,
				bridgeUrl: null,
			}));

			showToast({
				color: "success",
				message: resultMessage
			});
			router.push("/sources");


		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.message || "Failed to add pub source"
			});

		}

	}, [
		showToast,
		dispatch,
		parsedNprofile,
		router
	]);

	const handleAddBootstrapSource = useCallback(async () => {
		await dispatch(addBootstrapSource());
		router.push("/sources");
	}, [dispatch, router]);


	return (
		<IonPage className="ion-page-width">
			<HomeHeader>

			</HomeHeader>
			<IonContent className="ion-padding">
				<IonGrid
					style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}
				>

					<IonRow className="ion-justify-content-center" style={{ marginTop: "5rem" }}>
						<IonCol size="auto">
							<div className="text-xl text-medium text-weight-high">
								Node Up
							</div>

						</IonCol>
					</IonRow>
					<IonRow className="ion-align-items-center ion-justify-content-center" style={{ marginTop: "4rem" }}>
						<IonCol size="12">
							<IonRow style={{ gap: "8px" }}>
								<IonCol size="8" offset="2">
									<IonInput
										color="primary"
										placeholder="Input a node nprofile to connect"
										fill="solid"
										mode="md"
										value={input}
										onIonInput={onInputChange}
										ref={inputRef}
										className={classNames({
											["ion-invalid"]: inputState.status === "error",
											["ion-touched"]: isTouched,
											["ion-margin-top"]: true,
											["filled-input"]: true
										})}
										onIonBlur={() => setIsTouched(true)}
										errorText={inputState.status === "error" ? inputState.error : ""}
									></IonInput>
								</IonCol>
							</IonRow>
						</IonCol>
					</IonRow>
					<IonRow
						className="ion-justify-content-center ion-margin-top"
					>
						<IonCol size="auto">
							<IonButton onClick={handleAddNProfileSource} disabled={!parsedNprofile}>Add</IonButton>
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
								onClick={handleAddBootstrapSource}
							>
								Bootstrap
							</IonButton>
						</IonCol>
					</IonRow>
					<IonRow
						className="ion-justify-content-center"
						style={{ marginTop: "3rem" }}
					>
						<IonCol size="auto" >
							<div className="ion-text-wrap ion-text-center text-lg text-x-low  ">
								Build a service credit with a provider and and upgrade to a self-custodial node later.
							</div>
						</IonCol>
					</IonRow>

				</IonGrid>
				<IonRow style={{ flex: 0.5, minHeight: 0 }} />
			</IonContent>
		</IonPage>
	);
}

export default BootstrapSource;
