

import { makeKey, payInvoiceReponseToSourceOperation, } from './helpers';
import { getNostrClient } from '@/Api/nostr';
import type { SourceActualOperation, SourceOptimsiticInvoice, SourceOptimsiticOnChain } from './types';
import { ShowToast } from '@/lib/contexts/useToast';
import type { Satoshi } from '@/lib/types/units';
import { formatSatoshi } from '@/lib/units';
import { InputClassification, ParsedInput, ParsedInvoiceInput } from '@/lib/types/parse';
import { NofferError, OfferPriceType } from '@shocknet/clink-sdk';
import { fetchHistoryForSource } from './thunks';

import { refreshSourceInfo } from '../metadata/thunks';
import { AppThunk, AppThunkDispatch } from '@/State/store/store';
import { NprofileView, selectSourceViewById } from '../selectors';
import { SourceType } from '@/State/scoped/common';
import { sourcesActions } from '../slice';



/*
 * The main function to send a payment
 */
export const sendPaymentThunk = (
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
	}
): AppThunk<Promise<undefined | NofferError>> => {
	return async (dispatch, getState) => {
		const selectedSource = selectSourceViewById(getState(), sourceId);
		if (!selectedSource || selectedSource.type !== SourceType.NPROFILE_SOURCE) {
			throw new Error("Source not found or is not nprofile");
		}


		const optimisticOperationId = makeKey(selectedSource.sourceId, `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`); // Timestamp + random


		const payInvoice = async (parsedInvoice: ParsedInvoiceInput, optimisticOperationId: string, optimisticOperation: SourceOptimsiticInvoice) => {
			try {

				const res = await (await getNostrClient({ pubkey: selectedSource.lpk, relays: selectedSource.relays }, selectedSource.keys)).PayInvoice({
					invoice: parsedInvoice.data,
					amount: 0,
				})
				if (res.status !== "OK") {
					throw new Error(res.reason);
				}

				handlePaymentSuccess(dispatch, amount, selectedSource, optimisticOperationId, payInvoiceReponseToSourceOperation(res, optimisticOperation), showToast);


				dispatch(fetchHistoryForSource(selectedSource));

			} catch (err) {
				handlePaymentError(err, dispatch, selectedSource.sourceId, optimisticOperationId, showToast);
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
				dispatch(sourcesActions.addOptimistic({ sourceId: selectedSource.sourceId, operation: optimsticOperation }));

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
					if (parsedInput.noffer) {
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
				dispatch(sourcesActions.addOptimistic({ sourceId: selectedSource.sourceId, operation: optimsticOperation }));


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
				dispatch(sourcesActions.addOptimistic({ sourceId: selectedSource.sourceId, operation: optimsticOperation }));


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

				dispatch(sourcesActions.addOptimistic({ sourceId: selectedSource.sourceId, operation: optimisticOperation }));

				(async () => {
					try {
						const payRes = await (await getNostrClient({ pubkey: selectedSource.lpk, relays: selectedSource.relays }, selectedSource.keys)).PayAddress({
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
						dispatch(sourcesActions.replaceOptimistic({ sourceId: selectedSource.sourceId, operation: updatedOptimsticOperation, oldOperationId: optimisticOperationId }));
						dispatch(refreshSourceInfo(selectedSource));

					} catch (err: any) {
						handlePaymentError(err, dispatch, selectedSource.sourceId, optimisticOperationId, showToast);
					}
				})();
			}
		}
	}
}

const handlePaymentError = (
	err: any,
	dispatch: AppThunkDispatch,
	sourceId: string,
	optimsticOpId: string,
	showToast: ShowToast
) => {
	console.error(err);
	dispatch(sourcesActions.removeOptimistic({ sourceId, operationId: optimsticOpId }));
	showToast({
		message: "Payment failed",
		color: "danger"
	});
}

const handlePaymentSuccess = (
	dispatch: AppThunkDispatch,
	amount: Satoshi,
	selectedSource: NprofileView,
	optimisticOpId: string,
	operation: SourceActualOperation,
	showToast: ShowToast
) => {
	dispatch(sourcesActions.replaceOptimistic({ sourceId: selectedSource.sourceId, oldOperationId: optimisticOpId, operation }));
	showToast({
		message: `Payment of ${formatSatoshi(amount)} sats sent`,
		color: "success",
	});
}
