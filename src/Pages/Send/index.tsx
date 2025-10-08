import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
	useIonRouter,
	useIonViewDidEnter,
	useIonViewWillEnter
} from '@ionic/react';
import { defaultMempool } from '../../constants';
import "./styles/index.css";
import useDebounce from '../../Hooks/useDebounce';
import { useHistory } from 'react-router';
import {
	logoBitcoin,
	qrCodeOutline,
	flash,
	informationCircle,
	globeOutline,
	helpCircleOutline,
	atCircleOutline,
} from 'ionicons/icons';
import { CustomSelect } from '@/Components/CustomSelect';
import { InputState } from './types';
import { useToast } from '@/lib/contexts/useToast';
import { InputClassification } from '@/lib/types/parse';
import { FeeTier, getFeeTiers } from '@/lib/fees';
import { Satoshi } from '@/lib/types/units';
import { parseUserInputToSats } from '@/lib/units';
import BackToolbar from '@/Layout2/BackToolbar';
import AmountInput from '@/Components/AmountInput';
import { useAmountInput } from '@/Components/AmountInput/useAmountInput';
import { OfferPriceType } from '@shocknet/clink-sdk';
import { useQrScanner } from '@/lib/hooks/useQrScanner';
import { useAppDispatch, useAppSelector } from '@/State/store/hooks';
import { NprofileView, selectHealthyNprofileViews } from '@/State/scoped/backups/sources/selectors';
import { sendPaymentThunk } from '@/State/scoped/backups/sources/history/sendPaymentThunk';
import { RecipentInputHelperText } from '@/lib/jsxHelperts';
import { selectFavoriteSourceId } from '@/State/scoped/backups/identity/slice';




const LnurlCard = lazy(() => import("./LnurlCard"));
const InvoiceCard = lazy(() => import("./InvoiceCard"));
const NofferCard = lazy(() => import("./NofferCard"));
const OnChainCard = lazy(() => import("./OnChainCard"));



const Send = () => {
	const router = useIonRouter();
	const history = useHistory();

	const dispatch = useAppDispatch();
	const { showToast } = useToast();

	const mempoolUrl = useAppSelector(({ prefs }) => prefs.mempoolUrl) || defaultMempool;

	const healthyNprofileViews = useAppSelector(selectHealthyNprofileViews);
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);


	// Send page is only accessible if healthyNprofileViews.length > 0
	// so we can safely assume healthyNprofileViews is not empty here
	const [selectedSource, setSelectedSource] = useState<NprofileView>(() => {
		const favIsNprofile = healthyNprofileViews.find(s => s.sourceId === favoriteSourceId);
		if (favIsNprofile) {
			if (favIsNprofile.maxWithdrawableSats || 0 > 0) return favIsNprofile
		}

		const withBalance = healthyNprofileViews.find(s => s.maxWithdrawableSats || 0 > 0);
		if (withBalance) return withBalance;

		if (healthyNprofileViews.length === 0) {
			throw new Error("No healthyNprofileViews available");
		}
		return healthyNprofileViews[0];
	});

	useIonViewWillEnter(() => {
		amountInput.clearFixed();
		setNote("");
	})


	// Recipient might be passed in location.state
	useIonViewDidEnter(() => {

		const { input: clip } = history.location.state as { input?: string } || {};
		if (!clip) return;
		clearRecipientError();

		setRecipient(clip);

		// replace the current history entry with identical URL but no state.
		// this is because Ionic will not remove the state when navigating again to this page
		history.replace(history.location.pathname + history.location.search);
	}, [history.location.key]);







	// Amount input ref, used to focus the input after a valid recipient is parsed, when applicable
	const satsInputRef = useRef<HTMLIonInputElement>(null);
	const amountInput = useAmountInput({
		userBalance: selectedSource.maxWithdrawableSats,
	})

	const [note, setNote] = useState("");




	// --- Recipient input ---
	const [recipient, setRecipient] = useState("");
	const debouncedRecepient = useDebounce(recipient, 800);
	const [inputState, setInputState] = useState<InputState>({
		status: "idle",
		inputValue: ""
	});

	const inputStateChange = useCallback((newState: InputState) => {
		setInputState(prevState => {
			const recipientChanged = prevState.inputValue !== newState.inputValue;

			if (
				recipientChanged &&
				prevState.status === "parsedOk" &&
				(
					prevState.parsedData.type === InputClassification.LN_INVOICE ||
					(
						prevState.parsedData.type === InputClassification.NOFFER &&
						prevState.parsedData.priceType !== OfferPriceType.Spontaneous
					)
				)
			) {
				amountInput.clearFixed();
			}

			return newState;
		});
	}, [amountInput]);

	const [isTouched, setIsTouched] = useState(false);
	// Recipient input ref, used to enforce removal of error class when input is changed
	const inputRef = useRef<HTMLIonInputElement>(null);

	const defaultLimits = useCallback(
		() => ({
			min: 1 as Satoshi,
			max: selectedSource.maxWithdrawableSats || 0 as Satoshi,
		}),
		[selectedSource]
	);



	useEffect(() => {
		amountInput.setLimits(defaultLimits());
		if (!debouncedRecepient.trim()) {
			inputStateChange({ status: "idle", inputValue: "" });
			return;
		}

		import("@/lib/parse")
			.then(({ identifyBitcoinInput, parseBitcoinInput }) => {
				const { classification, value } = identifyBitcoinInput(
					debouncedRecepient,
					undefined
				);
				if (classification === InputClassification.UNKNOWN) {
					inputStateChange({ status: "error", inputValue: debouncedRecepient, classification, error: "Unidentified recipient" });
					return;
				}
				inputStateChange({
					status: "loading",
					inputValue: value,
					classification
				});

				parseBitcoinInput(value, classification, selectedSource.keys)
					.then(parsed => {
						if (parsed.type === InputClassification.LNURL_WITHDRAW) {
							inputStateChange({
								error: "Lnurl cannot be a lnurl-withdraw",
								status: "error",
								inputValue: value,
								classification: parsed.type
							});
							return;
						}

						if (parsed.type === InputClassification.LN_INVOICE) {
							if (!parsed.amount) {
								inputStateChange({
									error: "Zero value invoices are not supported",
									status: "error",
									inputValue: value,
									classification: parsed.type
								});
								return;
							}

							amountInput.setFixed(parsed.amount);

							// If the invoice has a description, set it as the note
							if (parsed.memo) {
								setNote(parsed.memo);
							}
						}

						// If it's a LNURL or LN address, set the limits
						if (parsed.type === InputClassification.LNURL_PAY || parsed.type === InputClassification.LN_ADDRESS) {
							amountInput.setLimits({
								min: parsed.min,
								max: Math.min(
									parsed.max,
									selectedSource.maxWithdrawableSats || 0 as Satoshi
								) as Satoshi,
							});

							satsInputRef.current?.setFocus();

						}

						if (
							parsed.type === InputClassification.BITCOIN_ADDRESS ||
							(parsed.type === InputClassification.NOFFER &&
								parsed.priceType === OfferPriceType.Spontaneous)
						) {
							satsInputRef.current?.setFocus();
						}

						// If it's a noffer with no spontaneous price type, set the amount from the invoice
						if (parsed.type === InputClassification.NOFFER) {
							if (parsed.priceType === OfferPriceType.Fixed || parsed.priceType === OfferPriceType.Variable) {
								amountInput.setFixed(parsed.invoiceData.amount);
							}
						}
						inputStateChange({
							status: "parsedOk",
							inputValue: value,
							parsedData: parsed
						});
					})
					.catch((err: any) => {
						inputStateChange({
							status: "error",
							inputValue: value,
							error: err.message,
							classification
						});
					})
			})
			.catch(() => {
				showToast({ message: 'Failed to lazy-load "@/lib/parse"', color: "danger" })
			})



		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedRecepient, selectedSource]);


	// If the amount is fixed (invoice, fixed noffer, etc.),
	// and the amount is greater than the max withdrawable of selected source,
	// then find and change to a source that has enough balance.
	// If there is no such source, do nothing.
	useEffect(() => {
		if (
			amountInput.state.mode === "fixed" &&
			amountInput.effectiveSats !== null &&
			amountInput.effectiveSats > (selectedSource.maxWithdrawableSats || 0 as Satoshi)
		) {
			const foundOneWithEnoughBalance = healthyNprofileViews.find(s => (s.maxWithdrawableSats || 0 as Satoshi) >= amountInput.effectiveSats!);
			if (foundOneWithEnoughBalance) {
				setSelectedSource(foundOneWithEnoughBalance)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amountInput])



	const clearRecipientError = () => {
		if (inputRef.current) {
			inputRef.current.classList.remove("ion-invalid")
		}
	}

	const onRecipientChange = (e: CustomEvent) => {
		setRecipient(e.detail.value || "");
		inputStateChange({ status: "idle", inputValue: "" });
		clearRecipientError();
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






	const { scanSingleBarcode } = useQrScanner();
	const openScan = async () => {
		const instruction = "Scan a Lightning Invoice, Noffer string, Bitcoin Address, Lnurl, or Lightning Address";

		try {
			const input = await scanSingleBarcode(instruction);
			setRecipient(input);
		} catch {
			/*  */
		}
	}




	const [popovers, setPopovers] = useState({
		reserve: false,
	})


	// --- Handle Payment ---
	const canPay = useMemo(() =>
		inputState.status === "parsedOk" && amountInput.effectiveSats !== null && amountInput.effectiveSats !== 0 && (selectedSource.maxWithdrawableSats || 0 as Satoshi) >= amountInput.effectiveSats
		, [inputState, amountInput.effectiveSats, selectedSource]);


	const handlePayment = useCallback(async () => {
		if (inputState.status !== "parsedOk") {

			return;
		}
		if (amountInput.effectiveSats === null) {

			return;
		}
		if (amountInput.effectiveSats > (selectedSource.maxWithdrawableSats || 0 as Satoshi)) {
			return;
		}

		try {
			const res = await dispatch(sendPaymentThunk({
				sourceId: selectedSource.sourceId,
				parsedInput: inputState.parsedData,
				amount: amountInput.effectiveSats,
				note,
				satsPerVByte: feeTiers[selectedFeeTier].rate,
				showToast
			}));
			if (
				inputState.parsedData.type === InputClassification.NOFFER &&
				inputState.parsedData.priceType === OfferPriceType.Spontaneous &&
				res?.error && res.range
			) {
				amountInput.setLimits({
					min: parseUserInputToSats(res.range.min.toString(), "sats"),
					max: Math.min(parseUserInputToSats(res.range.max.toString(), "sats"), selectedSource.maxWithdrawableSats || 0 as Satoshi) as Satoshi

				})

				showToast({ message: "Noffer range updated, please try to send again now", color: "warning" });
			} else {
				router.goBack()
			}
		} catch (err: any) {
			showToast({ message: err?.message || "Payment failed", color: "danger" });
		}

	}, [amountInput, inputState, selectedSource, dispatch, router, showToast, feeTiers, selectedFeeTier, note]);


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
								className="filled-input"
								labelPlacement="stacked"
								unit={amountInput.unit}
								displayValue={amountInput.displayValue}
								fill="solid"
								mode="md"
								limits={amountInput.limits}
								isDisabled={amountInput.inputDisabled}
								effectiveSats={amountInput.effectiveSats}
								error={amountInput.error}
								onType={amountInput.typeAmount}
								onPressMax={amountInput.pressMax}
								onToggleUnit={amountInput.toggleUnit}
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
									filled-input
								`}

								label="Recipient"
								labelPlacement="stacked"
								fill="solid"
								mode="md"
								color="primary"
								onIonBlur={() => setIsTouched(true)}
								placeholder="Paste invoice, Noffer string LNURL, Bitcoin address, or Lightning address"
								errorText={inputState.status === "error" ? inputState.error : ""}
								value={recipient}
								onIonInput={onRecipientChange}
							>
								<IonButton size="small" fill="clear" slot="end" aria-label="scan" onClick={openScan}>
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
							<CustomSelect<NprofileView>
								items={healthyNprofileViews}
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
													Lightning.Pub Source
												</IonNote>
											</IonLabel>
											<IonText slot="end" color="primary">
												{+(source.balanceSats || 0 as Satoshi).toLocaleString()} sats
											</IonText>
										</>
									)
								}}
								renderSelected={(source) => (
									<IonText className="text-medium">
										{source?.label || ''}
										<IonNote className="text-low" style={{ display: 'block' }}>
											{(+(source?.balanceSats || 0 as Satoshi)).toLocaleString()} sats
										</IonNote>
									</IonText>
								)}
							>
							</CustomSelect>

						</IonCol>
					</IonRow>
					{
						(selectedSource?.maxWithdrawableSats || 0 as Satoshi) > 0 && (
							<IonRow className="ion-align-items-center ion-margin-top">
								<IonCol size="auto" >
									<IonText style={{ fontSize: "0.8rem" }} color="primary">
										<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
											Note: {(+(selectedSource?.balanceSats || 0 as Satoshi) - +(selectedSource?.maxWithdrawableSats || 0 as Satoshi)).toLocaleString()} sats of your balance is held in reserve for network fees.
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
							</IonRow>
						)
					}
				</IonGrid>

				<IonPopover
					isOpen={popovers.reserve}
					onDidDismiss={() => setPopovers({ ...popovers, reserve: false })}
				>
					<IonContent className="ion-padding">
						<IonText className="text-medium">
							Lightning fees are based on the amount of sats you are
							sending, and so you must have more sats than you amountInput.
							To ensure high success rates and low overall fees, the node
							has defined a fee budget to hold as a fee reserve for sends.
						</IonText>
					</IonContent>
				</IonPopover>

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


						</IonList>
					</div>

				</IonModal>
			</IonContent>
			<IonFooter className="ion-no-border">
				<IonToolbar>
					<IonGrid className="ion-no-padding">
						<IonRow className="ion-justify-content-center ion-align-items-center" style={{ gap: "1rem" }}>
							<IonCol size="5" >
								<IonButton color="light" fill="default" expand="block" onClick={() => router.push("/home", "back", "pop")}>
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



export default Send;
