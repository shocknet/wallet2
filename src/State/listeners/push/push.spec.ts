import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { getNostrClient, type Client } from "@/Api/nostr";
import { createDeferred } from "@/lib/deferred";
import { newLww } from "@/State/sync/lww";
import { identityUnloaded } from "@/State/listeners/actions";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";
import { runtimeActions } from "@/State/runtime/slice";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { beaconsActions } from "@/State/scoped/beacons/slice";
import { TEST_CLOCK_BY, TEST_RUNTIME_IDENTITY } from "@tests/support/identityFixtures";
import {
	beaconsStateOf,
	createTestBeaconNode,
} from "@tests/support/beaconsFixtures";
import {
	createTestSource,
	createTestSources,
	TEST_RELAY_URL,
	type TestSource,
} from "@tests/support/sourcesHelpers";
import { makeListenerStore } from "@tests/support/listenerStore";
import type { BeaconsState } from "@/State/scoped/beacons/state";
import { pushTokenUpdated } from "@/notifications/push/actions";
import { pushEnrollmentSpec } from "./push";

vi.mock("@/Api/nostr", () => ({
	getNostrClient: vi.fn(),
}));

const getNostrClientMock = vi.mocked(getNostrClient);

const NOW_MS = 1_000_000;
const TOKEN = "fcm-token-abc";
const NEW_TOKEN = "fcm-token-xyz";

type PushClient = {
	EnrollMessagingToken: Mock<Client["EnrollMessagingToken"]>;
};

function mockClient(partial: Partial<PushClient> = {}): PushClient {
	return {
		EnrollMessagingToken: vi.fn().mockResolvedValue({ status: "OK" }),
		...partial,
	};
}

function useClient(client: PushClient) {
	getNostrClientMock.mockResolvedValue(client as unknown as Client);
	return client;
}

function clearCalls(client: PushClient) {
	getNostrClientMock.mockClear();
	client.EnrollMessagingToken.mockClear();
}

function openPushStore(opts: {
	sources?: TestSource[];
	beacons?: BeaconsState;
	loadIdentity?: boolean;
	token?: string | null;
} = {}) {
	const loadIdentity = opts.loadIdentity ?? true;
	const { store } = makeListenerStore({
		specs: [pushEnrollmentSpec],
		sources: opts.sources,
		beacons: opts.beacons,
		loadIdentity: false,
	});
	store.dispatch(runtimeActions.clockTick({ nowMs: NOW_MS }));
	if (opts.token !== null) {
		store.dispatch(runtimeActions.setPushRuntimeStatus({
			pushStatus: { status: "registered", token: opts.token ?? TOKEN },
		}));
	}
	if (loadIdentity) {
		store.dispatch(identitiesRegistryActions.setActiveIdentityRuntime({
			identity: TEST_RUNTIME_IDENTITY,
		}));
	}
	return store;
}

function seeBeacon(lpk: string, relay = TEST_RELAY_URL, seenAtMs = NOW_MS) {
	return beaconsActions.recordBeacon({
		lpk,
		relay,
		seenAtMs,
		data: { type: "service", name: "node" },
	});
}

function enrollArg(token: string) {
	return {
		device_id: expect.any(String),
		firebase_messaging_token: token,
	};
}

function clientFor(source: TestSource) {
	return [
		{ pubkey: source.lpk, relays: [TEST_RELAY_URL] },
		source.keys,
	] as const;
}

async function settle() {
	await vi.runAllTimersAsync();
}

describe("push enrollment", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(NOW_MS);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("kick", () => {
		it("enrolls every live source when a token is registered", async () => {
			const [a, b] = createTestSources(2);
			const deleted = createTestSource({
				doc: { deleted: newLww(true, TEST_CLOCK_BY) },
			});
			const client = useClient(mockClient());
			openPushStore({ sources: [a, b, deleted] });
			await settle();

			expect(getNostrClientMock).toHaveBeenCalledTimes(2);
			expect(getNostrClientMock).toHaveBeenCalledWith(...clientFor(a));
			expect(getNostrClientMock).toHaveBeenCalledWith(...clientFor(b));
			expect(client.EnrollMessagingToken).toHaveBeenCalledTimes(2);
			expect(client.EnrollMessagingToken).toHaveBeenCalledWith(enrollArg(TOKEN));
		});

		it("does not enroll when no push token is registered", async () => {
			const [source] = createTestSources(1);
			const client = useClient(mockClient());
			openPushStore({ sources: [source], token: null });
			await settle();

			expect(getNostrClientMock).not.toHaveBeenCalled();
			expect(client.EnrollMessagingToken).not.toHaveBeenCalled();
		});

		it("does not enroll until the runtime identity is set", async () => {
			const [source] = createTestSources(1);
			const client = useClient(mockClient());
			openPushStore({ sources: [source], loadIdentity: false });
			await settle();

			expect(client.EnrollMessagingToken).not.toHaveBeenCalled();
		});

		it("keeps enrolling later sources when one enroll fails", async () => {
			const [a, b] = createTestSources(2);
			const client = useClient(mockClient({
				EnrollMessagingToken: vi.fn()
					.mockRejectedValueOnce(new Error("node down"))
					.mockResolvedValue({ status: "OK" }),
			}));
			openPushStore({ sources: [a, b] });
			await settle();

			expect(client.EnrollMessagingToken).toHaveBeenCalledTimes(2);
		});
	});

	describe("token update", () => {
		it("enrolls every live source with the new token", async () => {
			const sources = createTestSources(2);
			const client = useClient(mockClient());
			const store = openPushStore({ sources, token: null });
			await settle();
			expect(client.EnrollMessagingToken).not.toHaveBeenCalled();

			store.dispatch(runtimeActions.setPushRuntimeStatus({
				pushStatus: { status: "registered", token: NEW_TOKEN },
			}));
			store.dispatch(pushTokenUpdated({ token: NEW_TOKEN }));
			await settle();

			expect(client.EnrollMessagingToken).toHaveBeenCalledTimes(2);
			expect(client.EnrollMessagingToken).toHaveBeenCalledWith(enrollArg(NEW_TOKEN));
		});

		it("does not enroll when runtime status is not registered", async () => {
			const [source] = createTestSources(1);
			const client = useClient(mockClient());
			const store = openPushStore({ sources: [source], token: null });
			await settle();

			store.dispatch(runtimeActions.setPushRuntimeStatus({
				pushStatus: { status: "denied" },
			}));
			store.dispatch(pushTokenUpdated({ token: TOKEN }));
			await settle();

			expect(client.EnrollMessagingToken).not.toHaveBeenCalled();
		});
	});

	describe("new source", () => {
		it("enrolls a source created after identity load", async () => {
			const client = useClient(mockClient());
			const store = openPushStore();
			await settle();
			clearCalls(client);

			const source = createTestSource();
			store.dispatch(sourcesActions._createDraftDoc({
				sourceId: source.id,
				draft: source.doc,
			}));
			await settle();

			expect(getNostrClientMock).toHaveBeenCalledTimes(1);
			expect(getNostrClientMock).toHaveBeenCalledWith(...clientFor(source));
			expect(client.EnrollMessagingToken).toHaveBeenCalledTimes(1);
			expect(client.EnrollMessagingToken).toHaveBeenCalledWith(enrollArg(TOKEN));
		});

		it("enrolls a source applied from remote", async () => {
			const client = useClient(mockClient());
			const store = openPushStore();
			await settle();
			clearCalls(client);

			const source = createTestSource();
			store.dispatch(sourcesActions.applyRemoteSource({
				sourceId: source.id,
				remote: source.doc,
			}));
			await settle();

			expect(client.EnrollMessagingToken).toHaveBeenCalledTimes(1);
			expect(getNostrClientMock).toHaveBeenCalledWith(...clientFor(source));
		});

		it("does not enroll an update to an existing source", async () => {
			const [source] = createTestSources(1);
			const client = useClient(mockClient());
			const store = openPushStore({ sources: [source] });
			await settle();
			clearCalls(client);

			store.dispatch(sourcesActions.updateSourceLabel({
				sourceId: source.id,
				label: "renamed",
				by: TEST_CLOCK_BY,
			}));
			await settle();

			expect(client.EnrollMessagingToken).not.toHaveBeenCalled();
		});

		it("does not enroll a new source when no token is registered", async () => {
			const client = useClient(mockClient());
			const store = openPushStore({ token: null });
			await settle();

			const source = createTestSource();
			store.dispatch(sourcesActions._createDraftDoc({
				sourceId: source.id,
				draft: source.doc,
			}));
			await settle();

			expect(client.EnrollMessagingToken).not.toHaveBeenCalled();
		});
	});

	describe("beacon freshness", () => {
		it("enrolls a source when its beacon becomes fresh", async () => {
			const [source] = createTestSources(1);
			const client = useClient(mockClient());
			const store = openPushStore({ sources: [source] });
			await settle();
			clearCalls(client);

			store.dispatch(seeBeacon(source.lpk));
			await settle();

			expect(client.EnrollMessagingToken).toHaveBeenCalledTimes(1);
			expect(getNostrClientMock).toHaveBeenCalledWith(...clientFor(source));
		});

		it("enrolls every live source sharing that lpk", async () => {
			const lpk = createTestSource().lpk;
			const a = createTestSource({ lpk, relays: [TEST_RELAY_URL] });
			const b = createTestSource({ lpk, relays: [TEST_RELAY_URL] });
			const other = createTestSource();
			const client = useClient(mockClient());
			const store = openPushStore({ sources: [a, b, other] });
			await settle();
			clearCalls(client);

			store.dispatch(seeBeacon(lpk));
			await settle();

			expect(client.EnrollMessagingToken).toHaveBeenCalledTimes(2);
			expect(getNostrClientMock).toHaveBeenCalledWith(...clientFor(a));
			expect(getNostrClientMock).toHaveBeenCalledWith(...clientFor(b));
		});

		it("does not enroll a source that was already fresh", async () => {
			const [source] = createTestSources(1);
			const client = useClient(mockClient());
			const store = openPushStore({
				sources: [source],
				beacons: beaconsStateOf({
					nodes: [createTestBeaconNode({
						lpk: source.lpk,
						relays: { [TEST_RELAY_URL]: { lastSeenAtMs: NOW_MS } },
					})],
				}),
			});
			await settle();
			clearCalls(client);

			store.dispatch(seeBeacon(source.lpk, TEST_RELAY_URL, NOW_MS + 1));
			await settle();

			expect(client.EnrollMessagingToken).not.toHaveBeenCalled();
		});
	});

	describe("unload", () => {
		it("does not enroll a source added after the identity unloads", async () => {
			const client = useClient(mockClient());
			const store = openPushStore();
			await settle();
			clearCalls(client);

			const unloaded = createDeferred<void>();
			store.dispatch(identityUnloaded({ deferred: unloaded }));
			await unloaded;

			const source = createTestSource();
			store.dispatch(sourcesActions._createDraftDoc({
				sourceId: source.id,
				draft: source.doc,
			}));
			await settle();

			expect(client.EnrollMessagingToken).not.toHaveBeenCalled();
		});
	});
});
