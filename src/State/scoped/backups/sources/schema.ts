import { z } from "zod";
import { LwwFlagSchema, LwwSchema } from "../../../sync/lww";
import { HexDashHexSchema, HexKeySchema, NostrKeyPairSchema } from "@/lib/regex";
import { DocBase, DocBaseSchema } from "../../../sync/docBase";
import { HttpBaseSchema } from "@/lib/urlZod";


export enum SourceType {
	NPROFILE_SOURCE = "NPROFILE_SOURCE",
	LIGHTNING_ADDRESS_SOURCE = "LIGHTNING_ADDRESS_SOURCE", // not a source doc type; persist/parse still recognize old docs
}


const CURRENT_SCHEMA_REV = 0;

const BridgeUrlSchema = z.union([
	HttpBaseSchema,
	z.literal(""),
	z.null(),
]);


export const SourceDocV0Schema = DocBaseSchema.safeExtend({
	doc_type: z.literal("doc/shockwallet/source_"),
	schema_rev: z.literal(0),
	label: LwwSchema(z.string().nullable()),
	deleted: LwwSchema(z.boolean()),
	type: z.literal(SourceType.NPROFILE_SOURCE),
	source_id: HexDashHexSchema,
	lpk: HexKeySchema,
	keys: NostrKeyPairSchema,
	relays: z.record(z.url({ protocol: /^ws?s$/ }), LwwFlagSchema),
	is_ndebit_discoverable: LwwSchema(z.boolean()),
	admin_token: LwwSchema(z.string().nullable()),
	bridgeUrl: LwwSchema(BridgeUrlSchema)

})

export type SourceDocV0 = z.infer<typeof SourceDocV0Schema>;



const sourceDocMigrations: Record<number, (doc: any) => any> = {
	/*  */
}

export function migrateSourceDocToCurrent<T extends DocBase>(doc: T): T | "AHEAD" {
	const currentVersion = doc.schema_rev ?? -1;

	const migrationKeys = Object.keys(sourceDocMigrations)
		.map(ver => parseInt(ver))
		.filter(key => CURRENT_SCHEMA_REV >= key && key > currentVersion)
		.sort((a, b) => a - b)

	const migratedDoc = migrationKeys.reduce((doc, versionKey) => {

		return sourceDocMigrations[versionKey](doc)
	}, doc)
	return migratedDoc;
}
