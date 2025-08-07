

import { payInvoiceReponseToSourceOperation, } from './helpers';
import { addNewOperation, addOptimisticOperation, removeOptimisticOperation, updateOptimsticOperation } from "./slice";
import { type AppDispatch } from '../store';
import { getNostrClient } from '@/Api/nostr';
import type { SourceActualOperation, SourceOperationInvoice, SourceOptimsiticInvoice, SourceOptimsiticOnChain } from './types';
import type { SpendFrom } from '@/globalTypes';
import { ShowToast } from '@/lib/contexts/useToast';
import type { Satoshi } from '@/lib/types/units';
import { formatSatoshi } from '@/lib/units';
import { InputClassification, ParsedInput, ParsedInvoiceInput } from '@/lib/types/parse';
import { getSourceInfo } from '../thunks/spendFrom';
import { appCreateAsyncThunk } from '../appCreateAsyncThunk';
import { OfferPriceType } from '@shocknet/clink-sdk';
import { fetchHistoryForSource } from './thunks';


/*
 * The main function to send a payment
 */
export const sendPaymentThunk = appCreateAsyncThunk(
	'paymentHistory/sendPayment',
	async (
		{
			sourceId,
			parsedInput,
			amount,
			note,
			satsPerVByte,
			showToast
		}: {
			sourceId: string,
			parsedInput: ParsedInput,
			amount: Satoshi,
			note?: string,
			satsPerVByte: number,
			showToast: ShowToast
		}, {
			dispatch, getState
		}) => {

		const selectedSource = getState().spendSource.sources[sourceId];
		if (!selectedSource) {
			throw new Error("Source not found");
		}

		const isPubSource = !!selectedSource.pubSource;
		const optimisticOperationId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`; // Timestamp + random


		const payInvoice = async (parsedInvoice: ParsedInvoiceInput, optimisticOperationId: string, optimisticOperation: SourceOptimsiticInvoice) => {
			try {
				if (isPubSource) {
					const res = await (await getNostrClient(selectedSource.pasteField, selectedSource.keys)).PayInvoice({
						invoice: parsedInvoice.data,
						amount: 0,
					})
					if (res.status !== "OK") {
						throw new Error(res.reason);
					}

					handlePaymentSuccess(dispatch, amount, selectedSource, optimisticOperationId, payInvoiceReponseToSourceOperation(res, optimisticOperation), showToast);


					dispatch(fetchHistoryForSource(sourceId));
				} else {
					// lnurl withdraw spend source
					const { requestLnurlWithdraw } = await import("@/lib/lnurl/withdraw");


					await requestLnurlWithdraw({ invoice: parsedInvoice.data, amountSats: amount, lnurl: selectedSource.pasteField });

					const operation: SourceOperationInvoice = {
						sourceId: sourceId,
						amount: amount,
						operationId: `lnurl-withdraw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
						type: "LNURL_WITHDRAW",
						invoice: parsedInvoice.data,
						invoiceMemo: parsedInvoice.memo,
						memo: optimisticOperation.memo,
						invoiceSource: optimisticOperation.invoiceSource,
						inbound: false,
						internal: false,
						paidAtUnix: Date.now(),
					}

					handlePaymentSuccess(dispatch, amount, selectedSource, optimisticOperationId, operation, showToast);
				}
			} catch (err) {
				handlePaymentError(err, dispatch, selectedSource.id, optimisticOperationId, showToast);
			}
		}

		switch (parsedInput.type) {
			case (InputClassification.LN_INVOICE): {
				const optimsticOperation: SourceOptimsiticInvoice = {
					optimistic: true,
					sourceId: sourceId,
					operationId: optimisticOperationId,
					amount: amount,
					paidAtUnix: Date.now(),

					type: "INVOICE",
					inbound: false,
					invoice: parsedInput.data,
					invoiceMemo: parsedInput.memo,
					memo: note,
				};
				dispatch(addOptimisticOperation({ sourceId: selectedSource.id, operation: optimsticOperation }));

				// We do not wait for the payInvoice to finish
				payInvoice(parsedInput, optimisticOperationId, optimsticOperation);
				return;
			}
			case InputClassification.LN_ADDRESS:
			case InputClassification.LNURL_PAY: {

				// Get the invoice
				let parsedInvoice: ParsedInvoiceInput;
				try {
					let invoice = "";
					if (parsedInput.noffer && isPubSource) {
						const { createNofferInvoice } = await import("@/lib/noffer");
						const nofferRes = await createNofferInvoice(parsedInput.noffer, selectedSource.keys, amount);
						if (typeof nofferRes !== "string") {
							throw new Error(nofferRes.error);
						}
						invoice = nofferRes;
					} else {
						const { getInvoiceForLnurlPay } = await import("@/lib/lnurl/pay");
						const { pr } = await getInvoiceForLnurlPay({
							lnUrlOrAddress: parsedInput.data,
							amountSats: amount,
						});
						invoice = pr;
					}
					const { identifyBitcoinInput, parseBitcoinInput } = await import("@/lib/parse");
					const classification = identifyBitcoinInput(invoice);
					if (classification !== InputClassification.LN_INVOICE) {
						throw new Error("Invalid invoice from Lnurl/Ln address");
					}
					parsedInvoice = await parseBitcoinInput(invoice, classification) as ParsedInvoiceInput;
				} catch (err) {
					showToast({
						message: `Could not get an invoice from ${parsedInput.type}`,
						color: "danger"
					})
					console.error(err);
					return;
				}


				const optimsticOperation: SourceOptimsiticInvoice = {
					optimistic: true,
					sourceId,
					operationId: optimisticOperationId,
					amount: amount,
					paidAtUnix: Date.now(),

					type: "INVOICE",
					inbound: false,
					invoice: parsedInvoice.data,
					invoiceMemo: parsedInvoice.memo,
					invoiceSource: parsedInput,
					memo: note,
				};
				dispatch(addOptimisticOperation({ sourceId: selectedSource.id, operation: optimsticOperation }));


				payInvoice(parsedInvoice, optimisticOperationId, optimsticOperation);
				return;
			}
			case InputClassification.NOFFER: {


				let parsedInvoice: ParsedInvoiceInput;
				if (parsedInput.priceType !== OfferPriceType.Spontaneous) {
					if (!parsedInput.invoiceData) {
						throw new Error("No invoice data");
					}
					// For Fixed and Variable, we already have the invoice from the parsing step.
					parsedInvoice = parsedInput.invoiceData;
				} else {
					try {
						const { createNofferInvoice } = await import("@/lib/noffer")
						const invoice = await createNofferInvoice(parsedInput.noffer, selectedSource.keys, amount);
						if (typeof invoice !== "string") {
							return invoice;
						}
						const { identifyBitcoinInput, parseBitcoinInput } = await import("@/lib/parse");
						const classification = identifyBitcoinInput(invoice);
						if (classification !== InputClassification.LN_INVOICE) {
							throw new Error("Invalid invoice from noffer");
						}
						parsedInvoice = await parseBitcoinInput(invoice, classification) as ParsedInvoiceInput;


					} catch (err) {
						showToast({
							message: "Payment failed",
							color: "danger"
						});
						console.error(err);
						return;
					}
				}

				const optimsticOperation: SourceOptimsiticInvoice = {
					optimistic: true,
					sourceId,
					operationId: optimisticOperationId,
					amount: amount,
					paidAtUnix: Date.now(),

					type: "INVOICE",
					inbound: false,
					invoice: parsedInvoice.data,
					invoiceMemo: parsedInvoice.memo,
					invoiceSource: parsedInput,
					memo: note,
				};
				dispatch(addOptimisticOperation({ sourceId: selectedSource.id, operation: optimsticOperation }));


				payInvoice(parsedInvoice, optimisticOperationId, optimsticOperation);
				return;
			}
			case InputClassification.BITCOIN_ADDRESS: {



				const optimisticOperation: SourceOptimsiticOnChain = {
					optimistic: true,
					sourceId,
					operationId: optimisticOperationId,
					amount: amount,
					paidAtUnix: Date.now(),

					status: "broadcasting",
					type: "ON-CHAIN",
					inbound: false,
					address: parsedInput.data,
					memo: note,
				};

				dispatch(addOptimisticOperation({ sourceId: selectedSource.id, operation: optimisticOperation }));

				(async () => {
					try {
						const payRes = await (await getNostrClient(selectedSource.pasteField, selectedSource.keys)).PayAddress({
							address: parsedInput.data,
							amoutSats: amount,
							satsPerVByte
						})

						if (payRes.status !== "OK") {
							throw new Error(payRes.reason);
						}

						const isInternal = payRes.network_fee === 0;
						let updatedOptimsticOperation: SourceOptimsiticOnChain;
						if (isInternal) {
							updatedOptimsticOperation = {
								...optimisticOperation,
								operationId: payRes.operation_id,
								internal: true,
								status: "success",
								serviceFee: payRes.service_fee,
							}
						} else {
							updatedOptimsticOperation = {
								...optimisticOperation,
								operationId: payRes.operation_id,
								internal: false,
								status: "confirming",
								networkFee: payRes.network_fee,
								serviceFee: payRes.service_fee,
								txHash: payRes.txId,
							}
						}
						dispatch(updateOptimsticOperation({ sourceId: selectedSource.id, operation: updatedOptimsticOperation, oldOperationId: optimisticOperationId }));
						dispatch(getSourceInfo(sourceId));

					} catch (err: any) {
						handlePaymentError(err, dispatch, selectedSource.id, optimisticOperationId, showToast);
					}
				})();
			}
		}
	});

const handlePaymentError = (
	err: any,
	dispatch: AppDispatch,
	sourceId: string,
	optimsticOpId: string,
	showToast: ShowToast
) => {
	console.error(err);
	dispatch(removeOptimisticOperation({ sourceId, operationId: optimsticOpId }));
	showToast({
		message: "Payment failed",
		color: "danger"
	});
}

const handlePaymentSuccess = (
	dispatch: AppDispatch,
	amount: Satoshi,
	selectedSource: SpendFrom,
	optimisticOpId: string,
	operation: SourceActualOperation,
	showToast: ShowToast
) => {
	dispatch(removeOptimisticOperation({ sourceId: selectedSource.id, operationId: optimisticOpId }));
	dispatch(addNewOperation({ sourceId: selectedSource.id, operation }));
	showToast({
		message: `Payment of ${formatSatoshi(amount)} sats sent`,
		color: "success",
	});
}
