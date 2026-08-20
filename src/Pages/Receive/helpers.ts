import type {
	NprofileView,
	SourceView,
} from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import { getCache, setCache } from "@/lib/cache";
import {
	createNostrInvoice,
	getNostrBtcAddress,
} from "@/Api/helpers";
import type { Satoshi } from "@/lib/types/units";
import { getInvoiceFromLnurlPay } from "@/lib/lnurl/pay";
import { ParsedInvoiceInput } from "@/lib/types/parse";

export function pickDefaultSource(
	sources: SourceView[],
	favoriteSourceId: string | null,
): SourceView {
	const favorite = sources.find((s) => s.sourceId === favoriteSourceId);
	if (favorite) return favorite;
	return sources[0];
}

export type ReceiveMethodId =
	| "ln-address"
	| "chain"
	| "noffer"
	| "invoice";

export type ReceiveMethodMeta = {
	id: Exclude<ReceiveMethodId, "invoice">;
	label: string;
	prefix?: string;
};

export const METHOD_METAS: ReceiveMethodMeta[] = [
	{ id: "ln-address", label: "LN address", prefix: "lightning" },
	{ id: "chain", label: "Chain", prefix: "bitcoin" },
	{ id: "noffer", label: "Noffer" },
];

const CHAIN_CACHE = "r2_chain";

const cacheKey = (sourceId: string, kind: string) => `${kind}_${sourceId}`;

export type SourceReceivePayloads = {
	lnAddress: string | null;
	chain: string | null;
	noffer: string | null;
};

export const emptyPayloads: SourceReceivePayloads = {
	lnAddress: null,
	chain: null,
	noffer: null,
};

export function seedPayloads(source: SourceView): SourceReceivePayloads {
	if (source.type === SourceType.LIGHTNING_ADDRESS_SOURCE) {
		return {
			...emptyPayloads,
			lnAddress: source.sourceId.trim() || null,
		};
	}
	return {
		...emptyPayloads,
		lnAddress: source.vanityName?.trim() || null,
		noffer: source.noffer?.trim() || null,
	};
}


export function fetchRemotePayloads(
	source: NprofileView,
	onPatch: (patch: Partial<SourceReceivePayloads>) => void,
): void {
	const nprofile = { pubkey: source.lpk, relays: source.relays };

	loadCached(cacheKey(source.sourceId, CHAIN_CACHE), () =>
		getNostrBtcAddress(nprofile, source.keys),
	).then((chain) => {
		if (chain) onPatch({ chain });
	});
}

async function loadCached(
	key: string,
	fetcher: () => Promise<string>,
): Promise<string | null> {
	const cached = getCache(key);
	if (typeof cached === "string" && cached.length > 0) {
		return cached;
	}
	try {
		const value = await fetcher();
		setCache(key, value);
		return value;
	} catch {
		return null;
	}
}

export function pickDefaultMethod(
	payloads: SourceReceivePayloads,
): Exclude<ReceiveMethodId, "invoice"> | null {
	if (payloads.lnAddress) return "ln-address";
	if (payloads.noffer) return "noffer";
	if (payloads.chain) return "chain";
	return null;
}

export function payloadForMethod(
	method: Exclude<ReceiveMethodId, "invoice">,
	payloads: SourceReceivePayloads,
): string | null {
	switch (method) {
		case "ln-address":
			return payloads.lnAddress;
		case "chain":
			return payloads.chain;
		case "noffer":
			return payloads.noffer;
	}
}

export async function createInvoiceForSource(
	source: SourceView,
	amount: Satoshi,
	memo: string,
	blind: boolean,
): Promise<ParsedInvoiceInput> {
	if (source.type === SourceType.NPROFILE_SOURCE) {
		return createNostrInvoice(
			{ pubkey: source.lpk, relays: source.relays },
			source.keys,
			amount,
			memo,
			blind,
		);
	}

	return getInvoiceFromLnurlPay({ lnUrlOrAddress: source.sourceId, amountSats: amount });

}
