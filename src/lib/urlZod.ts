import { z } from "zod";
import { normalizeUrl } from "@/utils/normalizeUrl";


function createUrlSchema(
	options: Parameters<typeof normalizeUrl>[1],
) {
	return z.string().transform((input, ctx) => {
		try {
			return normalizeUrl(input, options);
		} catch {
			ctx.issues.push({
				code: "custom",
				message: "Invalid URL",
				input,
			});

			return z.NEVER;
		}
	});
}


export const HttpUrlSchema = createUrlSchema({
	defaultScheme: "https",
	allowedSchemes: ["http", "https"],
});

export const WsUrlSchema = createUrlSchema({
	defaultScheme: "wss",
	allowedSchemes: ["ws", "wss"],
});
