import SectionDivider from "@/Components/common/ui/sectionDivider";
import { getTransaction } from "@/lib/mempool";
import { BitcoinTransaction } from "@/lib/types/mempool";
import { Satoshi } from "@/lib/types/units";
import { formatBitcoin, formatSatoshi, satsToBtc } from "@/lib/units";
import { SourceOperation, SourceOperationInvoice, SourceOperationOnChain, SourceOptimsiticInvoice, SourceOptimsiticOnChain, SourceUserToUserOperation } from "@/State/history/types";
import {
	IonAccordion,
	IonAccordionGroup,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonModal,
	IonNote,
	IonPopover,
	IonSpinner,
	IonText,
	IonTextarea,
	IonTitle,
	IonToolbar
} from "@ionic/react";
import { useEffect, useMemo, useState } from "react";
import styles from "./styles/index.module.scss";
import classNames from "classnames";
import { checkmark, closeOutline, copy, informationCircle, pencilOutline } from "ionicons/icons";
import { selectSourceById, useDispatch, useSelector } from "@/State/store";
import { updateOperationNote } from "@/State/history";
import Popover from "@/Components/common/popover";
import { InputClassification } from "@/lib/types/parse";
import NofferInfoDisplay from "@/Components/common/info/nofferInfoDisplay";
import LnurlInfoDisplay from "@/Components/common/info/lnurlInfoDisplay";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	operation: SourceOperation | null;
}



const OperationModal = ({ isOpen, onClose, operation }: Props) => {
	if (!operation) return null;

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			style={{ "--background": "var(--ion-color-secondary)" }}
			className="wallet-modal"
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle>
						Operation Info
					</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onClose} fill="clear">
							<IonIcon icon={closeOutline} slot="icon-only" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className={classNames("ion-padding", styles["modal-content"])}>
				{
					operation.type === "ON-CHAIN" && (
						<OnChainOperation operation={operation} />
					)
				}
				{
					(operation.type === "LNURL_WITHDRAW" || operation.type === "INVOICE") && (
						<InvoiceOperation operation={operation} />
					)
				}
				{
					operation.type === "USER_TO_USER" && (
						<UserToUserOperation operation={operation} />
					)
				}
			</IonContent>
		</IonModal>
	)
}

export default OperationModal;




const OnChainOperation = ({ operation }: { operation: SourceOperationOnChain | SourceOptimsiticOnChain }) => {

	const [mempoolRes, setMempoolRes] = useState<BitcoinTransaction | null>(null);

	useEffect(() => {
		if (operation.txHash) {
			getTransaction(operation.txHash).then((res) => {
				if (res !== null) {
					setMempoolRes(res)
				}
			})
		}
	}, [operation]);

	const data = useMemo(() => {
		let status: string | JSX.Element = "";
		let serviceFee: number | null = null;
		let networkFee: number | null = null;
		let txHash: string | null = null;
		if ("optimistic" in operation && operation.optimistic) {
			switch (operation.status) {
				case "broadcasting":
					status = "Broadcasting";
					break;
				case "success":
					status = "Completed (internal transaction)";
					serviceFee = operation.serviceFee;
					break;
				case "confirming":
					status = "0 confirmations";
					networkFee = operation.networkFee;
					serviceFee = operation.serviceFee;
					txHash = operation.txHash;
					break;
				default:
					status = "";
			}
		} else {
			serviceFee = operation.serviceFee;

			if (operation.internal) {
				status = "Completed (internal)";
			} else {
				status = mempoolRes ? `${mempoolRes.confirmations} confirmations` : <span className={styles["spinner"]}><IonSpinner /></span>;
				networkFee = operation.networkFee;
				txHash = operation.txHash;

			}
		}
		return { status, serviceFee, networkFee, txHash };
	}, [operation, mempoolRes]);



	return (
		<>
			<SectionDivider title="On-chain Transaction" />
			<IonList lines="none" style={{ borderRadius: "12px" }}>
				<IonItem>
					<IonLabel color="primary">Amount</IonLabel>
					<IonText color="primary">{operation.inbound ? "" : "-"}{formatBitcoin(satsToBtc(operation.amount))} <IonText color="light">BTC</IonText></IonText>

				</IonItem>
				<IonItem>
					<IonLabel color="primary">Status</IonLabel>
					<IonText>{data.status}</IonText>
				</IonItem>
				<IonItem>
					<IonLabel color="primary">Paid At</IonLabel>
					<IonText>{new Date(operation.paidAtUnix).toLocaleString()}</IonText>
				</IonItem>
				{
					!!data.serviceFee && (
						<IonItem>
							<IonLabel color="primary">Service fee</IonLabel>
							<IonText color="primary">{formatSatoshi(data.serviceFee as Satoshi)} <IonText color="light">sats</IonText></IonText>
						</IonItem>
					)
				}
				{
					!!mempoolRes && (
						<IonItem>
							<IonLabel color="primary">Transaction fee</IonLabel>
							<IonText color="primary">{formatSatoshi(mempoolRes.fee as Satoshi)} <IonText color="light">sats</IonText></IonText>
						</IonItem>
					)
				}
				{
					!!data.networkFee && (
						<IonItem>
							<IonLabel color="primary">Network fee</IonLabel>
							<IonText color="primary">{formatSatoshi(data.networkFee as Satoshi)} <IonText color="light">sats</IonText></IonText>
						</IonItem>
					)
				}
				{
					!!data.txHash && (
						<IonItem>
							<IonLabel color="primary">
								Transaction Id
								<div className={styles["long-text-container"]}>
									<div className={styles["long-text-text"]}>

										<IonNote color="medium" className={classNames("ion-text-wrap", styles["text"])}>{data.txHash}</IonNote>
									</div>
									<div className={styles["long-text-icon"]}>
										<IonButton size="large" shape="round" fill="clear">
											<IonIcon slot="icon-only" icon={copy} />
										</IonButton>
									</div>
								</div>
							</IonLabel>

						</IonItem>
					)
				}
				<NoteField note={operation.memo} sourceId={operation.sourceId} operationId={operation.operationId} />


			</IonList>
			<Popover id="internal-info" text="internal means this" />
			<SourceSection sourceId={operation.sourceId} />
		</>
	)
}

const InvoiceOperation = ({ operation }: { operation: SourceOperationInvoice | SourceOptimsiticInvoice }) => {
	const data = useMemo(() => {
		let status: string | JSX.Element = "";
		let serviceFee: number | null = null;
		let networkFee: number | null = null;
		if ("optimistic" in operation && operation.optimistic) {
			status = "Pending";
		} else {
			const isFromLnurlW = operation.type === "LNURL_WITHDRAW";
			status = operation.internal ? "Completed (internal)" : "Completed";
			serviceFee = isFromLnurlW ? null : operation.serviceFee;
			networkFee = isFromLnurlW ? null : operation.internal ? null : operation.networkFee;
		}
		return { status, serviceFee, networkFee };
	}, [operation]);


	return (
		<>
			<SectionDivider title="Invoice Payment" />
			<IonList lines="none" style={{ borderRadius: "12px" }}>
				<IonItem>
					<IonLabel color="primary">Amount</IonLabel>
					<IonText color="primary">{operation.inbound ? "" : "-"}{formatSatoshi(operation.amount)} <IonText color="light">sats</IonText></IonText>
				</IonItem>
				<IonItem>
					<IonLabel color="primary">Status</IonLabel>
					<IonText>{data.status}</IonText>
				</IonItem>
				<IonItem>
					<IonLabel color="primary">Paid At</IonLabel>
					<IonText>{new Date(operation.paidAtUnix).toLocaleString()}</IonText>
				</IonItem>
				{
					!!data.serviceFee && (
						<IonItem>
							<IonLabel color="primary">Service fee</IonLabel>
							<IonText color="primary">{formatSatoshi(data.serviceFee as Satoshi)} <IonText color="light">sats</IonText></IonText>
						</IonItem>
					)
				}
				{
					!!data.networkFee && (
						<IonItem>
							<IonLabel color="primary">Network fee</IonLabel>
							<IonText color="primary">{formatSatoshi(data.networkFee as Satoshi)} <IonText color="light">sats</IonText></IonText>
						</IonItem>
					)
				}

				<NoteField note={operation.memo} sourceId={operation.sourceId} operationId={operation.operationId} />


			</IonList>
			<SectionDivider title="Invoice Details" />
			<IonList lines="none" style={{ borderRadius: "12px" }}>
				<IonItem>
					<IonLabel color="primary">
						Invoice
						<IonNote style={{ display: "block", fontSize: "0.8rem" }} color="medium" className="ion-text-wrap">{operation.invoice}</IonNote>
					</IonLabel>
					<IonIcon icon={copy} slot="end" />
				</IonItem>
				{
					operation.invoiceMemo && (

						<IonItem>
							<IonLabel color="primary">
								Invoice Memo
								<IonNote style={{ display: "block", fontSize: "0.9rem" }} color="medium" className="ion-text-wrap">{operation.invoiceMemo}</IonNote>
							</IonLabel>
						</IonItem>
					)
				}

			</IonList>
			{
				operation.invoiceSource && (

					<IonAccordionGroup className="ion-margin-top">
						<IonAccordion value="invoice-info">
							<IonItem slot="header">
								<IonLabel
									style={{ display: "flex", alignItems: "center" }}
									color="primary"
								>
									Invoice Source
									<IonIcon id="invoice-source-info" style={{ marginLeft: "4px" }} icon={informationCircle}></IonIcon>
								</IonLabel>
								<IonPopover
									trigger="invoice-source-info"
									triggerAction="hover"
									showBackdrop={false}
									arrow
									mode="ios"
								>
									<IonContent className="ion-padding">The input this invoice was generated from. e.g. LNURL, Noffer, etc.</IonContent>
								</IonPopover>


							</IonItem>
							<div slot="content">
								{
									operation.invoiceSource.type === InputClassification.NOFFER &&
									<NofferInfoDisplay nofferData={operation.invoiceSource} labelsColor="primary" inset />
								}
								{
									(operation.invoiceSource.type === InputClassification.LNURL_PAY || operation.invoiceSource.type === InputClassification.LN_ADDRESS) &&
									<LnurlInfoDisplay lnurlData={operation.invoiceSource} labelsColor="primary" inset />
								}
							</div>
						</IonAccordion>
					</IonAccordionGroup>

				)
			}

			<SourceSection sourceId={operation.sourceId} />

		</>
	)
}


const UserToUserOperation = ({ operation }: { operation: SourceUserToUserOperation }) => {

	return (
		<>
			<SectionDivider title="User To User Payment" />
			<IonList lines="none" style={{ borderRadius: "12px" }}>
				<IonItem>
					<IonLabel color="primary">Amount</IonLabel>
					<IonText color="primary">{operation.inbound ? "" : "-"}{formatSatoshi(operation.amount)} <IonText color="light">sats</IonText></IonText>

				</IonItem>
				<IonItem>
					<IonLabel color="primary">Status</IonLabel>
					<IonText>Completed</IonText>
				</IonItem>
				<IonItem>
					<IonLabel color="primary">Paid At</IonLabel>
					<IonText>{new Date(operation.paidAtUnix).toLocaleString()}</IonText>
				</IonItem>
				{
					operation.serviceFee && (
						<IonItem>
							<IonLabel color="primary">Service fee</IonLabel>
							<IonText color="primary">{formatSatoshi(operation.serviceFee as Satoshi)} <IonText color="light">sats</IonText></IonText>
						</IonItem>
					)
				}

				<NoteField note={operation.memo} sourceId={operation.sourceId} operationId={operation.operationId} />

			</IonList>
			<SourceSection sourceId={operation.sourceId} />
		</>
	)
}

const SourceSection = ({ sourceId }: { sourceId: string }) => {
	const operationSource = useSelector(state => selectSourceById(state, sourceId));

	if (!operationSource) return null;

	return (
		<>
			<SectionDivider title="Source" />
			<IonList lines="none" style={{ borderRadius: "12px" }}>
				<IonItem>
					<IonLabel color="primary">Source Label</IonLabel>
					<IonText>{operationSource.label}</IonText>
				</IonItem>
				<IonItem>
					<IonLabel color="primary">Source Type</IonLabel>
					<IonText>{"balance" in operationSource ? "Spend From" : "Pay To"}</IonText>
				</IonItem>

				{"balance" in operationSource && (
					<IonItem>
						<IonLabel color="primary">Balance</IonLabel>
						<IonText color="primary">{parseInt(operationSource.balance).toLocaleString()}	<IonText color="light">sats</IonText></IonText>
					</IonItem>
				)}
				<IonItem>
					<IonLabel color="primary">
						Paste Field
						<IonNote style={{ display: "block", fontSize: "0.8rem" }} color="medium" className="ion-text-wrap">{operationSource.pasteField}</IonNote>
					</IonLabel>
				</IonItem>
			</IonList>
		</>
	)
}






const NoteField = ({ note: initialNote, sourceId, operationId }: { note?: string, sourceId: string, operationId: string }) => {
	const dispatch = useDispatch();

	const [note, setNote] = useState<string | undefined>(initialNote);
	const [isEditing, setIsEditing] = useState(false);

	const handleNoteChange = (e: CustomEvent) => {
		const rawValue = (e.target as HTMLIonInputElement).value?.toString() || "";
		setNote(rawValue);

	};
	const handleNoteSave = () => {
		if (note) {
			dispatch(updateOperationNote({ note, sourceId, operationId }));
			setIsEditing(false);
		}
	}

	const handleNoteCancel = () => {
		setNote(initialNote);
		setIsEditing(false);
	}


	return (
		<IonItem>
			<IonLabel color="primary">
				Note
				{
					isEditing ? (
						<div className={styles["long-text-container"]}>
							<div className={styles["long-text-text"]}>
								<IonTextarea
									ref={(el) => {
										if (el) {
											setTimeout(() => el.setFocus(), 0);
										}
									}}
									value={note || ''}
									onIonInput={handleNoteChange}
									autoGrow={true}
									color="primary"
								/>
							</div>
							<div className={styles["long-text-icon"]}>
								<IonButton onClick={handleNoteSave} shape="round" fill="clear" color="success">
									<IonIcon icon={checkmark} slot="icon-only" />
								</IonButton>
								<IonButton onClick={handleNoteCancel} shape="round" fill="clear" color="medium">
									<IonIcon icon={closeOutline} slot="icon-only" />
								</IonButton>
							</div>
						</div>
					) :
						(
							<div className={styles["long-text-container"]}>
								<div className={styles["long-text-text"]}>

									<IonNote color="medium" className={classNames("ion-text-wrap", styles["text"])}>{note || <span style={{ opacity: 0.8 }}>&lt;no note&gt;</span>}</IonNote>
								</div>
								<div className={styles["long-text-icon"]}>

									<IonButton size="large" shape="round" fill="clear" onClick={() => setIsEditing(true)}>
										<IonIcon slot="icon-only" icon={pencilOutline} />
									</IonButton>
								</div>
							</div>
						)
				}
			</IonLabel>

		</IonItem>
	);
}
