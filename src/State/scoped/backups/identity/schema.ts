import { z } from "zod";
import { type DocBase, DocBaseSchema } from "../../common";
import { LwwSchema } from "../lww";

export const fiatCurrencies = ["USD", "EUR", "CAD", "BRL", "GBP", "CHF", "JPY", "AUD", "NONE"] as const;

const fiatCurrencySchema = z.union(fiatCurrencies.map(c => z.literal(c)))

export type FiatCurrency = z.infer<typeof fiatCurrencySchema>;

const themeSchema = z.union([z.literal("dark"), z.literal("light"), z.literal("system")]);

export type Theme = z.infer<typeof themeSchema>

const CURRENT_SCHEMA_REV = 0;

// identity doc v0
export const IdentityDocV0Schema = DocBaseSchema.safeExtend({
	doc_type: z.literal("doc/shockwallet/identity_"),
	schema_rev: z.literal(0),
	identity_pubkey: z.string().nonempty(),
	favorite_source_id: LwwSchema(z.string().nullable()),

	// preferences
	theme: LwwSchema(themeSchema),
	fiatCurrency: LwwSchema(fiatCurrencySchema)
});
export type IdentityDocV0 = z.infer<typeof IdentityDocV0Schema>;


const identityDocMigrations: Record<number, (doc: any) => any> = {
	/*  */
}

export function migrateIdentityDocToCurrent<T extends DocBase>(doc: T): T | "AHEAD" {
	const currentVersion = doc.schema_rev ?? -1;

	const migrationKeys = Object.keys(identityDocMigrations)
		.map(ver => parseInt(ver))
		.filter(key => CURRENT_SCHEMA_REV >= key && key > currentVersion)
		.sort((a, b) => a - b)

	const migratedDoc = migrationKeys.reduce((doc, versionKey) => {

		return identityDocMigrations[versionKey](doc)
	}, doc)
	return migratedDoc;
}


