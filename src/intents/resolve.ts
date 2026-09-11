import {
	identifyBitcoinInput,
	parseAs,
	parseBitcoinInput,
} from "@/lib/parse";
import { InputClassification, type ParsedInput, type ParsedNprofileInput } from "@/lib/types/parse";
import type { AddSourceIntent, AppIntentInput } from "./types";
import type { AppThunk } from "@/State/store/store";
import { isSendParsedInput } from "@/Pages/Send/nav";
import { enqueueAppIntent } from "./enqueue";

type PayloadRead =
	| { status: "unrecognized" }
	| { status: "unusable"; type: InputClassification }
	| { status: "intent"; intent: AppIntentInput };

export type DeepLinkResult = {
	stripAddSourceQuery: boolean;
};

export function parseAbsoluteUrl(raw: string): URL | null {
	try {
		return new URL(raw.trim());
	} catch {
		return null;
	}
}

/** Path of an associated-domain URL (`*.app`), or null. */
export function pathAfterAppHost(raw: string): string | null {
	const url = parseAbsoluteUrl(raw);
	if (!url || !url.hostname.endsWith(".app")) return null;

	const path = `${url.pathname}${url.search}`;
	if (path === "" || path === "/") return null;
	return path;
}

export function addSourceQueryExtras(
	nprofile: ParsedNprofileInput,
	params: URLSearchParams,
): Pick<AddSourceIntent, "integrationData" | "invitationToken"> {
	if (nprofile.adminEnrollToken) return {};

	const token = params.get("token");
	const lnAddress = params.get("lnAddress");
	if (token && lnAddress) {
		return { integrationData: { token, lnAddress } };
	}

	const invitationToken = params.get("inviteToken");
	if (invitationToken) return { invitationToken };

	return {};
}

async function addSourceUrlIntent(raw: string): Promise<AppIntentInput | null> {
	const url = parseAbsoluteUrl(raw);
	const sourceString = url?.searchParams.get("addSource");
	if (!url || !sourceString) return null;

	const nprofile = await parseAs(sourceString, InputClassification.NPROFILE);
	return {
		kind: "add-source",
		nprofile,
		fromUrl: true,
		...addSourceQueryExtras(nprofile, url.searchParams),
	};
}

export function intentFromParsed(parsed: ParsedInput): AppIntentInput | null {
	if (parsed.type === InputClassification.LNURL_WITHDRAW) {
		return { kind: "sweep", parsed };
	}
	if (parsed.type === InputClassification.NPROFILE) {
		return { kind: "add-source", nprofile: parsed };
	}
	if (isSendParsedInput(parsed)) {
		return { kind: "send", parsed };
	}
	return null;
}

async function readPayload(raw: string): Promise<PayloadRead> {
	const { classification, value } = identifyBitcoinInput(raw);
	if (classification === InputClassification.UNKNOWN) {
		return { status: "unrecognized" };
	}

	const parsed = await parseBitcoinInput(value, classification);
	const intent = intentFromParsed(parsed);
	if (!intent) return { status: "unusable", type: parsed.type };
	return { status: "intent", intent };
}

/** Clipboard, QR, paste. Throws if the string is not a usable intent. */
export async function parseAppIntentInput(raw: string): Promise<AppIntentInput> {
	const fromUrl = await addSourceUrlIntent(raw);
	if (fromUrl) return fromUrl;

	const payload = await readPayload(raw);
	if (payload.status === "intent") return payload.intent;
	if (payload.status === "unusable") {
		throw new Error(`${payload.type} is not usable`);
	}
	throw new Error("Unknown input");
}

export const resolveAppIntent = (raw: string): AppThunk<Promise<void>> => async (dispatch) => {
	dispatch(enqueueAppIntent(await parseAppIntentInput(raw)));
};

/** Web `window.location.href`: only `?addSource=` on the current page. */
export const resolveLocationHref = (raw: string): AppThunk<Promise<DeepLinkResult>> => async (dispatch) => {
	const intent = await addSourceUrlIntent(raw);
	if (!intent) return { stripAddSourceQuery: false };
	dispatch(enqueueAppIntent(intent));
	return { stripAddSourceQuery: true };
};

/** Native `appUrlOpen`: add-source URL, then payload, then associated-domain path. */
export const resolveAppUrlOpen = (raw: string): AppThunk<Promise<DeepLinkResult>> => async (dispatch) => {
	const fromUrl = await addSourceUrlIntent(raw);
	if (fromUrl) {
		dispatch(enqueueAppIntent(fromUrl));
		return { stripAddSourceQuery: true };
	}

	const payload = await readPayload(raw);
	if (payload.status === "intent") {
		dispatch(enqueueAppIntent(payload.intent));
		return { stripAddSourceQuery: false };
	}

	const path = pathAfterAppHost(raw);
	if (path) {
		dispatch(enqueueAppIntent({ kind: "navigate", path }));
	}
	return { stripAddSourceQuery: false };
};
