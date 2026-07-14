import z from "zod";
import { HexKeySchema } from "@/lib/regex";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import type { SourceToMigrate } from "./legacySourceSchema";

export const DEVICE_TO_IDENTITIES_PENDING_LOCAL_SOURCES_KEY =
	"__device_to_identities_pending_local_sources_v1__";

const pendingLocalSourceSchema = z.object({
	slice: z.enum(["payTo", "spendFrom"]),
	id: z.string().min(1),
	pasteField: z.string().min(1),
	label: z.string().optional(),
	keys: z.object({
		privateKey: HexKeySchema,
		publicKey: HexKeySchema,
	}),
	vanityName: z.string().optional(),
	bridgeUrl: z.string().optional(),
	isNdebitDiscoverable: z.boolean().optional(),
	adminToken: z.string().optional(),
});

const pendingLocalSourcesSchema = z.array(pendingLocalSourceSchema);

export async function readPendingLocalSourcesJournal(): Promise<SourceToMigrate[]> {
	const raw = await IonicStorageAdapter.getItem(
		DEVICE_TO_IDENTITIES_PENDING_LOCAL_SOURCES_KEY,
	);
	if (!raw) {
		return [];
	}

	try {
		const parsed = pendingLocalSourcesSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : [];
	} catch {
		return [];
	}
}

export async function writePendingLocalSourcesJournal(
	sources: SourceToMigrate[],
): Promise<void> {
	if (sources.length === 0) {
		await clearPendingLocalSourcesJournal();
		return;
	}

	await IonicStorageAdapter.setItem(
		DEVICE_TO_IDENTITIES_PENDING_LOCAL_SOURCES_KEY,
		JSON.stringify(sources),
	);
}

export async function clearPendingLocalSourcesJournal(): Promise<void> {
	await IonicStorageAdapter.removeItem(
		DEVICE_TO_IDENTITIES_PENDING_LOCAL_SOURCES_KEY,
	);
}

export async function hasPendingLocalSourcesJournal(): Promise<boolean> {
	const pending = await readPendingLocalSourcesJournal();
	return pending.length > 0;
}
