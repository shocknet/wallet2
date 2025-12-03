import { z } from "zod";
import { canonicalHttpBase, canonicalRelayBase } from "./url";




export const HttpBaseSchema = z
	.string()
	.transform((val, ctx) => {
		const r = canonicalHttpBase(val);
		if (!r.ok) {
			ctx.issues.push({
				code: "custom",
				message: "Not a valid http URL",
				input: val
			})
			return z.NEVER
		} else {
			return r.value;
		}
	});

export type HttpBaseInput = z.input<typeof HttpBaseSchema>;
export type HttpBase = z.output<typeof HttpBaseSchema>;


export const RelayBaseSchema = z
	.string()
	.transform((val, ctx) => {
		const r = canonicalRelayBase(val);
		if (!r.ok) {
			ctx.issues.push({
				code: "custom",
				message: "Not a valid relay URL",
				input: val
			})
		} else {
			return r.value;
		}
	});

export type RelayBaseInput = z.input<typeof RelayBaseSchema>;
export type RelayBase = z.output<typeof RelayBaseSchema>;
