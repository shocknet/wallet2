import { z } from "zod";
import { LwwFlagSchema, LwwSchema } from "../lww";
import { HexDashHexSchema, HexKeySchema, LnurlSchema, NostrKeyPairSchema } from "@/lib/regex";
import { DocBase, DocBaseSchema, SourceType } from "../../common";



const SourceTypeEnum = z.enum(SourceType)

const CURRENT_SCHEMA_REV = 0;




// Version 0
const SourceDocBaseV0Schema = DocBaseSchema.safeExtend({
	doc_type: z.literal("doc/shockwallet/source"),
	schema_rev: z.literal(0),
	source_id: z.string().nonempty(),
	label: LwwSchema(z.string()),
	type: SourceTypeEnum,
	deleted: LwwSchema(z.boolean())
})
export const SourceDocV0Schema = z.discriminatedUnion("type", [
	SourceDocBaseV0Schema.safeExtend({
		type: z.literal(SourceTypeEnum.enum.NPROFILE_SOURCE),
		source_id: HexDashHexSchema,
		lpk: HexKeySchema,
		keys: NostrKeyPairSchema,
		relays: z.record(z.url({ protocol: /^ws?s$/ }), LwwFlagSchema),
		is_ndebit_discoverable: LwwSchema(z.boolean()),
		admin_token: LwwSchema(z.string().nullable()),

	}),
	SourceDocBaseV0Schema.safeExtend({
		type: z.literal(SourceTypeEnum.enum.LIGHTNING_ADDRESS_SOURCE),
		source_id: z.email()
	}),
	SourceDocBaseV0Schema.safeExtend({
		type: z.literal(SourceTypeEnum.enum.LNURL_P_SOURCE),
		source_id: LnurlSchema
	}),
]);

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


