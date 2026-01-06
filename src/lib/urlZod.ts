import { z } from "zod";
import { normalizeHttpUrl, normalizeWsUrl } from "./url";




export const HttpBaseSchema = z
	.string()
	.transform((val, ctx) => {
		try {
			const r = normalizeHttpUrl(val);
			return r;
		} catch {
			ctx.issues.push({
				code: "custom",
				message: "Not a valid http URL",
				input: val
			})
			return z.NEVER;
		}
	});

export type HttpBaseInput = z.input<typeof HttpBaseSchema>;
export type HttpBase = z.output<typeof HttpBaseSchema>;


export const RelayBaseSchema = z
	.string()
	.transform((val, ctx) => {
		try {
			const r = normalizeWsUrl(val);
			return r;
		} catch {
			ctx.issues.push({
				code: "custom",
				message: "Not a valid relay URL",
				input: val
			})
			return z.NEVER;
		}
	});

export type RelayBaseInput = z.input<typeof RelayBaseSchema>;
export type RelayBase = z.output<typeof RelayBaseSchema>;
