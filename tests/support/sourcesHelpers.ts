import { newflag, newLww } from "@/State/sync/lww"
import { SourceDocV0, SourceType } from "@/State/scoped/backups/sources/schema"
import { Satoshi } from "@/lib/types/units"
import {
	docsAdapter,
	getIntialState,
	metadataAdapter,
	SourcesState,
} from "@/State/scoped/backups/sources/state"
import { SourceMetadata } from "@/State/scoped/backups/sources/metadata/types"
import { generateNewKeyPair, type KeyPair } from "@/Api/helpers"
import { TEST_CLOCK_BY } from "./identityFixtures"

export const TEST_RELAY_URL = "wss://test-relay.lightning.pub";

export type TestRelayFlag = ReturnType<typeof newflag>;

export const testRelayFlag = (present = true): TestRelayFlag =>
	newflag(present, TEST_CLOCK_BY);

export const testRelayFlags = (...urls: string[]): Record<string, TestRelayFlag> =>
	Object.fromEntries(urls.map(url => [url, testRelayFlag()]));

export type TestSource = {
	id: string;
	lpk: string;
	keys: KeyPair;
	doc: SourceDocV0;
	meta: SourceMetadata;
	dirty: boolean;
};

export type CreateTestSourceOpts = {
	lpk?: string;
	id?: string;
	keys?: KeyPair;
	relays?: string[];
	dirty?: boolean;
	createdAt?: number;
	doc?: Partial<SourceDocV0>;
	meta?: Partial<SourceMetadata>;
};

export function createTestSourceMetadata(sourceLpk: string, sourceId: string): SourceMetadata {
	return {
		id: sourceId,
		lpk: sourceLpk,
		balance: 0 as Satoshi,
		maxWithdrable: 0 as Satoshi,
	};
}

export function createTestSource(opts: CreateTestSourceOpts = {}): TestSource {
	const keys = opts.keys ?? generateNewKeyPair();
	const lpk = opts.lpk ?? generateNewKeyPair().publicKey;
	const id = opts.id ?? `${lpk}-${keys.publicKey}`;
	const dirty = opts.dirty ?? true;

	const doc: SourceDocV0 = {
		doc_type: "doc/shockwallet/source_",
		schema_rev: 0,
		label: newLww(null, TEST_CLOCK_BY),
		relays: testRelayFlags(...(opts.relays ?? [TEST_RELAY_URL])),
		bridgeUrl: newLww(null, TEST_CLOCK_BY),
		admin_token: newLww(null, TEST_CLOCK_BY),
		is_ndebit_discoverable: newLww(false, TEST_CLOCK_BY),
		deleted: newLww(false, TEST_CLOCK_BY),
		type: SourceType.NPROFILE_SOURCE,
		created_at: opts.createdAt ?? Date.now(),
		...opts.doc,
		source_id: id,
		lpk,
		keys: opts.doc?.keys ?? {
			publicKey: keys.publicKey,
			privateKey: keys.privateKey,
		},
	};

	const meta: SourceMetadata = {
		...createTestSourceMetadata(lpk, id),
		...opts.meta,
		id,
		lpk,
	};

	return { id, lpk, keys, doc, meta, dirty };
}

export function createTestSources(count: number, opts: CreateTestSourceOpts = {}): TestSource[] {
	const createdAt = opts.createdAt ?? Date.now();
	return Array.from({ length: count }, (_, i) => createTestSource({
		...opts,
		id: count === 1 ? opts.id : undefined,
		keys: count === 1 ? opts.keys : undefined,
		createdAt: createdAt + i,
	}));
}

/** @deprecated use createTestSource().doc */
export const createTestSourceDoc = (sourceLpk: string, sourceId: string): SourceDocV0 =>
	createTestSource({ lpk: sourceLpk, id: sourceId }).doc;

type HistoryState = SourcesState["history"];

type GetStateOpts = {
	historyOverride?: Partial<HistoryState>;
};

export const sourcesStateOf = (
	sources: TestSource[],
	opts: GetStateOpts = {},
): SourcesState => {
	const initial = getIntialState();
	return {
		docs: docsAdapter.setAll(
			initial.docs,
			sources.map(s => ({ draft: s.doc, dirty: s.dirty })),
		),
		metadata: metadataAdapter.setAll(
			initial.metadata,
			sources.map(s => s.meta),
		),
		history: { ...initial.history, ...(opts.historyOverride ?? {}) },
	};
};

/** @deprecated use sourcesStateOf */
export const getPreloadedSourcesState = sourcesStateOf;

/** @deprecated use createTestSources */
export const generateSources = (count: number, _prefix = "src", lpk?: string): TestSource[] =>
	createTestSources(count, { lpk });

export type GenSource = TestSource;

export {
	createTestIdentityDoc,
	createTestIdentitydoc,
	getPreloadedIdentityState,
} from "./identityFixtures";

export { makeOps, makeOpsPage } from "./historyFixtures";
