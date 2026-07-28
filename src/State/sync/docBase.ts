import { z } from "zod";
export const DocBaseSchema = z.looseObject({
	doc_type: z.literal(["doc/shockwallet/identity_", "doc/shockwallet/source_"]),
	schema_rev: z.number().int(),
	created_at: z.number().positive()
});
export type DocBase = z.infer<typeof DocBaseSchema>;




