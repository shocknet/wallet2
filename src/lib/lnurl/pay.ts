import { parseAs } from "../parse";
import { LnurlServiceResponse } from "../types/lnurl";
import { InputClassification, type ParsedInvoiceInput } from "../types/parse";
import { Satoshi } from "../types/units";
import { getJson, requestLnurlServiceParams } from "./get";

interface GetInvoiceParams {
	lnUrlOrAddress: string;
	amountSats: Satoshi;
	passedParams?: LnurlServiceResponse;
}

export async function getInvoiceFromLnurlPay({
	lnUrlOrAddress,
	amountSats,
	passedParams,
}: GetInvoiceParams): Promise<ParsedInvoiceInput> {
	let params = passedParams;
	if (!params) {
		params = await requestLnurlServiceParams(lnUrlOrAddress);
	}

	if (params.tag !== "payRequest") {
		throw new Error("Not a payRequest LNURL");
	}

	if (amountSats < params.min || amountSats > params.max) {
		throw new Error(
			`Amount out of range. min=${params.min}, max=${params.max}`
		);
	}

	const msats = amountSats * 1000;

	const url = new URL(params.callback);
	url.searchParams.set("amount", msats.toString());

	const data = await getJson({ url: url.toString() });
	const { pr } = data;

	if (!pr || typeof pr !== "string") {
		throw new Error("Missing 'pr' field in LNURL pay response");
	}

	return parseAs(pr, InputClassification.LN_INVOICE, amountSats);
}
