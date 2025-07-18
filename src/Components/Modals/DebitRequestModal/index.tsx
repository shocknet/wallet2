import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import * as Types from "../../../Api/pub/autogenerated/ts/types";
import { getNostrClient, parseNprofile } from "../../../Api/nostr";
import { useDispatch, useSelector } from "../../../State/store";
import { Modal } from "../Modal";
import { decodeInvoice, NOSTR_RELAYS } from "../../../constants";
import { nip19 } from "nostr-tools";
import styles from "./styles/index.module.scss";
import { BackCircleIcon, BanIcon, CrossIcon, ShieldIcon, TrashIcon } from '../../../Assets/SvgIconLibrary';
import Dropdown from "../../Dropdowns/LVDropdown";
import { getDebitAppNameAndAvatarUrl, intervalTypeToUnit, unitToIntervalType, WalletIntervalEnum } from "./helpers";
import Checkbox from "../../Checkbox";
import classNames from "classnames";
import { refetchDebits, removeDebitRequest, setDebitToEdit } from "../../../State/Slices/modalsSlice";
import { toast } from "react-toastify";
import Toast from "../../Toast";

const intervalsArray = Object.values(WalletIntervalEnum);




export const DebitRequestModal = () => {
	const price = useSelector((state) => state.usdToBTC);
	const spendSources = useSelector(state => state.spendSource);
	const dispatch = useDispatch();

	const debitRequests = useSelector(state => state.modalsSlice.debitRequests)


	const [requestAmount, setRequestAmount] = useState("");
	const [isSecondPhase, setIsSecondPhase] = useState(false);

	// Display requestor name and avatar
	const [requestorDomain, setRequestorDomain] = useState("");
	const [requestorAvatarUrl, setRequestorAvatarUrl] = useState("");


	const [isCreateRule, setIsCreateRule] = useState(true);

	const [frequencyRule, setFrequencyRule] = useState<Types.FrequencyRule>({
		amount: 100,
		interval: Types.IntervalType.MONTH,
		number_of_intervals: 3
	});
	const [isRecurringPayment, setIsRecurringPayment] = useState(false);
	const [adjustForExchangeRate, setAdjustForExchangeRate] = useState(false);

	const [isBanPrompt, setIsBanPrompt] = useState(false);




	const currentRequest = useMemo(() => {
		setIsSecondPhase(false);
		setIsBanPrompt(false);
		if (debitRequests.length > 0) {
			const req = debitRequests[0]; // take first request in the array; new requests are pushed to the end of the array. FIFO

			if (!spendSources.sources[req.sourceId]) return; // If the spend source was deleted ignore the request

			if (req.request.debit.type === Types.LiveDebitRequest_debit_type.FREQUENCY) {
				setFrequencyRule(req.request.debit.frequency)
				setIsRecurringPayment(true)
				setRequestAmount(req.request.debit.frequency.amount.toString())
				return { request: req.request, source: spendSources.sources[req.sourceId] }
			} else if (req.request.debit.type === Types.LiveDebitRequest_debit_type.INVOICE) {
				const { amount } = decodeInvoice(req.request.debit.invoice)
				setRequestAmount(amount.toString())
				return { request: req.request, source: spendSources.sources[req.sourceId] }
			} else {
				return { request: req.request, source: spendSources.sources[req.sourceId] }
			}

		} else {
			return null;
		}
	}, [debitRequests, spendSources])



	// when a request is received try to fetch a nip05 for the requestor pubkey and get the domain.
	// the domain will be used to supplement the data dispayed in the debit request modal, such as domain name and avatar
	useEffect(() => {
		const getAppNameAndAvatar = async () => {
			if (!currentRequest) return;

			// TODO: Have the request include a relay to fetch metadata from.
			// For now the code just uses the relay of the source receiving the nip68 request.
			// Note: SMART is supposed to handle this later
			const { requestorDomain: rd, avatarUrl } = await getDebitAppNameAndAvatarUrl(currentRequest.request.npub, parseNprofile(currentRequest.source.pasteField).relays || NOSTR_RELAYS)
			setRequestorDomain(rd)
			setRequestorAvatarUrl(avatarUrl)
		};

		getAppNameAndAvatar();

	}, [currentRequest])


	const authroizeRequest = useCallback(async () => {
		if (!currentRequest) return;

		const rules: Types.DebitRule[] = [];
		if (isRecurringPayment) {
			rules.push({
				rule: {
					type: Types.DebitRule_rule_type.FREQUENCY_RULE,
					frequency_rule: { ...frequencyRule, amount: +requestAmount }
				}
			})
		} else if (isCreateRule) {
			rules.push({
				rule: {
					type: Types.DebitRule_rule_type.FREQUENCY_RULE,
					frequency_rule: { amount: +requestAmount, number_of_intervals: 120_000, interval: Types.IntervalType.MONTH }
				}
			})
		}

		if (currentRequest.request.debit.type === Types.LiveDebitRequest_debit_type.INVOICE) {
			await (await getNostrClient(currentRequest.source.pasteField, currentRequest.source.keys)).RespondToDebit({
				npub: currentRequest.request.npub,
				request_id: currentRequest.request.request_id,
				response: {
					type: Types.DebitResponse_response_type.INVOICE,
					invoice: currentRequest.request.debit.invoice
				}
			});
		}
		const res = await (await getNostrClient(currentRequest.source.pasteField, currentRequest.source.keys)).AuthorizeDebit({
			authorize_npub: currentRequest.request.npub, rules,
			request_id: currentRequest.request.request_id
		});
		if (res.status !== "OK") {
			toast.error(<Toast title="Add linked app error" message={res.reason} />)
			return;
		}
		dispatch(removeDebitRequest({ requestorNpub: currentRequest.request.npub, sourceId: currentRequest.source.id }))
		dispatch(refetchDebits())
		toast.success("Linked app added successfuly")
	}, [isRecurringPayment, frequencyRule, dispatch, currentRequest, requestAmount, isCreateRule]);





	const substrinedNpub = useMemo(() => {
		if (!currentRequest) return "";
		const npub = nip19.npubEncode(currentRequest.request.npub);
		return `${npub.substring(0, 20)}...${npub.substring(npub.length - 20, npub.length)}`
	}, [currentRequest])


	const handleFirstPhaseAllow = useCallback(() => {
		if (isCreateRule) {
			setIsSecondPhase(true);
		} else {
			authroizeRequest()
		}
	}, [authroizeRequest, isCreateRule])


	const removeCurrentRequest = useCallback(async () => {
		if (currentRequest) {
			await (await getNostrClient(currentRequest.source.pasteField, currentRequest.source.keys)).RespondToDebit({
				npub: currentRequest.request.npub,
				request_id: currentRequest.request.request_id,
				response: {
					type: Types.DebitResponse_response_type.DENIED,
					denied: {}
				}
			});
			dispatch(removeDebitRequest({ requestorNpub: currentRequest.request.npub, sourceId: currentRequest.source.id }));
		}
	}, [currentRequest, dispatch])

	const handleDenyRequest = useCallback(() => {
		if (!currentRequest) return;

		if (isCreateRule) {
			setIsBanPrompt(true);
		} else {
			removeCurrentRequest()
		}

	}, [currentRequest, removeCurrentRequest, isCreateRule])

	const banRequest = useCallback(async () => {
		if (!currentRequest) return;
		const res = await (await getNostrClient(currentRequest.source.pasteField, currentRequest.source.keys)).BanDebit({ npub: currentRequest.request.npub });
		if (res.status !== "OK") {
			throw new Error(res.reason);
		}
		removeCurrentRequest()
	}, [currentRequest, removeCurrentRequest])

	const modalContent = currentRequest ? (
		<div className={styles["container"]}>
			<div className={styles["modal-header"]}>Incoming Request</div>
			<div className={styles["modal-body"]}>
				<div className={styles["requestor-container"]}>
					{
						requestorAvatarUrl
						&&
						<img src={requestorAvatarUrl} alt="Requestor avatar" height={55} width={55} />
					}
					{
						requestorDomain
						&&
						<span className={styles["app-name"]}>{requestorDomain}</span>
					}
					<span className={styles["npub"]}>{substrinedNpub}</span>
				</div>

				<>
					{
						isBanPrompt
							?
							<PromptBanApp banAppCallback={banRequest} dismissCallback={removeCurrentRequest} />
							:
							!isSecondPhase
								?
								<>
									<div className={styles["debit-info"]}>
										<span className={styles["orange-text"]}>Wants you to spend</span>
										<span className={styles["sats-amount"]}>{new Intl.NumberFormat('en-US').format(+requestAmount)}</span>
										<span className={styles["fiat"]}>~ $ {+requestAmount === 0 ? 0 : (+requestAmount * price.buyPrice * 0.00000001).toFixed(2)}</span>
									</div>
									<div className={styles["buttons-container"]}>
										<button onClick={handleDenyRequest}>
											<>
												<CrossIcon />
												Deny
											</>
										</button>
										<button onClick={handleFirstPhaseAllow}>
											<>
												<ShieldIcon />
												Allow
											</>
										</button>
									</div>
									<div className={styles["checkbox-container"]}>
										<Checkbox state={isCreateRule} setState={(e) => setIsCreateRule(e.target.checked)} id="create-rule" />
										<span className={styles["faded-text"]} style={{ fontSize: "14px" }}>Create rules for this app.</span>
									</div>
								</>
								:
								<RulesState
									cancelCallback={() => setIsSecondPhase(false)}
									frequencyRule={frequencyRule}
									setFrequencyRule={setFrequencyRule}
									requestAmount={requestAmount}
									setRequestAmount={setRequestAmount}
									isRecurringPayment={isRecurringPayment}
									setIsRecurringPayment={setIsRecurringPayment}
									adjustForExchangeRate={adjustForExchangeRate}
									setAdjustForExchangeRate={setAdjustForExchangeRate}
									confirmCallback={authroizeRequest}
								/>
					}
				</>
			</div>

		</div>
	) : <></>;



	return <Modal isShown={!!currentRequest} hide={handleDenyRequest} modalContent={modalContent} headerText={''} />
}



interface Props {
	cancelCallback: () => void;
	frequencyRule: Types.FrequencyRule,
	setFrequencyRule: React.Dispatch<SetStateAction<Types.FrequencyRule>>;
	requestAmount: string,
	setRequestAmount: React.Dispatch<SetStateAction<string>>,
	isRecurringPayment: boolean,
	setIsRecurringPayment: React.Dispatch<SetStateAction<boolean>>,
	adjustForExchangeRate: boolean,
	setAdjustForExchangeRate: React.Dispatch<SetStateAction<boolean>>,
	confirmCallback: () => Promise<void>;
}
const RulesState = ({
	cancelCallback,
	frequencyRule,
	setFrequencyRule,
	requestAmount,
	setRequestAmount,
	isRecurringPayment,
	setIsRecurringPayment,
	adjustForExchangeRate,
	setAdjustForExchangeRate,
	confirmCallback
}: Props) => {

	const price = useSelector((state) => state.usdToBTC);


	const dropdownOtherOptions = intervalsArray.filter(i => i !== intervalTypeToUnit(frequencyRule.interval))


	return (
		<>
			<div className={styles["debit-info"]}>
				<span className={styles["orange-text"]}>Budget before network fees:</span>

				<input
					className={classNames(styles["input"], styles["sats-amount-input"])}
					type="text"
					value={parseInt(requestAmount).toLocaleString()}
					onChange={(e) => {
						console.log({ s: e.target.value })
						const rawInput = e.target.value.replace(/,/g, '');
						console.log({ rawInput })
						if (rawInput === '' || !isNaN(+rawInput)) {
							setRequestAmount(rawInput)
						}
					}}

				/>

				<span className={styles["fiat"]}>~ $ {+requestAmount === 0 ? 0 : (+requestAmount * price.buyPrice * 0.00000001).toFixed(2)}</span>
			</div>
			<div className={styles["debit-info"]}>
				<div className={styles["checkbox-container"]}>
					<Checkbox state={isRecurringPayment} setState={(e) => setIsRecurringPayment(e.target.checked)} id="recurring-payment" />
					<span>Recurring payment:</span>
				</div>
				<div className={classNames({
					[styles["rule-options"]]: true,
					[styles["disabled"]]: !isRecurringPayment
				})}>
					<span>Reset budget every</span>
					<input className={classNames(styles["input"], styles["num-intervals-input"])} type="number" min={1} value={frequencyRule.number_of_intervals} onChange={(e) => setFrequencyRule(state => ({ ...state, number_of_intervals: +e.target.value }))} />
					<Dropdown<WalletIntervalEnum>
						setState={(value) => setFrequencyRule(state => ({ ...state, interval: unitToIntervalType(value) }))}
						otherOptions={dropdownOtherOptions}
						jsx={
							<div className={styles["dropdown-box"]}>{intervalTypeToUnit(frequencyRule.interval)} ▼</div>
						}
					/>
				</div>


				<div className={styles["adjust-checkbox-container"]}>
					<Checkbox state={adjustForExchangeRate} setState={(e) => setAdjustForExchangeRate(e.target.checked)} id="adjust-for-rate" />
					<p className={styles["faded-text"]}>
						Periodically adjust for changes in exchange rate
						&#40;experimental, wallet client must be active&#41;
					</p>
				</div>
			</div>
			<div className={styles["buttons-container"]}>
				<button onClick={cancelCallback}>
					<>
						<CrossIcon />
						Deny
					</>
				</button>
				<button onClick={confirmCallback}>
					<>
						<ShieldIcon />
						Save
					</>
				</button>
			</div>

		</>
	)
}


export const EditDebitModal = () => {
	const dispatch = useDispatch();
	const stateDebit = useSelector(state => state.modalsSlice.editDebit);
	const spendSources = useSelector(state => state.spendSource)

	const [frequencyRule, setFrequencyRule] = useState<Types.FrequencyRule>({
		amount: 100,
		interval: Types.IntervalType.MONTH,
		number_of_intervals: 3
	});
	const [requestAmount, setRequestAmount] = useState("");

	const [isRecurringPayment, setIsRecurringPayment] = useState(false);
	const [adjustForExchangeRate, setAdjustForExchangeRate] = useState(false);

	const debitAuth = useMemo(() => {
		if (!stateDebit) return null;
		const spendSource = spendSources.sources[stateDebit.sourceId]
		if (!spendSource) return null;
		return { ...stateDebit, source: spendSource }
	}, [stateDebit, spendSources])

	useEffect(() => {
		if (debitAuth) {
			const rule = debitAuth.rules.find(r => r.rule.type === Types.DebitRule_rule_type.FREQUENCY_RULE);
			if (rule && rule.rule.type === Types.DebitRule_rule_type.FREQUENCY_RULE) {
				setFrequencyRule(rule.rule.frequency_rule);
				setRequestAmount(rule.rule.frequency_rule.amount.toString());
				setIsRecurringPayment(true);
			}
		}
	}, [debitAuth]);

	const substrinedNpub = useMemo(() => {
		if (!debitAuth) return "";
		const npub = nip19.npubEncode(debitAuth.npub);
		return `${npub.substring(0, 20)}...${npub.substring(npub.length - 20, npub.length)}`
	}, [debitAuth])

	const updateDebitAuth = useCallback(async () => {
		if (debitAuth) {
			const rules: Types.DebitRule[] = [];
			if (isRecurringPayment) {
				rules.push({
					rule: {
						type: Types.DebitRule_rule_type.FREQUENCY_RULE,
						frequency_rule: { ...frequencyRule, amount: +requestAmount }
					}
				})
			}
			const res = await (await getNostrClient(debitAuth.source.pasteField, debitAuth.source.keys)).EditDebit({ authorize_npub: debitAuth.npub, rules });
			if (res.status !== "OK") {
				toast.error(<Toast title="Update linked app error" message={res.reason} />)
				return
			}
			console.log({ rules })
			dispatch(refetchDebits())
			dispatch(setDebitToEdit(null));
			toast.success("Linked app updated successfuly")
		}
	}, [debitAuth, dispatch, frequencyRule, isRecurringPayment, requestAmount]);

	const resetRequest = useCallback(async () => {
		if (debitAuth) {
			const res = await (await getNostrClient(debitAuth.source.pasteField, debitAuth.source.keys)).ResetDebit({ npub: debitAuth.npub });
			if (res.status !== "OK") {
				toast.error(<Toast title="Remove linked app error" message={res.reason} />)
				return;
			}
			dispatch(refetchDebits())
			dispatch(setDebitToEdit(null));
			toast.success("Linked app removed successfuly")
		}
	}, [debitAuth, dispatch])



	const modalContent = debitAuth ? (
		<>
			<div className={styles["container"]}>
				<div className={styles["corner-icon"]} onClick={resetRequest}>
					<TrashIcon />
				</div>
				<div className={styles["modal-header"]}>Edit Rule</div>
				<div className={styles["modal-body"]}>
					<div className={styles["requestor-container"]}>
						{
							debitAuth.avatarUrl
							&&
							<img src={debitAuth.avatarUrl} alt="Requestor avatar" height={55} width={55} />
						}
						{
							debitAuth.domainName
							&&
							<span className={styles["app-name"]}>{debitAuth.domainName}</span>
						}
						<span className={styles["npub"]}>{substrinedNpub}</span>
					</div>
					<RulesState
						cancelCallback={() => dispatch(setDebitToEdit(null))}
						frequencyRule={frequencyRule}
						setFrequencyRule={setFrequencyRule}
						requestAmount={requestAmount}
						setRequestAmount={setRequestAmount}
						isRecurringPayment={isRecurringPayment}
						setIsRecurringPayment={setIsRecurringPayment}
						adjustForExchangeRate={adjustForExchangeRate}
						setAdjustForExchangeRate={setAdjustForExchangeRate}
						confirmCallback={updateDebitAuth}
					/>
				</div>

			</div>
		</>
	) : <></>;

	return <Modal isShown={!!debitAuth} hide={() => dispatch(setDebitToEdit(null))} modalContent={modalContent} headerText={''} />
}

interface PromptBanAppProps {
	banAppCallback: () => Promise<void>;
	dismissCallback: () => void;
}

const PromptBanApp = ({ banAppCallback, dismissCallback }: PromptBanAppProps) => {
	return (
		<>
			<div className={classNames(styles["debit-info"], styles["ban-prompt-body"])}>
				<span>Ban this key?</span>
			</div>
			<div className={styles["buttons-container"]}>
				<button onClick={banAppCallback}>
					<>
						<BanIcon />
						BAN
					</>
				</button>
				<button onClick={dismissCallback}>
					<>
						<BackCircleIcon />
						DISMISS
					</>
				</button>
			</div>
		</>
	)
}