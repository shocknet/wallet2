import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch, selectEnabledSpends } from '../../State/store';
import {
	IonAvatar,
	IonButton,
	IonCol,
	IonContent,
	IonFooter,
	IonGrid,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonModal,
	IonNote,
	IonPage,
	IonPopover,
	IonRow,
	IonSpinner,
	IonText,
	IonToolbar,
	isPlatform,
	useIonModal,
	useIonViewWillEnter
} from '@ionic/react';
import { defaultMempool } from '../../constants';
import "./styles/index.css";
import useDebounce from '../../Hooks/useDebounce';
import { RouteComponentProps, useLocation } from 'react-router';
import {
	logoBitcoin,
	qrCodeOutline,
	flash,
	informationCircle,
	globeOutline,
	checkmarkCircle,
	helpCircleOutline,
	atCircleOutline,
} from 'ionicons/icons';
import { SpendFrom } from '@/globalTypes';
import { CustomSelect } from '@/Components/CustomSelect';
import { InputState } from './types';
import ScanModal from '@/Components/Modals/ScanModal';
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces';
import { sendPaymentThunk } from '@/State/history/thunks';
import { useToast } from '@/lib/contexts/useToast';
import { InputClassification } from '@/lib/types/parse';
import { identifyBitcoinInput, parseBitcoinInput } from '@/lib/parse';
import { FeeTier, getFeeTiers } from '@/lib/fees';
import { Satoshi } from '@/lib/types/units';
import { parseUserInputToSats } from '@/lib/units';
import { getIconFromClassification } from '@/lib/icons';
import { useAlert } from '@/lib/contexts/useAlert';
import BackToolbar from '@/Layout2/BackToolbar';
import AmountInput from '@/Components/AmountInput';
import { validateAndFormatAmountInput } from '@/lib/format';
import { nip19 } from 'nostr-tools';

const LnurlCard = lazy(() => import("./LnurlCard"));
const InvoiceCard = lazy(() => import("./InvoiceCard"));
const NofferCard = lazy(() => import("./NofferCard"));
const OnChainCard = lazy(() => import("./OnChainCard"));


const Send: React.FC<RouteComponentProps> = ({ history }) => {
	const location = useLocation<{ input: string }>();
	const dispatch = useDispatch();
	const { showAlert } = useAlert();
	const { showToast } = useToast();

	const mempoolUrl = useSelector(({ prefs }) => prefs.mempoolUrl) || defaultMempool;

	// --- Selected Spend Source ---
	const enabledSpendSources = useSelector(selectEnabledSpends);
	const [selectedSource, setSelectedSource] = useState(enabledSpendSources[0]);
	const isPubSource = !!selectedSource?.pubSource;
	// Check whether we have at least one spend source that ALSO has enough balance (maxWithdrawable > 0)
	// Show alert if not
	useIonViewWillEnter(() => {
		setIsMobile(isPlatform("hybrid"));
		resetValues(); // Ionic will not remove the state when navigating again to this page, so we need to reset the values
		if (enabledSpendSources.length === 0) {
			showAlert({
				header: "No Spend Sources",
				message: "You need to add a spend source before sending payments.",
				buttons: [
					{
						text: "Cancel",
						role: "cancel",
						handler: () => {
							history.replace("/");
						}
					},
					{
						text: "Add Source",
						handler: () => {
							history.replace("/sources");
						}
					},

				]
			})
		}
		if (selectedSource && (Number(selectedSource.maxWithdrawable) === 0 || Number(selectedSource.balance) === 0)) {
			const foundOneWithBalance = enabledSpendSources.find(s => Number(s.maxWithdrawable) > 0);
			if (foundOneWithBalance) {
				setSelectedSource(foundOneWithBalance)
			} else {
				showAlert({
					header: "No Spend Source With Enough Balance",
					message: "You need to receive enough sats to send payments.",
					buttons: [
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Receive",
							handler: () => {
								history.replace("/receive");
							}
						}
					]
				})
			}
		}
	}, [enabledSpendSources]);


	// --- Amount input ---
	const [amountInSats, setAmountInSats] = useState<Satoshi | null>(null);
	const [unit, setUnit] = useState<"BTC" | "sats">("sats");
	const [displayValue, setDisplayValue] = useState("");
	const [isFilled, setIsFilled] = useState(false); // Was the amount automatically filled by invoice, fixed noffer, etc
	const [limits, setLimits] = useState<{
		minSats: Satoshi;
		maxSats: Satoshi;
	}>({
		minSats: 1 as Satoshi,
		maxSats: parseUserInputToSats(selectedSource.maxWithdrawable || "0", "sats")
	});
	const [isAmountInputDisabled, setIsAmountInputDisabled] = useState(false);

	// Amount input ref, used to focus the input after a valid recipient is parsed, when applicable
	const satsInputRef = useRef<HTMLIonInputElement>(null);

	const [note, setNote] = useState("");

	const resetValues = useCallback((skipAmount = false) => {
		if (!skipAmount) {
			setAmountInSats(null);
			setDisplayValue("");
		}
		setNote("");
		setIsAmountInputDisabled(false);
	}, [])


	// --- Recipient input ---
	const [recipient, setRecipient] = useState("");
	const debouncedRecepient = useDebounce(recipient, 800);
	const [inputState, setInputState] = useState<InputState>({
		status: "idle",
		inputValue: ""
	});
	const [isTouched, setIsTouched] = useState(false);
	// Recipient input ref, used to enforce removal of error class when input is changed
	const inputRef = useRef<HTMLIonInputElement>(null);

	useEffect(() => {
		resetValues(isFilled); // When the recipient changes, reset the values
		setIsFilled(false); // Reset the isFilled state

		if (!debouncedRecepient.trim()) {
			setInputState({ status: "idle", inputValue: "" });
			return;
		}
		const classification = identifyBitcoinInput(
			debouncedRecepient,
			!selectedSource.pubSource ?
				{ disallowed: [InputClassification.BITCOIN_ADDRESS, InputClassification.NOFFER] }
				:
				undefined
		);

		if (classification === InputClassification.UNKNOWN) {
			setInputState({ status: "error", inputValue: debouncedRecepient, classification, error: "Unidentified recipient" });
			return;
		}
		setInputState({
			status: "loading",
			inputValue: debouncedRecepient,
			classification
		});

		parseBitcoinInput(debouncedRecepient, classification, selectedSource.keys)
			.then(parsed => {
				if (parsed.type === InputClassification.LNURL_WITHDRAW) {
					setInputState({
						error: "Lnurl cannot be a lnurl-withdraw",
						status: "error",
						inputValue: debouncedRecepient,
						classification: parsed.type
					});
					return;
				}

				if (parsed.type === InputClassification.LN_INVOICE) {
					if (!parsed.amount) {
						setInputState({
							error: "Zero value invoices are not supported",
							status: "error",
							inputValue: debouncedRecepient,
							classification: parsed.type
						});
						return;
					}
					// Update amount with the invoice's decoded amount
					const newDisplayValue = validateAndFormatAmountInput(parsed.amount.toString(), "sats");
					setDisplayValue(newDisplayValue);
					setIsFilled(true);
					setIsAmountInputDisabled(true); // Disable the amount input, as it is already filled by the invoice

					// If the invoice has a description, set it as the note
					if (parsed.memo) {
						setNote(parsed.memo);
					}
				}

				// If it's a LNURL or LN address, set the limits
				if (parsed.type === InputClassification.LNURL_PAY || parsed.type === InputClassification.LN_ADDRESS) {
					setLimits({
						minSats: parsed.min,
						maxSats: Math.min(parsed.max, parseUserInputToSats(selectedSource.maxWithdrawable || "0", "sats")) as Satoshi
					})
				}

				// If it's a noffer with no spontaneous price type, set the amount from the invoice
				if (parsed.type === InputClassification.NOFFER) {
					if (parsed.priceType === nip19.OfferPriceType.Fixed || parsed.priceType === nip19.OfferPriceType.Variable) {
						setDisplayValue(parsed.invoiceData.amount.toString());
						setIsFilled(true);
						setIsAmountInputDisabled(true); // Disable the amount input, as it is already filled by noffer
					}
				}


				// When the recipient expects amount input, focus the amount input
				// after the recipient is parsed
				if (
					parsed.type === InputClassification.LNURL_PAY ||
					parsed.type === InputClassification.LN_ADDRESS ||
					(parsed.type === InputClassification.NOFFER && parsed.priceType === nip19.OfferPriceType.Spontaneous) ||
					parsed.type === InputClassification.BITCOIN_ADDRESS
				) {
					satsInputRef.current?.setFocus();
				}


				setInputState({
					status: "parsedOk",
					inputValue: debouncedRecepient,
					parsedData: parsed
				});
			})
			.catch((err: any) => {
				setInputState({
					status: "error",
					inputValue: debouncedRecepient,
					error: err.message,
					classification
				});
			})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedRecepient, selectedSource, resetValues]);

	// Recipient might be passed in location.state
	useEffect(() => {
		const clip = location.state?.input;
		if (!clip) return;
		clearRecipientError();

		setRecipient(clip);

		// replace the current history entry with identical URL but no state.
		// this is because Ionic will not remove the state when navigating again to this page
		history.replace({ pathname: location.pathname, search: location.search, state: null });
	}, [location.state?.input, history, location.pathname, location.search]);

	const clearRecipientError = () => {
		if (inputRef.current) {
			inputRef.current.classList.remove("ion-invalid")
		}
	}

	const onRecipientChange = (e: CustomEvent) => {
		clearRecipientError();
		setRecipient(e.detail.value || "");
	}



	// --- On chain fee tiers ---
	const [feeTiers, setFeeTiers] = useState<FeeTier[]>([]);
	const [selectedFeeTier, setSelectedFeeTier] = useState(1);  // Default to avergae fee rate

	useEffect(() => {
		const fetchFeeTiers = async () => {
			try {
				const tiers = await getFeeTiers(mempoolUrl);

				setFeeTiers(tiers);
			} catch (err) {
				console.error("Failed to fetch fees", mempoolUrl, err);
			}
		};

		fetchFeeTiers();

		const interval = setInterval(fetchFeeTiers, 120000); // Refresh every 2 minutes
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);



	// --- Scanner ---
	const [isMobile, setIsMobile] = useState(false);
	const [presentScanner, dismissScanner] = useIonModal(
		<ScanModal
			onError={(error) => {
				dismissScanner();
				showToast({
					message: error,
					color: "danger",
				})
			}}
			dismiss={() => dismissScanner()}
			onScanned={(input) => {
				setRecipient(input);
				dismissScanner();
			}}
			instructions="Scan a QR code to send a payment some very long text"
			isMobile={isMobile}
		/>
	);

	const openScanModal = () => {
		presentScanner({
			onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
				if (event.detail.role === "confirm") {
					console.log({ dataFromScan: event.detail.data })
				}
			},
			cssClass: !isMobile ? "desktop-scanner-modal" : undefined
		});
	}


	const [popovers, setPopovers] = useState({
		reserve: false,
	})


	// --- Handle Payment ---
	const canPay = useMemo(() =>
		inputState.status === "parsedOk" && amountInSats !== null && amountInSats !== 0 && parseUserInputToSats((selectedSource?.maxWithdrawable || "0"), "sats") > amountInSats
		, [inputState, amountInSats, selectedSource]);

	const handlePayment = useCallback(async () => {
		if (inputState.status !== "parsedOk") {

			return;
		}
		if (amountInSats === null) {

			return;
		}
		if (amountInSats > parseUserInputToSats(selectedSource.maxWithdrawable || "0", "sats")) {
			return;
		}

		try {
			const res = await dispatch(sendPaymentThunk({
				sourceId: selectedSource.id,
				parsedInput: inputState.parsedData,
				amount: amountInSats,
				note,
				satsPerVByte: feeTiers[selectedFeeTier].rate,
				showToast
			})).unwrap();
			if (
				inputState.parsedData.type === InputClassification.NOFFER &&
				inputState.parsedData.priceType === nip19.OfferPriceType.Spontaneous &&
				res?.error
			) {
				setLimits({
					minSats: parseUserInputToSats(res.range.min.toString(), "sats"),
					maxSats: Math.min(parseUserInputToSats(res.range.max.toString(), "sats"), parseUserInputToSats(selectedSource.maxWithdrawable || "0", "sats")) as Satoshi

				})

				showToast({ message: "Noffer range updated, please try to send again now", color: "warning" });
			} else {
				history.replace("/home");
			}
		} catch (err: any) {
			showToast({ message: err?.message || "Payment failed", color: "danger" });
		}

	}, [amountInSats, inputState, selectedSource, dispatch, history, showToast, feeTiers, selectedFeeTier, note]);


	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonHeader className="ion-no-border">
					<BackToolbar title="Send" />
				</IonHeader>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonGrid>
					<IonRow>
						<IonCol size="12">
							<AmountInput
								ref={satsInputRef}
								color="primary"
								style={{
									"--background": "var(--ion-color-secondary)",
								}}
								labelPlacement="stacked"
								amountInSats={amountInSats}
								setAmountInSats={setAmountInSats}
								unit={unit}
								setUnit={setUnit}
								displayValue={displayValue}
								setDisplayValue={setDisplayValue}
								fill="solid"
								limits={limits}
								disabled={isAmountInputDisabled}
							/>
						</IonCol>
					</IonRow>
					<IonRow className="ion-margin-top">
						<IonCol size="12">
							<IonInput
								ref={inputRef}
								className={`
									${inputState.status === "error" && 'ion-invalid'}
									${isTouched && 'ion-touched'}
								`}
								style={{
									"--background": "var(--ion-color-secondary)",
								}}
								label="Recipient"
								labelPlacement="stacked"
								fill="solid"
								color="primary"
								onIonBlur={() => setIsTouched(true)}
								placeholder={
									isPubSource ? "Paste invoice, Noffer string LNURL, Bitcoin address, or Lightning address" : "Paste invoice, LNURL, or Lightning address"
								}
								errorText={inputState.status === "error" ? inputState.error : ""}
								value={recipient}
								onIonInput={onRecipientChange}
							>
								<IonButton size="small" fill="clear" slot="end" aria-label="scan" onClick={openScanModal}>
									<IonIcon slot="icon-only" icon={qrCodeOutline} />
								</IonButton>
								<IonButton fill="clear" size="small" slot="end" aria-label="info" id="recipient-types-info">
									<IonIcon slot="icon-only" icon={informationCircle} />
								</IonButton>
							</IonInput>
						</IonCol>
					</IonRow>

					<IonRow>
						<IonCol size="12">
							<RecipentInputHelperText inputState={inputState} />
						</IonCol>
					</IonRow>


					{/* Different input types cards */}
					{
						inputState.status === "parsedOk" && inputState.parsedData.type === InputClassification.BITCOIN_ADDRESS && (
							<IonRow>
								<IonCol size="12">
									<Suspense fallback={<IonSpinner />}>
										<OnChainCard
											selectedFeeTier={selectedFeeTier}
											setSelectedFeeTier={setSelectedFeeTier}
											feeTiers={feeTiers}
											selectedSource={selectedSource}
										/>
									</Suspense>
								</IonCol>
							</IonRow>
						)
					}
					{
						inputState.status === "parsedOk" && inputState.parsedData.type === InputClassification.LN_INVOICE && (
							<IonRow>
								<IonCol size="12">
									<Suspense fallback={<IonSpinner />}>
										<InvoiceCard invoiceData={inputState.parsedData} note={note} setNote={setNote} selectedSource={selectedSource} />
									</Suspense>
								</IonCol>
							</IonRow>

						)
					}
					{
						(
							inputState.status === "parsedOk"
							&&
							(
								inputState.parsedData.type === InputClassification.LNURL_PAY ||
								inputState.parsedData.type === InputClassification.LN_ADDRESS
							)
							&&
							(
								<IonRow>
									<IonCol size="12">
										{
											<Suspense fallback={<IonSpinner />}>
												<LnurlCard
													lnurlData={inputState.parsedData}
													setNote={setNote}
													note={note}
													selectedSource={selectedSource}
												/>
											</Suspense>
										}
									</IonCol>
								</IonRow>
							)
						)
					}

					{
						(
							inputState.status === "parsedOk"
							&&
							(
								inputState.parsedData.type === InputClassification.NOFFER
							)
							&&
							(
								<IonRow>
									<IonCol size="12">
										<Suspense fallback={<IonSpinner />}>
											<NofferCard
												nofferData={inputState.parsedData}
												setNote={setNote}
												note={note}
											/>
										</Suspense>
									</IonCol>
								</IonRow>
							)
						)
					}
					<IonRow className="ion-margin-top">
						<IonCol size="6">
							<IonText style={{ display: "block", marginBottom: "9px" }}>Spend From</IonText>
							<CustomSelect<SpendFrom>
								items={enabledSpendSources}
								selectedItem={selectedSource}
								onSelect={setSelectedSource}
								getIndex={(source) => source.id}
								title="Select Spend Source"
								subTitle="Select the source you want to spend from"
								renderItem={(source) => {
									return (
										<>
											<IonAvatar slot="start">
												<img src={`https://robohash.org/${source.pasteField}.png?bgset=bg1`} alt='Avatar' />
											</IonAvatar>
											<IonLabel style={{ width: "100%" }}>
												<h2>{source.label}</h2>
												<IonNote color="medium" className="ion-text-no-wrap" style={{ display: "block" }}>
													{source.pubSource
														? "Lightning.Pub Source"
														: "LNURL Withdraw Source"}
												</IonNote>
											</IonLabel>
											<IonText slot="end" color="primary">
												{+(source.balance).toLocaleString()} sats
											</IonText>
										</>
									)
								}}
								renderSelected={(source) => (
									<IonText>
										{source?.label || ''}
										<IonNote color="medium" style={{ display: 'block' }}>
											{(+source?.balance).toLocaleString()} sats
										</IonNote>
									</IonText>
								)}
							>
							</CustomSelect>

						</IonCol>
					</IonRow>
					<IonRow className="ion-align-items-center ion-margin-top">
						<IonCol size="auto" >
							<IonText style={{ fontSize: "0.8rem" }} color="primary">
								<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
									Note: {(+selectedSource?.balance - +(selectedSource?.maxWithdrawable || "0")).toLocaleString()} sats of your balance is held in reserve for network fees.
									<IonButton
										fill="clear"
										shape="round"
										onClick={() => setPopovers({ ...popovers, reserve: true })}
									>
										<IonIcon icon={helpCircleOutline} slot="icon-only" />
									</IonButton>
								</span>
							</IonText>
						</IonCol>
						<IonPopover
							isOpen={popovers.reserve}
							onDidDismiss={() => setPopovers({ ...popovers, reserve: false })}
						>
							<IonContent className="ion-padding">
								<IonText>
									Lightning fees are based on the amount of sats you are
									sending, and so you must have more sats than you send.
									To ensure high success rates and low overall fees, the node
									has defined a fee budget to hold as a fee reserve for sends.
								</IonText>
							</IonContent>
						</IonPopover>


					</IonRow>
				</IonGrid>

				<IonModal
					trigger="recipient-types-info"
					className="dialog-modal"
				>
					<div className="wrapper">
						<IonList inset className="secondary">
							<IonListHeader>
								<IonLabel>What Can You Enter?</IonLabel>
							</IonListHeader>
							<IonItem>
								<IonIcon style={{ color: "orange" }} icon={flash} slot="start"></IonIcon>
								<IonLabel>
									<strong>Lightning Invoice</strong>
									<IonNote>lnbc20m1pvjluezpp5qqqsyq...</IonNote>
								</IonLabel>
							</IonItem>
							<IonItem>
								<IonIcon style={{ color: "orange" }} icon={globeOutline} slot="start"></IonIcon>
								<IonLabel>
									<strong>LNURL</strong>
									<IonNote>LNURL1dp68gurn8ghj7em9w...</IonNote>
								</IonLabel>
							</IonItem>
							<IonItem>
								<IonIcon style={{ color: "orange" }} icon={atCircleOutline} slot="start"></IonIcon>
								<IonLabel>
									<strong>Lightning Address</strong>
									<IonNote>someone@somesite.com</IonNote>
								</IonLabel>
							</IonItem>
							{
								isPubSource && (
									<>
										<IonItem>
											<IonIcon style={{ color: "orange" }} icon={logoBitcoin} slot="start"></IonIcon>
											<IonLabel>
												<strong>Bitcoin address</strong>
												<IonNote>bc1qar0srrr7xfkvy5l643...</IonNote>
											</IonLabel>
										</IonItem>
										<IonItem>
											<IonIcon style={{ color: "orange" }} icon="nostr" slot="start"></IonIcon>
											<IonLabel>
												<strong>Noffer string</strong>
												<IonNote>noffer1qvqsyqjqvgunwc3j...</IonNote>
											</IonLabel>
										</IonItem>
									</>
								)
							}
						</IonList>
					</div>

				</IonModal>
			</IonContent>
			<IonFooter className="ion-no-border">
				<IonToolbar>
					<IonGrid className="ion-no-padding">
						<IonRow className="ion-justify-content-center ion-align-items-center" style={{ gap: "1rem" }}>
							<IonCol size="5" >
								<IonButton color="light" fill="default" expand="block" onClick={() => history.replace("/")}>
									Cancel
								</IonButton>
							</IonCol>
							<IonCol size="5" >
								<IonButton color="primary" fill="solid" expand="block" disabled={!canPay} onClick={handlePayment}>
									Pay
								</IonButton>
							</IonCol>
						</IonRow>
					</IonGrid>


				</IonToolbar>
			</IonFooter>
		</IonPage >
	)
}

// Helper component to show helper text about parsed recipient
const RecipentInputHelperText = ({ inputState }: { inputState: InputState }) => {
	switch (inputState.status) {
		case "idle":
			return <div></div>;
		case "loading": {
			const { icon, color } = getIconFromClassification(inputState.classification);
			return (
				<IonText color="primary">
					<p style={{ fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center" }}>
						<IonIcon icon={icon} color={color} style={{ marginRight: "8px" }} />
						{
							inputState.classification === InputClassification.LNURL_PAY ||
								inputState.classification === InputClassification.LN_ADDRESS ||
								inputState.classification === InputClassification.NOFFER
								? `${inputState.classification} detected. Fetching info.`
								: `${inputState.classification} detected. Parsing...`}
					</p>
				</IonText>
			);
		}
		case "parsedOk": {
			return (
				<IonText color="primary">
					<p style={{ fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center" }}>
						{inputState.parsedData.type}
						<IonIcon icon={checkmarkCircle} color="success" style={{ marginLeft: 8 }} />
					</p>

				</IonText>
			);
		}
	}
}

export default Send;
