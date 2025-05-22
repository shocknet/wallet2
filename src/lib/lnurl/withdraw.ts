import { LnurlServiceResponse } from "../types/lnurl";
import { Satoshi } from "../types/units";
import { getJson, requestLnurlServiceParams } from "./get";




interface WithdrawParams {
	lnurl: string;
	invoice: string;
	amountSats: Satoshi;
	description?: string;
	passedParams?: LnurlServiceResponse;
}


export async function requestLnurlWithdraw({
	lnurl,
	invoice,
	amountSats,
	description,
	passedParams
}: WithdrawParams) {
	let params = passedParams;

	if (!params) {
		params = await requestLnurlServiceParams(lnurl);
	}

	if (params.tag !== "withdrawRequest") {
		throw new Error("Not a withdrawRequest LNURL");
	}

	if (amountSats < params.min || amountSats > params.max) {
		throw new Error(
			`Withdrawal amount out of range. min=${params.min}, max=${params.max}`
		);
	}

	const url = new URL(params.callback);
	url.searchParams.set("k1", params.k1);

	url.searchParams.set("pr", invoice);

	if (description) {
		url.searchParams.set("description", description);
	} else if (params.defaultDescription) {
		url.searchParams.set("description", params.defaultDescription);
	}

	return getJson({ url: url.toString() });
}
