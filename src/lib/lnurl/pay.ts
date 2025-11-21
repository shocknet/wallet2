import { LnurlServiceResponse } from "../types/lnurl";
import { Satoshi } from "../types/units";
import { getJson, requestLnurlServiceParams } from "./get";


export interface LnurlPayInvoiceResponse {
	pr: string;        // BOLT 11 invoice
	successAction?: any;
	disposable?: boolean;
}

interface GetInvoiceParams {
	lnUrlOrAddress: string;
	amountSats: Satoshi;
	passedParams?: LnurlServiceResponse;
}

export async function getInvoiceForLnurlPay({
	lnUrlOrAddress,
	amountSats,
	passedParams,
}: GetInvoiceParams): Promise<LnurlPayInvoiceResponse> {
	let params = passedParams;
	if (!params) {
		params = await requestLnurlServiceParams(lnUrlOrAddress);
	}

	if (params.tag !== "payRequest") {
		throw new Error("Not a payRequest LNURL");
	}

	// 2. Check amount within min/max
	if (amountSats < params.min || amountSats > params.max) {
		throw new Error(
			`Amount out of range. min=${params.min}, max=${params.max}`
		);
	}

	// 3. Convert to msats
	const msats = amountSats * 1000;


	const url = new URL(params.callback);
	url.searchParams.set("amount", msats.toString());


	// 5. Call LNURL pay endpoint → returns { pr: <invoice>, successAction?, ... }
	const data = await getJson({ url: url.toString() });

	if (!data.pr) {
		throw new Error("Missing 'pr' field in LNURL pay response");
	}

	return data;
}
