import { hexToBytes } from "@noble/hashes/utils";
import { getPublicKey } from "nostr-tools";
import { z } from "zod";


export const BITCOIN_ADDRESS_REGEX = /^(bitcoin:)?(bc1[qp][ac-hj-np-z02-9]{8,87}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/;
export const BITCOIN_ADDRESS_BASE58_REGEX = /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/;
export const LN_INVOICE_REGEX = /^(lightning:)?(lnbc|lntb)[0-9a-zA-Z]+$/;
export const LNURL_REGEX = /^(lightning:)?[Ll][Nn][Uu][Rr][Ll][0-9a-zA-Z]+$/;
export const NOFFER_REGEX = /^(lightning:)?[Nn][Oo][Ff][Ff][Ee][Rr][0-9a-zA-Z]+$/;
export const LN_ADDRESS_REGEX = /^(lightning:)?[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;



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
