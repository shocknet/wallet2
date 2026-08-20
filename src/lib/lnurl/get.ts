import axios from "axios";
import { decodeUrlOrAddress, isUrl } from "./decode";
import { isValidMSats, msatsToSats } from "../units";
import { LnurlPayMetadataArray, LnurlPayServiceResponse, LnurlServiceResponse, LnurlWithdrawServiceResponse } from "../types/lnurl";
import { OfferPointer } from "@shocknet/clink-sdk";
import { decodeNoffer } from "../decodeNoffer";


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

function isMetadataArray(metadata: unknown): metadata is LnurlPayMetadataArray {
	return Array.isArray(metadata) && metadata.every(entry => Array.isArray(entry) && entry.length >= 2 && typeof entry[0] === "string");
}

function parsePayRequest(data: Record<string, unknown>, url: string): LnurlPayServiceResponse | null {
	const callback = (data.callback ?? "").toString().trim();
	if (!isUrl(callback)) return null;

	if (!isValidMSats(data.minSendable) || !isValidMSats(data.maxSendable)) return null;
	if (data.minSendable > data.maxSendable) return null;

	const min = msatsToSats(data.minSendable, "ceil");
	const max = msatsToSats(data.maxSendable, "floor");

	if (!data.metadata || typeof data.metadata !== "string") return null;

	let parsedMetadata: unknown;
	try {
		parsedMetadata = JSON.parse(data.metadata);
	} catch {
		return null;
	}

	if (!isMetadataArray(parsedMetadata)) return null;

	let image: string | undefined;
	let description: string | undefined;
	let identifier: string | undefined;
	let longDescription: string | undefined;


	for (const entry of parsedMetadata) {
		const [type, ...values] = entry;
		const data = values[0];
		switch (type) {
			case "text/plain":
				if (typeof data !== "string") continue;
				description = data
				break;
			case "text/identifier":
				if (typeof data !== "string") continue;
				identifier = data;
				break;
			case "text/long-desc":
				if (typeof data !== "string") continue;
				longDescription = data;
				break;
			case "image/png;base64":
			case "image/jpeg;base64":
				if (typeof data !== "string") continue;
				image = `data:${type},${data}`;
				break;
		}
	}

	if (description === undefined) return null; // text/plain is mandatory by the spec


	// noffer
	let nofferPointer: OfferPointer | undefined;
	if (data.nip69 && typeof data.nip69 === "string") {
		try {
			nofferPointer = decodeNoffer(data.nip69)
		} catch {
			/* ignore parse error */
		}
	}

	return {
		tag: "payRequest",
		callback,
		fixed: min === max,
		min,
		max,
		domain: new URL(url).hostname,
		metadata: parsedMetadata,
		longDescription,
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
