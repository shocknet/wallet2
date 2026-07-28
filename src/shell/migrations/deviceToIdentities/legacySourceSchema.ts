import { hexToBytes } from "@noble/hashes/utils";
import { getPublicKey } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { HexKeySchema } from "@/lib/regex";
import type { NostrKeyPair } from "@/Api/nostrHandler";
import z from "zod";

export function isPubLegacySource(source: {
	pubSource?: boolean;
	pasteField: string;
}): boolean {
	return !!source.pubSource || source.pasteField.toLowerCase().startsWith("nprofile");
}

export type SkippedLegacySource = {
	slice: "payTo" | "spendFrom";
	recordKey: string;
	reason: string;
};

export type ParseLegacySourceResult<T> =
	| { ok: true; source: T }
	| { ok: false; reason: string };

const legacySourceSliceEnvelopeSchema = z.object({
	sources: z.record(z.string(), z.unknown()),
	order: z.array(z.string()).optional(),
});

export type LegacySourceSliceEnvelope = z.infer<typeof legacySourceSliceEnvelopeSchema>;

export function parseLegacySourceSliceEnvelope(raw: unknown):
	| { ok: true; value: LegacySourceSliceEnvelope }
	| {
		ok: false; reason: string
	} {
	const parsed = legacySourceSliceEnvelopeSchema.safeParse(raw);
	if (!parsed.success) {
		return { ok: false, reason: parsed.error.message };
	}
	return { ok: true, value: parsed.data };
}

type ParsedPubLegacyCore = {
	lpk: string;
	keys: NostrKeyPair;
	id: string;
};

function parsePubLegacyCore(
	pasteField: string,
	keys: unknown
): ParseLegacySourceResult<ParsedPubLegacyCore> {
	if (!keys) {
		return { ok: false, reason: "pub source keys missing" };
	}

	const parsedKeys = z
		.object({
			privateKey: HexKeySchema,
			publicKey: HexKeySchema,
		})
		.safeParse(keys);

	if (!parsedKeys.success) {
		return { ok: false, reason: "pub source keys must be a valid nostr key pair" };
	}

	try {
		if (getPublicKey(hexToBytes(parsedKeys.data.privateKey)) !== parsedKeys.data.publicKey) {
			return { ok: false, reason: "pub source private key does not match public key" };
		}
	} catch {
		return { ok: false, reason: "pub source keys must be a valid nostr key pair" };
	}

	let lpk: string;
	try {
		const decoded = nip19.decode(pasteField);
		if (decoded.type !== "nprofile") {
			return { ok: false, reason: "pub source pasteField must be a valid nprofile" };
		}
		lpk = decoded.data.pubkey;
	} catch {
		return { ok: false, reason: "pub source pasteField must be a valid nprofile" };
	}

	const keyPair = parsedKeys.data as NostrKeyPair;
	return {
		ok: true,
		source: {
			lpk,
			keys: keyPair,
			id: `${lpk}-${keyPair.publicKey}`,
		},
	};
}

function readStringField(raw: Record<string, unknown>, key: string): string | undefined {
	const value = raw[key];
	return typeof value === "string" ? value : undefined;
}

function readBooleanField(raw: Record<string, unknown>, key: string): boolean | undefined {
	const value = raw[key];
	return typeof value === "boolean" ? value : undefined;
}

export type LegacyPubSourceToMigrate = {
	slice: "payTo" | "spendFrom";
	id: string;
	pasteField: string;
	label?: string;
	keys: NostrKeyPair;
	vanityName?: string;
	bridgeUrl?: string;
	isNdebitDiscoverable?: boolean;
	adminToken?: string;
};

export function parseLegacyPayTo(
	_recordKey: string,
	raw: unknown
): ParseLegacySourceResult<LegacyPubSourceToMigrate> {

	if (!raw || typeof raw !== "object") {
		return { ok: false, reason: "source is not an object" };
	}

	const entry = raw as Record<string, unknown>;
	const pasteField = readStringField(entry, "pasteField");
	if (!pasteField) {
		return { ok: false, reason: "missing pasteField" };
	}

	const pubSource = readBooleanField(entry, "pubSource");
	if (!isPubLegacySource({ pubSource, pasteField })) {
		return { ok: false, reason: "non-pub sources are not migrated" };
	}

	const core = parsePubLegacyCore(pasteField, entry.keys);
	if (!core.ok) {
		return core;
	}

	return {
		ok: true,
		source: {
			slice: "payTo",
			id: core.source.id,
			pasteField,
			label: readStringField(entry, "label"),
			keys: core.source.keys,
			vanityName: readStringField(entry, "vanityName"),
			bridgeUrl: readStringField(entry, "bridgeUrl"),
			isNdebitDiscoverable: readBooleanField(entry, "isNdebitDiscoverable"),
		},
	};
}

export function parseLegacySpendFrom(
	_recordKey: string,
	raw: unknown
): ParseLegacySourceResult<LegacyPubSourceToMigrate> {

	if (!raw || typeof raw !== "object") {
		return { ok: false, reason: "source is not an object" };
	}

	const entry = raw as Record<string, unknown>;
	const pasteField = readStringField(entry, "pasteField");
	if (!pasteField) {
		return { ok: false, reason: "missing pasteField" };
	}

	const pubSource = readBooleanField(entry, "pubSource");
	if (!isPubLegacySource({ pubSource, pasteField })) {
		return { ok: false, reason: "non-pub sources are not migrated" };
	}

	const core = parsePubLegacyCore(pasteField, entry.keys);
	if (!core.ok) {
		return core;
	}

	return {
		ok: true,
		source: {
			slice: "spendFrom",
			id: core.source.id,
			pasteField,
			label: readStringField(entry, "label"),
			keys: core.source.keys,
			adminToken: readStringField(entry, "adminToken"),
		},
	};
}

export function collectLegacySourcesFromSlice(
	slice: "payTo" | "spendFrom",
	envelope: LegacySourceSliceEnvelope
): { sources: SourceToMigrate[]; skipped: SkippedLegacySource[] } {
	const sources: SourceToMigrate[] = [];
	const skipped: SkippedLegacySource[] = [];

	for (const [recordKey, raw] of Object.entries(envelope.sources)) {
		const parsed =
			slice === "payTo"
				? parseLegacyPayTo(recordKey, raw)
				: parseLegacySpendFrom(recordKey, raw);

		if (parsed.ok) {
			sources.push(parsed.source);
		} else {
			skipped.push({ slice, recordKey, reason: parsed.reason });
		}
	}

	return { sources, skipped };
}

export type SourceToMigrate = LegacyPubSourceToMigrate;

const legacyShardsTagsRecordSchema = z
	.object({
		dtags: z.array(z.string()),
		remoteHash: z.string().optional(),
	})
	.loose();

const legacyPaySourceShardSchema = z.object({
	kind: z.literal("paySource"),
	order: z.number().optional(),
	source: z.unknown(),
});

const legacySpendSourceShardSchema = z.object({
	kind: z.literal("spendSource"),
	order: z.number().optional(),
	source: z.unknown(),
});

const legacyNonSourceShardKinds = new Set(["lnurlOps", "prefs"]);

const legacyEmbeddedBackupPayloadSchema = z.record(z.string(), z.unknown());

export type ParsedLegacyMigrationShard =
	| { kind: "source"; slice: "payTo" | "spendFrom"; source: unknown }
	| { kind: "ignored" }
	| { kind: "invalid"; reason: string };

export type ClassifiedLegacyRemoteBackupRoot =
	| { kind: "sharded"; dtags: string[] }
	| { kind: "embedded"; data: Record<string, unknown> }
	| { kind: "invalid"; reason: string };

export function parseLegacyJsonString(raw: string): ParseLegacySourceResult<unknown> {
	try {
		return { ok: true, source: JSON.parse(raw) };
	} catch (error) {
		return {
			ok: false,
			reason: error instanceof Error ? error.message : "invalid json",
		};
	}
}

export function classifyLegacyRemoteBackupRoot(raw: unknown): ClassifiedLegacyRemoteBackupRoot {
	if (raw && typeof raw === "object" && "dtags" in raw) {
		const parsed = legacyShardsTagsRecordSchema.safeParse(raw);
		if (!parsed.success) {
			return { kind: "invalid", reason: parsed.error.message };
		}

		const dtags = parsed.data.dtags.filter((tag): tag is string => typeof tag === "string");
		return { kind: "sharded", dtags };
	}

	const embedded = legacyEmbeddedBackupPayloadSchema.safeParse(raw);
	if (!embedded.success) {
		return { kind: "invalid", reason: embedded.error.message };
	}

	return { kind: "embedded", data: embedded.data };
}

export function parseLegacyEmbeddedBackupPayload(
	raw: unknown
): ParseLegacySourceResult<Record<string, unknown>> {
	const parsed = legacyEmbeddedBackupPayloadSchema.safeParse(raw);
	if (!parsed.success) {
		return { ok: false, reason: parsed.error.message };
	}
	return { ok: true, source: parsed.data };
}

export function parseLegacyMigrationSourceShard(raw: unknown): ParsedLegacyMigrationShard {
	const payParsed = legacyPaySourceShardSchema.safeParse(raw);
	if (payParsed.success) {
		return { kind: "source", slice: "payTo", source: payParsed.data.source };
	}

	const spendParsed = legacySpendSourceShardSchema.safeParse(raw);
	if (spendParsed.success) {
		return { kind: "source", slice: "spendFrom", source: spendParsed.data.source };
	}

	const envelope = z.object({ kind: z.string() }).safeParse(raw);
	if (envelope.success && legacyNonSourceShardKinds.has(envelope.data.kind)) {
		return { kind: "ignored" };
	}

	const reason =
		payParsed.error?.issues[0]?.message ??
		spendParsed.error?.issues[0]?.message ??
		"invalid shard shape";

	return { kind: "invalid", reason };
}
