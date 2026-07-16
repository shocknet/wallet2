import {
	encryptStringAesGcm,
	isAesGcmEnvelope,
} from "@/lib/aesGcm";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { getScopedIdentityPersistKey } from "@/State/scoped/backups/identity/slice";
import { getScopedSourcesPersistKey } from "@/State/scoped/backups/sources/slice";
import type { SourcesState } from "@/State/scoped/backups/sources/state";
import { SecureIdentitiesMigrationError } from "./errors";

export async function encryptIdentityScopedSlices(args: {
	pubkey: string;
	dataKey: CryptoKey;
}): Promise<void> {
	try {
		await encryptScopedSlice({
			identityId: args.pubkey,
			sliceName: "identity",
			dataKey: args.dataKey,
		});
		await encryptScopedSlice({
			identityId: args.pubkey,
			sliceName: "sources",
			dataKey: args.dataKey,
		});
	} catch (error) {
		throw new SecureIdentitiesMigrationError(
			"scoped-encrypt-failed",
			error instanceof Error
				? error.message
				: "Failed to encrypt identity scoped storage.",
			args.pubkey,
			{ cause: error },
		);
	}
}

async function encryptScopedSlice(args: {
	identityId: string;
	sliceName: "identity" | "sources";
	dataKey: CryptoKey;
}): Promise<void> {
	const persistKey =
		args.sliceName === "identity"
			? `persist:${getScopedIdentityPersistKey(args.identityId)}`
			: `persist:${getScopedSourcesPersistKey(args.identityId)}`;

	const raw = await IonicStorageAdapter.getItem(persistKey);
	if (!raw) {
		return;
	}

	try {
		const parsed = JSON.parse(raw);
		if (isAesGcmEnvelope(parsed)) {
			return;
		}
	} catch {
		// plaintext → encrypt below
	}

	const envelope = await encryptStringAesGcm({
		key: args.dataKey,
		plaintext: raw,
		aad: {
			identityId: args.identityId,
			sliceName: args.sliceName,
		},
	});
	await IonicStorageAdapter.setItem(persistKey, JSON.stringify(envelope));
}

/** Best-effort topic harvest from still-plaintext sources persist. */
export async function readTopicIdsFromPlaintextSources(
	pubkey: string,
): Promise<{ topicId: string; sourceId: string }[]> {
	const sourcesSliceSerialized = await IonicStorageAdapter.getItem(
		`persist:${getScopedSourcesPersistKey(pubkey)}`,
	);
	if (!sourcesSliceSerialized) {
		return [];
	}

	let parsedOnce: unknown;
	try {
		parsedOnce = JSON.parse(sourcesSliceSerialized);
	} catch {
		return [];
	}

	if (isAesGcmEnvelope(parsedOnce)) {
		return [];
	}

	const parsedTwice: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(
		parsedOnce as Record<string, unknown>,
	)) {
		if (typeof value !== "string") {
			parsedTwice[key] = value;
			continue;
		}
		try {
			parsedTwice[key] = JSON.parse(value);
		} catch {
			parsedTwice[key] = value;
		}
	}

	const metadataEntities = (
		(parsedTwice as unknown as SourcesState).metadata?.entities ?? {}
	) as SourcesState["metadata"]["entities"];

	return Object.values(metadataEntities)
		.filter((meta): meta is NonNullable<typeof meta> => Boolean(meta))
		.filter((meta) => Boolean(meta.topicId))
		.map((meta) => ({ topicId: meta.topicId!, sourceId: meta.id }));
}
