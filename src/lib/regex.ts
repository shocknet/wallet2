import { hexToBytes } from "@noble/hashes/utils";
import { getPublicKey, utils } from "nostr-tools";
import { z } from "zod";





export const BECH32_DATA_CLASS = "[02-9ac-hj-np-z]";
export const BECH32_DATA = "[02-9ac-hj-np-z]";

const LIGHTNING_SCHEME = "(?:[Ll][Ii][Gg][Hh][Tt][Nn][Ii][Nn][Gg]:)?";
const BITCOIN_SCHEME = "(?:[Bb][Ii][Tt][Cc][Oo][Ii][Nn]:)?";
const NOSTR_SCHEME = "(?:[Nn][Oo][Ss][Tt][Rr]:)?";

// segwit btc
export const BITCOIN_ADDRESS_REGEX = new RegExp(
	`^${BITCOIN_SCHEME}(bc1[qp]${BECH32_DATA}{8,87})$`,
	"i"
);

// base58 btc, case sensitive
export const BITCOIN_ADDRESS_BASE58_REGEX = new RegExp(
	`^${BITCOIN_SCHEME}([13][1-9A-HJ-NP-Za-km-z]{25,34})$`
);

export const LNURL_REGEX = new RegExp(
	`^${LIGHTNING_SCHEME}(lnurl1${BECH32_DATA}+)`,
	"i"
);

export const LN_INVOICE_REGEX = new RegExp(
	`^${LIGHTNING_SCHEME}((?:lnbc|lnsb|lntb|lnbcrt)[0-9]*[munp]?1${BECH32_DATA}+)`,
	"i"
);

export const NOFFER_REGEX = new RegExp(
	`^${LIGHTNING_SCHEME}(noffer1${BECH32_DATA}+)`,
	"i"
);

export const NPROFILE_WITH_TOKEN_REGEX = new RegExp(
	`^${NOSTR_SCHEME}(nprofile1${BECH32_DATA}+)(?::([A-Za-z0-9._~-]+))?$`,
	"i"
);

export const RelayUrlSchema = z.url({ protocol: /^wss?$/ }).transform((val, ctx) => {
	try {
		return utils.normalizeURL(val)
	} catch {
		ctx.issues.push({
			code: "custom",
			message: "Not a valid relay url",
			input: val
		})
	}
})


export const LN_ADDRESS_REGEX = new RegExp(
	`^${LIGHTNING_SCHEME}([A-Za-z0-9._%+-]+@(?:(?:xn--|[A-Za-z0-9])[A-Za-z0-9-]{0,61}[A-Za-z0-9]\\.)+[A-Za-z]{2,63})$`,
	"i"
);

export const HexKeySchema = z
	.hex()
	.length(64)
	.toLowerCase();

export type HexKey = z.infer<typeof HexKeySchema>;

// hexkey-hexkey
// Used for nprofile sources ids
export const HexDashHexSchema = z
	.string()
	.nonempty()
	.check(ctx => {
		const [a, b] = ctx.value.split("-");
		if (!a || !b) {
			ctx.issues.push({ code: "custom", message: "expected hex-hex", continue: false, input: ctx.value });
		}
		if (!HexKeySchema.safeParse(a).success || !HexKeySchema.safeParse(b).success) {
			ctx.issues.push({ code: "custom", message: "invalid hex key(s)", input: ctx.value });
		}
	});
export type HexDashHex = z.infer<typeof HexDashHexSchema>;


export const NostrKeyPairSchema = z.object({
	privateKey: HexKeySchema,
	publicKey: HexKeySchema
}).check(async (ctx) => {
	try {
		const publicKey = getPublicKey(hexToBytes(ctx.value.privateKey))
		if (publicKey !== ctx.value.publicKey) {
			ctx.issues.push({ code: "custom", message: "Non matching key pair", input: ctx.value.publicKey })
		}
	} catch {
		ctx.issues.push({ code: "custom", message: "Invalid key", input: ctx.value.publicKey })
	}
})

export type NostrKeyPair = z.infer<typeof NostrKeyPairSchema>;

export const LnurlSchema = z
	.string()
	.nonempty()
	.toLowerCase()
	.regex(/^lnurl1[02-9ac-hj-np-z]{6,}$/)
