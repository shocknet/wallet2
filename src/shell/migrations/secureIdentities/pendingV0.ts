import z from "zod";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { IdentityType } from "@/State/identitiesRegistry/types";
import type { IdentityV0 } from "./identityV0";
import { HexKeySchema } from "@/lib/regex";

export const SECURE_IDENTITIES_PENDING_V0_KEY =
	"__secure_identities_pending_v0_v1__";

const identityBaseSchema = z.object({
	pubkey: HexKeySchema,
	label: z.string(),
	createdAt: z.number(),
	lastUsedAt: z.number().optional(),
});

const identityV0Schema: z.ZodType<IdentityV0> = z.union([
	identityBaseSchema.extend({
		type: z.literal(IdentityType.LOCAL_KEY),
		privkey: HexKeySchema,
		relays: z.array(z.string()),
	}),
	identityBaseSchema.extend({
		type: z.literal(IdentityType.SANCTUM),
		accessToken: z.string().min(1),
	}),
	identityBaseSchema.extend({
		type: z.literal(IdentityType.NIP07),
		relays: z.array(z.string()),
	}),
]);

const pendingV0BagSchema = z.array(identityV0Schema);

export async function readPendingV0Identities(): Promise<IdentityV0[]> {
	const raw = await IonicStorageAdapter.getItem(SECURE_IDENTITIES_PENDING_V0_KEY);
	if (!raw) {
		return [];
	}

	try {
		const parsed = pendingV0BagSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : [];
	} catch {
		return [];
	}
}

export async function writePendingV0Identities(
	identities: IdentityV0[],
): Promise<void> {
	if (identities.length === 0) {
		await IonicStorageAdapter.removeItem(SECURE_IDENTITIES_PENDING_V0_KEY);
		return;
	}

	await IonicStorageAdapter.setItem(
		SECURE_IDENTITIES_PENDING_V0_KEY,
		JSON.stringify(identities),
	);
}

export async function removePendingV0Identity(pubkey: string): Promise<void> {
	const current = await readPendingV0Identities();
	await writePendingV0Identities(
		current.filter((identity) => identity.pubkey !== pubkey),
	);
}
