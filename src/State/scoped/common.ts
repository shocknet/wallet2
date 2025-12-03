import { z } from "zod";
export const DocBaseSchema = z.looseObject({
	doc_type: z.literal(["doc/shockwallet/identity_", "doc/shockwallet/source_"]),
	schema_rev: z.number().int(),
	created_at: z.number().positive()
});
export type DocBase = z.infer<typeof DocBaseSchema>;

export type SourceEventBase = {
	sourceId: string;
	by: string;          // device/user id for LWW clocks
	now: number;         // ms epoch
	type: SourceType
};



export enum SourceType {
	NPROFILE_SOURCE = "NPROFILE_SOURCE",
	LIGHTNING_ADDRESS_SOURCE = "LIGHTNING_ADDRESS_SOURCE",
}
