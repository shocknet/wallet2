import axios from "axios";
import { decodeUrlOrAddress, isUrl } from "./decode";
import { isValidMSats, msatsToSats } from "../units";
import { LnurlPayServiceResponse, LnurlServiceResponse, LnurlWithdrawServiceResponse } from "../types/lnurl";
import { decodeNoffer } from "@/constants";


const TAG_PAY_REQUEST = "payRequest";
const TAG_WITHDRAW_REQUEST = "withdrawRequest";


export const requestLnurlServiceParams = async (lnUrlOrAddress: string, onlyPayReq?: true): Promise<LnurlServiceResponse> => {
	const url = decodeUrlOrAddress(lnUrlOrAddress);
	if (!isUrl(url)) {
		throw new Error("Invalid lnUrlOrAddress");
	}

	const json = await getJson({ url });

	const params = parseLnurlServiceResponse(json, url, onlyPayReq);
	if (!params) {
		throw new Error("Invalid LNURL params");
	}

	return params;
}


const parseLnurlServiceResponse = (
	data: {
		[key: string]: string | number
	},
	url: string,
	onlyPayReq?: true
): LnurlServiceResponse | null => {
	const tag = (data.tag ?? "").toString().trim();
	if (tag !== TAG_PAY_REQUEST && onlyPayReq) return null;

	if (tag === TAG_PAY_REQUEST) {
		return parsePayRequest(data, url);
	} else if (tag === TAG_WITHDRAW_REQUEST) {
		return parseWithdrawRequest(data, url);
	}
	return null;


}

function parsePayRequest(data: Record<string, unknown>, url: string): LnurlPayServiceResponse | null {
	const callback = (data.callback ?? "").toString().trim();
	if (!isUrl(callback)) return null;

	if (!isValidMSats(data.minSendable) || !isValidMSats(data.maxSendable)) return null;
	if (data.minSendable > data.maxSendable) return null;

	const min = msatsToSats(data.minSendable, "ceil");
	const max = msatsToSats(data.maxSendable, "floor");

	let metadata: Array<[string, string]> = [];
	try {
		metadata = JSON.parse(String(data.metadata ?? "")) as Array<[string, string]>;
	} catch {
		// ignore parse error => default to empty
	}

	// Extract optional fields from metadata
	let image = "";
	let description = "";
	let identifier = "";
	for (let i = 0; i < metadata.length; i++) {
		const [type, value] = metadata[i];
		switch (type) {
			case "text/plain":
				description = value;
				break;
			case "text/identifier":
				identifier = value;
				break;
			case "image/png;base64":
			case "image/jpeg;base64":
				image = `data:${type},${value}`;
				break;
		}
	}

	// noffer
	let nofferPointer = undefined
	if (data.nip69 && typeof data.nip69 === "string") {
		nofferPointer = decodeNoffer(data.nip69)
	}

	return {
		tag: "payRequest",
		callback,
		fixed: min === max,
		min,
		max,
		domain: new URL(url).hostname,
		metadata,
		identifier,
		description,
		image,
		commentAllowed: Number(data.commentAllowed ?? 0),
		noffer: nofferPointer
	};
}

function parseWithdrawRequest(data: Record<string, unknown>, url: string): LnurlWithdrawServiceResponse | null {
	const callback = (data.callback ?? "").toString().trim();
	if (!isUrl(callback)) return null;


	if (!data.k1 || typeof data.k1 !== "string") return null;

	if (!isValidMSats(data.minWithdrawable) || !isValidMSats(data.maxWithdrawable)) return null;
	if (data.minWithdrawable > data.maxWithdrawable) return null;

	const min = msatsToSats(data.minWithdrawable, "ceil");
	const max = msatsToSats(data.maxWithdrawable, "floor");


	return {
		tag: "withdrawRequest",
		callback,
		k1: data.k1,
		min,
		max,
		domain: new URL(url).hostname,
		defaultDescription: String(data.defaultDescription ?? ""),
	};
}



export const getJson = async ({
	url,
	params,
}: {
	url: string
	params?: { [key: string]: string | number }
}) => {
	return axios.get(url, { params })
		.then((response) => {
			if (response.data.status === 'ERROR')
				throw new Error(response.data.reason + '')
			return response.data
		}).catch((err) => {
			if (err.response) {
				throw new Error("Lnurl service responded with status: " + err.response.status);
			} else if (err.request) {
				throw new Error("No response from lnurl service");
			} else {
				throw new Error("Unknown error occured when trying to fetch lnurl service");
			}
		});
}