import type {
	SourceView,
} from "@/State/scoped/backups/sources/selectors";
import { getCache, setCache } from "@/lib/cache";
import {
	createNostrInvoice,
	getNostrBtcAddress,
} from "@/Api/helpers";
import type { Satoshi } from "@/lib/types/units";
import { ParsedInvoiceInput } from "@/lib/types/parse";
import type { ReceiveHave } from "./receiveMethodsReducer";

export type ReceiveMethodId =
	| "ln-address"
	| "chain"
	| "noffer"
	| "invoice";

export const RECEIVE_TAB_ORDER = [
	"ln-address",
	"noffer",
	"invoice",
	"chain",
] as const satisfies readonly ReceiveMethodId[];

const CHAIN_CACHE = "r2_chain";

const cacheKey = (sourceId: string, kind: string) => `${kind}_${sourceId}`;

export function fetchRemotePayloads(
	source: SourceView,
	onPatch: (patch: Partial<ReceiveHave>) => void,
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

export async function createInvoiceForSource(
	source: SourceView,
	amount: Satoshi,
	memo: string,
	blind: boolean,
): Promise<ParsedInvoiceInput> {
	return createNostrInvoice(
		{ pubkey: source.lpk, relays: source.relays },
		source.keys,
		amount,
		memo,
		blind,
	);
}
