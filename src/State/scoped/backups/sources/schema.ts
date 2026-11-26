import { z } from "zod";
import { LwwFlagSchema, LwwSchema, mergeFlagLww } from "../../../sync/lww";
import { HexDashHexSchema, HexKeySchema, NostrKeyPairSchema } from "@/lib/regex";
import { DocBase, DocBaseSchema } from "../../../sync/docBase";
import { HttpUrlSchema, WsUrlSchema } from "@/lib/urlZod";
import dLogger from "@/Api/helpers/debugLog";


export enum SourceType {
	NPROFILE_SOURCE = "NPROFILE_SOURCE",
	LIGHTNING_ADDRESS_SOURCE = "LIGHTNING_ADDRESS_SOURCE", // not a source doc type; persist/parse still recognize old docs
}


const CURRENT_SCHEMA_REV = 0;

export const BridgeUrlSchema = z.union([
	HttpUrlSchema,
	z.literal(""),
	z.null(),
]);


export const RelayMapSchema = z
	.record(z.string(), LwwFlagSchema)
	.transform((relays) => {
		const log = dLogger.withContext({
			component: "RelayMapSchema",
		});
		const result: Record<string, z.infer<typeof LwwFlagSchema>> =
			Object.create(null);

		for (const [rawUrl, entry] of Object.entries(relays)) {
			const parsed = WsUrlSchema.safeParse(rawUrl);

			if (!parsed.success) {
				log.warn(`Invalid relay url: ${rawUrl}`);
				continue;
			}

			const url = parsed.data;
			const existing = result[url];

			result[url] =
				existing === undefined
					? entry
					: mergeFlagLww(existing, entry);
		}

		return result;
	});

export const SourceDocV0Schema = DocBaseSchema.safeExtend({
	doc_type: z.literal("doc/shockwallet/source_"),
	schema_rev: z.literal(0),
	label: LwwSchema(z.string().nullable()),
	deleted: LwwSchema(z.boolean()),
	type: z.literal(SourceType.NPROFILE_SOURCE),
	source_id: HexDashHexSchema,
	lpk: HexKeySchema,
	keys: NostrKeyPairSchema,
	relays: RelayMapSchema,
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
