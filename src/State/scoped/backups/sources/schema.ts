import { z } from "zod";
import { LwwFlagSchema, LwwSchema } from "../lww";
import { HexDashHexSchema, HexKeySchema, NostrKeyPairSchema } from "@/lib/regex";
import { DocBase, DocBaseSchema, SourceType } from "../../common";
import { HttpBaseSchema, RelayBaseSchema } from "@/lib/urlZod";



const SourceTypeEnum = z.enum(SourceType)

const CURRENT_SCHEMA_REV = 0;

const BridgeUrlSchema = z.union([
	HttpBaseSchema,
	z.literal(""),
	z.null(),
]);


// Version 0
const SourceDocBaseV0Schema = DocBaseSchema.safeExtend({
	doc_type: z.literal("doc/shockwallet/source_"),
	schema_rev: z.literal(0),
	source_id: z.string().nonempty(),
	label: LwwSchema(z.string().nullable()),
	type: SourceTypeEnum,
	deleted: LwwSchema(z.boolean())
})
export const SourceDocV0Schema = z.discriminatedUnion("type", [
	SourceDocBaseV0Schema.safeExtend({
		type: z.literal(SourceTypeEnum.enum.NPROFILE_SOURCE),
		source_id: HexDashHexSchema,
		lpk: HexKeySchema,
		keys: NostrKeyPairSchema,
		relays: z.record(RelayBaseSchema, LwwFlagSchema),
		is_ndebit_discoverable: LwwSchema(z.boolean()),
		admin_token: LwwSchema(z.string().nullable()),
		bridgeUrl: LwwSchema(BridgeUrlSchema)

	}),
	SourceDocBaseV0Schema.safeExtend({
		type: z.literal(SourceTypeEnum.enum.LIGHTNING_ADDRESS_SOURCE),
		source_id: z.email()
	}),
]);

export type SourceDocV0 = z.infer<typeof SourceDocV0Schema>;

type ExtractSourceDocByType<TType extends SourceDocV0["type"]> =
	Extract<SourceDocV0, { type: TType }>;

export type NprofileSourceDocV0 =
	ExtractSourceDocByType<SourceType.NPROFILE_SOURCE>;

export type LightningAddressSourceDocV0 =
	ExtractSourceDocByType<SourceType.LIGHTNING_ADDRESS_SOURCE>;



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


