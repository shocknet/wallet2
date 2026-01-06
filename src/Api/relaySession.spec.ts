import { describe, it, expect, vi, Mock } from "vitest";
import { CLIENTS_RPC_SUBID, NostrKeyPair, RelaySession } from "./nostrHandler";
import { createDeferred } from "@/lib/deferred";

type Filter = any;

class FakeSub {
	id: string;
	filters: Filter[];
	lastEmitted?: number;
	closed = false;

	fire = vi.fn();
	constructor(id: string, filters: Filter[]) {
		this.id = id;
		this.filters = filters;
	}
}

class FakeRelay {
	connected = false;

	connect = vi.fn(async () => {
		this.connected = true;
	});

	close = vi.fn(() => {
		this.connected = false;
	});

	prepareSubscription = vi.fn((filters: Filter[], params: any) => {
		return new FakeSub(params.id ?? "sub_" + Math.random(), filters);
	});
}

const getPrepareSubscriptionRpcCall = (prepMock: Mock<(filters: Filter[], params: any) => FakeSub>) =>
	prepMock.mock.calls.find(
		(c) => c[1]?.id === CLIENTS_RPC_SUBID
	);

const getPrepareSubscriptionRpcCallResult = (prepMock: Mock<(filters: Filter[], params: any) => FakeSub>) =>
	prepMock.mock.results.find(
		(r) => r.value?.id === CLIENTS_RPC_SUBID
	)?.value as FakeSub;

const keys1: NostrKeyPair = { publicKey: "pub1", privateKey: "priv1" };
const keys2: NostrKeyPair = { publicKey: "pub2", privateKey: "priv2" };

describe("RelaySession", () => {

	describe("RelaySession interests application", () => {

		it("creates rpc sub, fires it, resolves waiter", async () => {
			const relay = new FakeRelay();
			const emitter = { emit: vi.fn() } as any;

			const s = new RelaySession("wss://x", relay as any, emitter, new Set());

			await s.ensureRpcReadyForRecipient(keys1, "lpkA");

			expect(relay.connect).toHaveBeenCalledTimes(1);
			expect(relay.prepareSubscription).toHaveBeenCalled();

			const rpcSubCall = getPrepareSubscriptionRpcCall(relay.prepareSubscription);
			expect(rpcSubCall).toBeTruthy();

			const createdSub = getPrepareSubscriptionRpcCallResult(relay.prepareSubscription);
			expect(createdSub).toBeTruthy();

			expect(createdSub.fire).toHaveBeenCalledTimes(1);
			expect(createdSub.filters[0]["#p"]).toEqual(["pub1"]);
		});

		it("updates rpc sub when adding another recipient", async () => {
			const relay = new FakeRelay();
			const emitter = { emit: vi.fn() } as any;

			const s = new RelaySession("wss://x", relay as any, emitter, new Set());

			await s.ensureRpcReadyForRecipient(keys1, "lpkA");
			await s.ensureRpcReadyForRecipient(keys2, "lpkA");

			expect(relay.connect).toHaveBeenCalledTimes(2);

			// prepareSubscription should have been called once for rpc_sub.
			// The second client would just re-fire the existing sub object
			const rpcPrepCalls = relay.prepareSubscription.mock.calls.filter(
				(c) => c[1]?.id === CLIENTS_RPC_SUBID
			);
			expect(rpcPrepCalls.length).toBe(1);

			const createdSub = getPrepareSubscriptionRpcCallResult(relay.prepareSubscription);

			// Fired once on create, once on update
			expect(createdSub.fire).toHaveBeenCalledTimes(2);
			expect(createdSub.filters[0]["#p"].sort()).toEqual(["pub1", "pub2"]);
		});

		it("coalesces burst while connect is in-flight (sub includes both)", async () => {
			const relay = new FakeRelay();
			const emitter = { emit: vi.fn() } as any;

			let resolveConnect!: () => void;

			relay.connected = false;

			relay.connect = vi.fn(() => {
				if (relay.connected) return Promise.resolve();
				return new Promise<void>((res) => {
					resolveConnect = () => {
						relay.connected = true;
						res();
					};
				});
			});

			const s = new RelaySession("wss://x", relay as any, emitter, new Set());

			const p1 = s.ensureRpcReadyForRecipient(keys1, "lpkA");
			const p2 = s.ensureRpcReadyForRecipient(keys2, "lpkA");

			resolveConnect();
			await Promise.all([p1, p2]);

			const sub = getPrepareSubscriptionRpcCallResult(relay.prepareSubscription);

			expect(sub.filters[0]["#p"].sort()).toEqual(["pub1", "pub2"]);
		});
		it("rejects waiters if connect fails (no hangs)", async () => {
			const relay = new FakeRelay();
			const emitter = { emit: vi.fn() } as any;

			const err = new Error("boom")

			relay.connect = vi.fn(async () => {
				throw err;
			});

			const s = new RelaySession("wss://x", relay as any, emitter, new Set());

			await expect(s.ensureRpcReadyForRecipient(keys1, "lpkA")).rejects.toThrow(err);
		});

		it("coalesces multiple ensureRpcReadyForRecipient calls into one rpc_sub update", async () => {
			const relay = new FakeRelay();
			const emitter = { emit: vi.fn() } as any;

			// Block connect so we can register both recipients before connect resolves
			const c = createDeferred<void>();
			relay.connect = vi.fn(async () => c.then(() => (relay.connected = true)));

			const s = new RelaySession("wss://x", relay as any, emitter, new Set());

			const p1 = s.ensureRpcReadyForRecipient(keys1, "lpkA");
			const p2 = s.ensureRpcReadyForRecipient(keys2, "lpkA");

			await Promise.resolve();
			expect(relay.prepareSubscription).toHaveBeenCalledTimes(0);

			c.resolve();
			await Promise.all([p1, p2]);

			const rpcPrepCalls = relay.prepareSubscription.mock.calls.filter(
				(c) => c[1]?.id === CLIENTS_RPC_SUBID
			);

			expect(rpcPrepCalls.length).toBe(1);

			const rpcSub = getPrepareSubscriptionRpcCallResult(relay.prepareSubscription);

			expect(rpcSub).toBeTruthy();
			expect([...rpcSub.filters[0]["#p"]].sort()).toEqual(["pub1", "pub2"]);
		});
	});


	describe("RelaySession lifecycle", () => {
		it("pause() during in-flight connect prevents sub creation; resume() later resolves waiter", async () => {
			const relay = new FakeRelay();
			const emitter = { emit: vi.fn() } as any;

			// First connect is blocked until we resolve it.
			const c1 = createDeferred<void>();
			const c2 = createDeferred<void>();
			let connectCall = 0;

			relay.connect = vi.fn(async () => {
				connectCall++;
				if (connectCall === 1) {
					return c1.then(() => {
						relay.connected = true;
					});
				}
				return c2.then(() => {
					relay.connected = true;
				});
			});

			const s = new RelaySession("wss://x", relay as any, emitter, new Set());

			// Start readiness; it will trigger connect() but not finish.
			const readyP = s.ensureRpcReadyForRecipient(keys1, "lpkA");
			await vi.waitFor(() => {
				if (vi.mocked(relay.connect).mock.calls.length === 0) throw new Error
			});

			expect(relay.connect).toHaveBeenCalledTimes(1);
			expect(relay.prepareSubscription).toHaveBeenCalledTimes(0); // doesn't call prepareSubscription yet

			// Pause while connect is in-flight
			s.pause();
			expect(relay.close).toHaveBeenCalledTimes(1);

			// Let the original connect resolve; actor should abort due to paused/epoch mismatch
			c1.resolve();

			await Promise.resolve();

			// Still no subscription creation, and waiter still not resolved.
			expect(relay.prepareSubscription).toHaveBeenCalledTimes(0);


			// Resume; this kicks the actor again and it will call connect() again.
			s.resume();
			await Promise.resolve();

			expect(relay.connect).toHaveBeenCalledTimes(2);

			// Now let connect #2 finish; actor should create subs and resolve waiter.
			c2.resolve();
			await readyP;

			const rpcSub = getPrepareSubscriptionRpcCallResult(relay.prepareSubscription);

			expect(rpcSub).toBeTruthy();
			expect(rpcSub.filters[0]["#p"]).toEqual(["pub1"]);
		});

		it("idempotent pause", async () => {
			const relay = new FakeRelay();
			const emitter = { emit: vi.fn() } as any;
			const s = new RelaySession("wss://x", relay as any, emitter, new Set());

			s.pause();
			s.pause();
			expect(relay.close).toHaveBeenCalledTimes(1);

		});
	});
});




