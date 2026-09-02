import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDeferred } from "@/lib/deferred";
import { identityUnloaded } from "@/State/listeners/actions";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";
import {
	getActiveIdentityNostrApi,
	type IdentityNostrApi,
} from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { subscribeToNostrEvents } from "@/State/identitiesRegistry/helpers/nostr";
import { identityDocDtag } from "@/State/identitiesRegistry/helpers/processDocs";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import {
	createTestIdentityDoc,
	TEST_IDENTITY_PUBKEY,
	TEST_RUNTIME_IDENTITY,
} from "@tests/support/identityFixtures";
import { createTestSource, createTestSources, type TestSource } from "@tests/support/sourcesHelpers";
import { makeListenerStore } from "@tests/support/listenerStore";
import { pullerSpec } from "./puller";

vi.mock("@/State/identitiesRegistry/helpers/identityNostrApi", () => ({
	getActiveIdentityNostrApi: vi.fn(),
}));
vi.mock("@/State/identitiesRegistry/helpers/nostr", () => ({
	subscribeToNostrEvents: vi.fn(),
}));

const getApiMock = vi.mocked(getActiveIdentityNostrApi);
const subscribeMock = vi.mocked(subscribeToNostrEvents);

const NOW_MS = 1_000_000;
const OTHER_BY = "other-device-id-00000";
const IDENTITY_API = { id: "test-identity-api" } as unknown as IdentityNostrApi;

type PullerStore = ReturnType<typeof openPullerStoreSync>;
type DocCallback = (decrypted: string) => void | Promise<void>;

const closeSub = vi.fn();
let emitDoc: (decrypted: string) => Promise<void> = async () => {
	throw new Error("puller is not subscribed");
};

function openPullerStoreSync(opts: {
	sources?: TestSource[];
	loadIdentity?: boolean;
} = {}) {
	const loadIdentity = opts.loadIdentity ?? true;
	const { store } = makeListenerStore({
		specs: [pullerSpec],
		sources: opts.sources,
		loadIdentity: false,
	});
	if (loadIdentity) {
		store.dispatch(identitiesRegistryActions.setActiveIdentityRuntime({
			identity: TEST_RUNTIME_IDENTITY,
		}));
	}
	return store;
}

async function openPullerStore(opts: {
	sources?: TestSource[];
	loadIdentity?: boolean;
} = {}) {
	const store = openPullerStoreSync(opts);
	if (opts.loadIdentity ?? true) {
		await flush();
	}
	return store;
}

function sourceEntry(store: PullerStore, sourceId: string) {
	return store.getState().scoped.sources.docs.entities[sourceId];
}

function identityEntry(store: PullerStore) {
	return store.getState().scoped.identity;
}

async function emitRemote(payload: unknown) {
	const decrypted = typeof payload === "string" ? payload : JSON.stringify(payload);
	await emitDoc(decrypted);
}

async function unload(store: PullerStore) {
	const done = createDeferred<void>();
	store.dispatch(identityUnloaded({ deferred: done }));
	await done;
}

async function flush() {
	await vi.advanceTimersByTimeAsync(0);
}

function lww<T>(value: T, v = 1, by = OTHER_BY) {
	return { clock: { v, by }, value };
}

describe("puller", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(NOW_MS);
		getApiMock.mockResolvedValue(IDENTITY_API);
		closeSub.mockReset();
		emitDoc = async () => {
			throw new Error("puller is not subscribed");
		};
		subscribeMock.mockImplementation(async (_api, _filters, cb: DocCallback) => {
			emitDoc = async (decrypted: string) => {
				await cb(decrypted);
			};
			return { close: closeSub };
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("subscribe", () => {
		it("subscribes for identity and source docs on kick", async () => {
			await openPullerStore();

			expect(getApiMock).toHaveBeenCalledTimes(1);
			expect(subscribeMock).toHaveBeenCalledTimes(1);
			expect(subscribeMock).toHaveBeenCalledWith(
				IDENTITY_API,
				[
					{ kinds: [30078], authors: [TEST_IDENTITY_PUBKEY], "#d": [identityDocDtag] },
					{ kinds: [30079], authors: [TEST_IDENTITY_PUBKEY] },
				],
				expect.any(Function),
			);
		});

		it("does not subscribe until the runtime identity is set", async () => {
			await openPullerStore({ loadIdentity: false });
			await flush();

			expect(subscribeMock).not.toHaveBeenCalled();
		});

		it("closes the subscription when the identity unloads", async () => {
			const store = await openPullerStore();
			await unload(store);

			expect(closeSub).toHaveBeenCalledTimes(1);
		});

		it("subscribes again after a later identity load", async () => {
			const store = await openPullerStore();
			await unload(store);
			expect(subscribeMock).toHaveBeenCalledTimes(1);

			store.dispatch(identitiesRegistryActions.setActiveIdentityRuntime({
				identity: TEST_RUNTIME_IDENTITY,
			}));
			await flush();

			expect(subscribeMock).toHaveBeenCalledTimes(2);
		});
	});

	describe("remote source docs", () => {
		it("adds a new remote source", async () => {
			const store = await openPullerStore();
			const source = createTestSource();

			await emitRemote(source.doc);

			const entry = sourceEntry(store, source.id);
			expect(entry).toBeDefined();
			expect(entry.dirty).toBe(false);
			expect(entry.draft.source_id).toBe(source.id);
			expect(entry.draft.lpk).toBe(source.lpk);
		});

		it("merges a remote source into an existing one", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = await openPullerStore({ sources: [source] });

			await emitRemote({
				...source.doc,
				label: lww("from-remote"),
			});

			expect(sourceEntry(store, source.id).draft.label.value).toBe("from-remote");
		});

		it("purges a source when a remote tombstone wins", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = await openPullerStore({ sources: [source] });

			await emitRemote({
				...source.doc,
				deleted: lww(true),
			});

			expect(sourceEntry(store, source.id)).toBeUndefined();
		});

		it("ignores a non-nprofile remote source doc", async () => {
			const store = await openPullerStore();
			const source = createTestSource();

			await emitRemote({
				...source.doc,
				type: SourceType.LIGHTNING_ADDRESS_SOURCE,
			});

			expect(sourceEntry(store, source.id)).toBeUndefined();
		});
	});

	describe("remote identity docs", () => {
		it("applies a remote identity doc", async () => {
			const [source] = createTestSources(1);
			const store = await openPullerStore({ sources: [source] });
			expect(identityEntry(store).draft!.favorite_source_id.value).toBe(source.id);

			await emitRemote({
				...createTestIdentityDoc(TEST_IDENTITY_PUBKEY),
				favorite_source_id: lww("remote-favorite"),
				fiatCurrency: lww("EUR"),
			});

			expect(identityEntry(store).draft!.favorite_source_id.value).toBe("remote-favorite");
			expect(identityEntry(store).draft!.fiatCurrency.value).toBe("EUR");
			expect(identityEntry(store).dirty).toBe(false);
		});

		it("ignores an identity doc for a different pubkey", async () => {
			const [source] = createTestSources(1);
			const store = await openPullerStore({ sources: [source] });

			await emitRemote(createTestIdentityDoc("not-the-active-identity"));

			expect(identityEntry(store).draft!.identity_pubkey).toBe(TEST_IDENTITY_PUBKEY);
			expect(identityEntry(store).draft!.favorite_source_id.value).toBe(source.id);
		});
	});

	describe("bad payloads", () => {
		it("ignores invalid json", async () => {
			const store = await openPullerStore();

			await emitRemote("{not-json");

			expect(store.getState().scoped.sources.docs.ids).toEqual([]);
		});

		it("ignores a payload that is not a backup doc", async () => {
			const store = await openPullerStore();

			await emitRemote({ hello: "nope" });

			expect(store.getState().scoped.sources.docs.ids).toEqual([]);
		});
	});

	describe("abort", () => {
		it("does not apply a doc received after unload", async () => {
			const store = await openPullerStore();
			await unload(store);

			const source = createTestSource();
			await emitRemote(source.doc);

			expect(sourceEntry(store, source.id)).toBeUndefined();
			expect(closeSub).toHaveBeenCalledTimes(1);
		});
	});
});
