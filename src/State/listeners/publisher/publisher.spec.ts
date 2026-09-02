import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDeferred } from "@/lib/deferred";
import { identityUnloaded, publisherFlushRequested } from "@/State/listeners/actions";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";
import {
	getActiveIdentityNostrApi,
	type IdentityNostrApi,
} from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { saveNip78Event, saveSourceDocEvent } from "@/State/identitiesRegistry/helpers/nostr";
import { getSourceDocDtag, identityDocDtag } from "@/State/identitiesRegistry/helpers/processDocs";
import { identityActions } from "@/State/scoped/backups/identity/slice";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { TEST_CLOCK_BY, TEST_IDENTITY_PUBKEY, TEST_RUNTIME_IDENTITY } from "@tests/support/identityFixtures";
import { createTestSource, createTestSources, type TestSource } from "@tests/support/sourcesHelpers";
import { makeListenerStore } from "@tests/support/listenerStore";
import { publisherSpec, DEBOUNCE_MS } from "./publisher";

vi.mock("@/State/identitiesRegistry/helpers/identityNostrApi", () => ({
	getActiveIdentityNostrApi: vi.fn(),
}));
vi.mock("@/State/identitiesRegistry/helpers/nostr", () => ({
	saveSourceDocEvent: vi.fn(),
	saveNip78Event: vi.fn(),
}));
vi.mock("@/State/identitiesRegistry/helpers/processDocs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/State/identitiesRegistry/helpers/processDocs")>();
	return {
		...actual,
		getSourceDocDtag: vi.fn(async (pubkey: string, sourceId: string) => `source@${pubkey}-${sourceId}`),
	};
});

const getApiMock = vi.mocked(getActiveIdentityNostrApi);
const saveSourceMock = vi.mocked(saveSourceDocEvent);
const saveIdentityMock = vi.mocked(saveNip78Event);
const getSourceDocDtagMock = vi.mocked(getSourceDocDtag);

const NOW_MS = 1_000_000;
const IDENTITY_API = { id: "test-identity-api" } as unknown as IdentityNostrApi;

type PublisherStore = ReturnType<typeof openPublisherStore>;

function openPublisherStore(opts: {
	sources?: TestSource[];
	loadIdentity?: boolean;
} = {}) {
	const loadIdentity = opts.loadIdentity ?? true;
	const { store } = makeListenerStore({
		specs: [publisherSpec],
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

function sourceEntry(store: PublisherStore, sourceId: string) {
	return store.getState().scoped.sources.docs.entities[sourceId];
}

function identityEntry(store: PublisherStore) {
	return store.getState().scoped.identity;
}

function publishedSource() {
	return JSON.parse(saveSourceMock.mock.calls[0][1] as string);
}

function publishedIdentity() {
	return JSON.parse(saveIdentityMock.mock.calls[0][1] as string);
}

function updateLabel(store: PublisherStore, source: TestSource, label: string) {
	store.dispatch(sourcesActions.updateSourceLabel({
		sourceId: source.id,
		label,
		by: TEST_CLOCK_BY,
	}));
}

function setFavorite(store: PublisherStore, sourceId: string | null) {
	store.dispatch(identityActions.setFavoriteSource({
		sourceId,
		by: TEST_CLOCK_BY,
	}));
}

function clearCalls() {
	getApiMock.mockClear();
	saveSourceMock.mockClear();
	saveIdentityMock.mockClear();
	getSourceDocDtagMock.mockClear();
}

async function settle() {
	await vi.runAllTimersAsync();
}

async function flush() {
	await vi.advanceTimersByTimeAsync(0);
}

describe("publisher", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(NOW_MS);
		getApiMock.mockResolvedValue(IDENTITY_API);
		saveSourceMock.mockResolvedValue(20);
		saveIdentityMock.mockResolvedValue(420);
		getSourceDocDtagMock.mockImplementation(
			async (pubkey: string, sourceId: string) => `source@${pubkey}-${sourceId}`,
		);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("kick", () => {
		it("does not publish dirty docs just because the identity loaded", async () => {
			const [source] = createTestSources(1);
			openPublisherStore({ sources: [source] });
			await settle();

			expect(saveSourceMock).not.toHaveBeenCalled();
			expect(saveIdentityMock).not.toHaveBeenCalled();
		});

		it("does not listen until the runtime identity is set", async () => {
			const [source] = createTestSources(1);
			const store = openPublisherStore({ sources: [source], loadIdentity: false });

			updateLabel(store, source, "too-early");
			setFavorite(store, null);
			await settle();

			expect(saveSourceMock).not.toHaveBeenCalled();
			expect(saveIdentityMock).not.toHaveBeenCalled();
		});
	});

	describe("source docs", () => {
		it("publishes a label change after debounce and acks", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = openPublisherStore({ sources: [source] });

			updateLabel(store, source, "renamed");
			expect(sourceEntry(store, source.id).dirty).toBe(true);

			await settle();

			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(saveSourceMock).toHaveBeenCalledWith(
				IDENTITY_API,
				expect.any(String),
				`source@${TEST_IDENTITY_PUBKEY}-${source.id}`,
			);
			expect(publishedSource().label.value).toBe("renamed");
			expect(publishedSource().source_id).toBe(source.id);
			expect(sourceEntry(store, source.id).dirty).toBe(false);
			expect(sourceEntry(store, source.id).lastPublishedAt).toEqual(expect.any(Number));
		});

		it("does not write before debounce elapses", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = openPublisherStore({ sources: [source] });

			updateLabel(store, source, "renamed");
			await flush();
			expect(saveSourceMock).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
			expect(saveSourceMock).not.toHaveBeenCalled();
			expect(sourceEntry(store, source.id).dirty).toBe(true);

			await vi.advanceTimersByTimeAsync(1);
			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(sourceEntry(store, source.id).dirty).toBe(false);
		});

		it("restarts debounce on another dirtying of the same source and writes the latest draft", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = openPublisherStore({ sources: [source] });

			updateLabel(store, source, "first");
			await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
			updateLabel(store, source, "second");
			await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
			expect(saveSourceMock).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(publishedSource().label.value).toBe("second");
			expect(sourceEntry(store, source.id).dirty).toBe(false);
		});

		it("publishes a newly created source", async () => {
			const store = openPublisherStore();
			const source = createTestSource();

			store.dispatch(sourcesActions._createDraftDoc({
				sourceId: source.id,
				draft: source.doc,
			}));
			expect(sourceEntry(store, source.id).dirty).toBe(true);

			await settle();

			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(publishedSource().source_id).toBe(source.id);
			expect(sourceEntry(store, source.id).dirty).toBe(false);
		});

		it("publishes each dirty source independently", async () => {
			const [a, b] = createTestSources(2, { dirty: false });
			const store = openPublisherStore({ sources: [a, b] });

			updateLabel(store, a, "a");
			updateLabel(store, b, "b");
			await settle();

			expect(saveSourceMock).toHaveBeenCalledTimes(2);
			const labels = saveSourceMock.mock.calls
				.map(call => JSON.parse(call[1] as string).label.value)
				.sort();
			expect(labels).toEqual(["a", "b"]);
			expect(sourceEntry(store, a.id).dirty).toBe(false);
			expect(sourceEntry(store, b.id).dirty).toBe(false);
		});

		it("does not publish when applyRemoteSource leaves the doc clean", async () => {
			const store = openPublisherStore();
			const remote = createTestSource();

			store.dispatch(sourcesActions.applyRemoteSource({
				sourceId: remote.id,
				remote: remote.doc,
			}));
			expect(sourceEntry(store, remote.id).dirty).toBe(false);

			await settle();
			expect(saveSourceMock).not.toHaveBeenCalled();
		});

		it("publishes an admin token change", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = openPublisherStore({ sources: [source] });

			store.dispatch(sourcesActions.updateAdminToken({
				sourceId: source.id,
				adminToken: "admin-token",
				by: TEST_CLOCK_BY,
			}));
			expect(sourceEntry(store, source.id).dirty).toBe(true);

			await settle();

			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(publishedSource().admin_token.value).toBe("admin-token");
			expect(sourceEntry(store, source.id).dirty).toBe(false);
		});

		it("publishes an ndebit-discoverable change", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = openPublisherStore({ sources: [source] });

			store.dispatch(sourcesActions.updateisNDebitDiscoverable({
				sourceId: source.id,
				isNdebitDiscoverable: true,
				by: TEST_CLOCK_BY,
			}));
			expect(sourceEntry(store, source.id).dirty).toBe(true);

			await settle();

			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(publishedSource().is_ndebit_discoverable.value).toBe(true);
			expect(sourceEntry(store, source.id).dirty).toBe(false);
		});

		it("does not ack when saveSourceDocEvent fails", async () => {
			saveSourceMock.mockRejectedValueOnce(new Error("relay down"));
			const [source] = createTestSources(1, { dirty: false });
			const store = openPublisherStore({ sources: [source] });

			updateLabel(store, source, "renamed");
			await settle();

			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(sourceEntry(store, source.id).dirty).toBe(true);
			expect(sourceEntry(store, source.id).lastPublishedAt).toBeUndefined();
		});

		it("purges a deleted source after the tombstone publishes", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = openPublisherStore({ sources: [source] });

			store.dispatch(sourcesActions.markDeleted({
				sourceId: source.id,
				by: TEST_CLOCK_BY,
			}));
			expect(sourceEntry(store, source.id).draft.deleted.value).toBe(true);

			await settle();

			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(publishedSource().deleted.value).toBe(true);
			expect(sourceEntry(store, source.id)).toBeUndefined();
		});
	});

	describe("identity doc", () => {
		it("publishes a favorite-source change after debounce and acks", async () => {
			const sources = createTestSources(2);
			const store = openPublisherStore({ sources });
			expect(identityEntry(store).dirty).toBe(true);

			setFavorite(store, sources[1].id);
			await settle();

			expect(saveIdentityMock).toHaveBeenCalledTimes(1);
			expect(saveIdentityMock).toHaveBeenCalledWith(
				IDENTITY_API,
				expect.any(String),
				identityDocDtag,
			);
			expect(publishedIdentity().favorite_source_id.value).toBe(sources[1].id);
			expect(identityEntry(store).dirty).toBe(false);
			expect(identityEntry(store).lastPublishedAt).toEqual(expect.any(Number));
			expect(identityEntry(store).draft!.favorite_source_id.value).toBe(sources[1].id);
		});

		it("publishes a fiat currency change", async () => {
			const [source] = createTestSources(1);
			const store = openPublisherStore({ sources: [source] });

			store.dispatch(identityActions.setFiatCurrency({
				currency: "EUR",
				by: TEST_CLOCK_BY,
			}));
			await settle();

			expect(saveIdentityMock).toHaveBeenCalledTimes(1);
			expect(publishedIdentity().fiatCurrency.value).toBe("EUR");
			expect(identityEntry(store).dirty).toBe(false);
		});

		it("restarts debounce on another identity dirtying and writes the latest draft", async () => {
			const sources = createTestSources(3);
			const store = openPublisherStore({ sources });

			setFavorite(store, sources[1].id);
			await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
			setFavorite(store, sources[2].id);
			await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
			expect(saveIdentityMock).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
			expect(saveIdentityMock).toHaveBeenCalledTimes(1);
			expect(publishedIdentity().favorite_source_id.value).toBe(sources[2].id);
			expect(identityEntry(store).dirty).toBe(false);
		});

		it("does not ack when saveNip78Event fails", async () => {
			saveIdentityMock.mockRejectedValueOnce(new Error("relay down"));
			const sources = createTestSources(2);
			const store = openPublisherStore({ sources });

			setFavorite(store, sources[1].id);
			await settle();

			expect(saveIdentityMock).toHaveBeenCalledTimes(1);
			expect(identityEntry(store).dirty).toBe(true);
			expect(identityEntry(store).lastPublishedAt).toBeUndefined();
		});
	});

	describe("flush", () => {
		it("writes immediately on publisherFlushRequested and resolves the deferred", async () => {
			const sources = createTestSources(3, { dirty: false });
			const store = openPublisherStore({ sources });

			for (const src of sources) {
				updateLabel(store, src, "label-update");
			}
			setFavorite(store, sources[1].id);
			await flush();

			expect(saveSourceMock).not.toHaveBeenCalled();
			expect(saveIdentityMock).not.toHaveBeenCalled();

			const deferred = createDeferred<void>();
			store.dispatch(publisherFlushRequested({ deferred }));
			await deferred;

			expect(saveSourceMock).toHaveBeenCalledTimes(3);
			expect(saveIdentityMock).toHaveBeenCalledTimes(1);
			expect(identityEntry(store).dirty).toBe(false);
			for (const src of sources) {
				expect(sourceEntry(store, src.id).dirty).toBe(false);
			}
		});

		it("flushes pending writes when the identity unloads", async () => {
			const [source] = createTestSources(1, { dirty: false });
			const store = openPublisherStore({ sources: [source] });

			updateLabel(store, source, "renamed");
			setFavorite(store, null);
			await flush();
			clearCalls();

			const unloaded = createDeferred<void>();
			store.dispatch(identityUnloaded({ deferred: unloaded }));
			await unloaded;

			expect(saveSourceMock).toHaveBeenCalledTimes(1);
			expect(saveIdentityMock).toHaveBeenCalledTimes(1);
			expect(sourceEntry(store, source.id).dirty).toBe(false);
			expect(identityEntry(store).dirty).toBe(false);
		});
	});
});
