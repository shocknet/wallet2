

import { makeKey, payInvoiceReponseToSourceOperation, } from './helpers';
import { getNostrClient } from '@/Api/nostr';
import type { SourceActualOperation, SourceOptimsiticInvoice } from './types';
import { ShowToast } from '@/lib/contexts/useToast';
import type { Satoshi } from '@/lib/types/units';
import { formatSatoshi } from '@/lib/units';
import { InputClassification, ParsedInput, ParsedInvoiceInput } from '@/lib/types/parse';
import { NofferError, OfferPriceType } from '@shocknet/clink-sdk';
import { AppThunk, AppThunkDispatch } from '@/State/store/store';
import { NprofileView, selectSourceViewById } from '../selectors';
import { SourceType } from '@/State/scoped/common';
import { sourcesActions } from '../slice';
import { createDeferred } from '@/lib/deferred';
import { historyFetchSourceRequested } from '@/State/listeners/actions';
import { TaskResult } from '@reduxjs/toolkit';



/*
 * The main function to send a payment
 */
export const sendPaymentThunk = (
	{
		sourceId,
		parsedInput,
		amount,
		note,
		showToast
	}: {
		sourceId: string,
		parsedInput: ParsedInput,
		amount: Satoshi,
		note?: string,
		showToast: ShowToast
	}
): AppThunk<Promise<undefined | NofferError>> => {
	return async (dispatch, getState) => {
		const selectedSource = selectSourceViewById(getState(), sourceId);
		if (!selectedSource || selectedSource.type !== SourceType.NPROFILE_SOURCE) {
			throw new Error("Source not found or is not nprofile");
		}


		const optimisticOperationId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`; // Timestamp + random
		const opKey = makeKey(sourceId, optimisticOperationId);


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

				const deferred = createDeferred<TaskResult<void>>();
				dispatch(historyFetchSourceRequested({ sourceId: selectedSource.sourceId, deferred }));

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
					opKey,
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
					const { classification, value } = identifyBitcoinInput(invoice);
					if (classification !== InputClassification.LN_INVOICE) {
						throw new Error("Invalid invoice from Lnurl/Ln address");
					}
					parsedInvoice = await parseBitcoinInput(value, classification) as ParsedInvoiceInput;
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
					opKey,
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
						const { classification, value } = identifyBitcoinInput(invoice);
						if (classification !== InputClassification.LN_INVOICE) {
							throw new Error("Invalid invoice from noffer");
						}
						parsedInvoice = await parseBitcoinInput(value, classification) as ParsedInvoiceInput;


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
					opKey,
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
