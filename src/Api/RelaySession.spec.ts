import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WebSocket from "ws";
import { finalizeEvent, generateSecretKey, getPublicKey, verifyEvent } from "nostr-tools";
import { AbstractRelay } from "./AbstractRelay";
import { RelaySession } from "./nostrHandler";
import { MockNostrRelay } from "@tests/support/mock-nostr-relay";


const keys = (name: string) => ({
	publicKey: `pub-${name}`,
	privateKey: `priv-${name}`,
});

const rpcFilter = (frame: Awaited<ReturnType<MockNostrRelay["waitForReq"]>>) =>
	frame.message[2] as { kinds: number[]; "#p": string[]; since: number };

const beaconFilter = (frame: Awaited<ReturnType<MockNostrRelay["waitForReq"]>>) =>
	frame.message[2] as { kinds: number[]; authors: string[]; "#d": string[] };

async function flush() {
	// Advance the event-loop turn for socket callbacks and the serialized actor.
	await new Promise<void>(resolve => setTimeout(resolve, 15));
}

describe("RelaySession + real AbstractRelay + WebSocket mock relay", () => {
	let server: MockNostrRelay;
	let relay: AbstractRelay;
	let session: RelaySession;
	let emitter: { emit: ReturnType<typeof vi.fn> };
	let handledEvents: Set<string>;

	beforeEach(async () => {
		server = await MockNostrRelay.start();
		relay = new AbstractRelay(server.url, {
			verifyEvent,
			websocketImplementation: WebSocket as unknown as typeof globalThis.WebSocket,
			enableReconnect: true,
		});
		emitter = { emit: vi.fn() };
		handledEvents = new Set<string>();
		session = new RelaySession(
			server.url,
			relay,
			emitter as unknown as ConstructorParameters<typeof RelaySession>[2],
			handledEvents,
		);
	});

	afterEach(async () => {
		session.dispose();
		await server.stop();
		vi.restoreAllMocks();
	});

	async function initialA(lpk = "lpk-A") {
		const ready = session.ensureReady(keys("A"), lpk);
		const rpc = await server.waitForReq("rpc:1");
		const beacons = await server.waitForReq("beacons:1");
		expect(beacons.connectionId).toBe(rpc.connectionId);
		server.send(["EOSE", rpc.message[1]], rpc.connectionId);
		server.send(["EOSE", beacons.message[1]], beacons.connectionId);
		await ready;
		await vi.waitFor(() => expect(relay.openSubs.get("beacons:1")?.eosed).toBe(true));
		return { rpc, beacons };
	}

	it("coalesces A, B, C on initial connect and sends the correct filters", async () => {
		const a = session.ensureReady(keys("A"), "lpk-A");
		const b = session.ensureReady(keys("B"), "lpk-B");
		const c = session.ensureReady(keys("C"), "lpk-C");

		const rpc = await server.waitForReq("rpc:1");
		const beacon = await server.waitForReq("beacons:1");

		expect(rpcFilter(rpc).kinds).toEqual([21000, 24133]);
		expect(rpcFilter(rpc)["#p"]).toEqual(["pub-A", "pub-B", "pub-C"]);
		expect(beaconFilter(beacon)).toEqual({
			kinds: [30078],
			authors: ["lpk-A", "lpk-B", "lpk-C"],
			"#d": ["Lightning.Pub"],
		});
		expect(server.frames.filter(f => f.message[0] === "REQ")).toHaveLength(2);

		server.send(["EOSE", "rpc:1"], rpc.connectionId);
		server.send(["EOSE", "beacons:1"], beacon.connectionId);
		await Promise.all([a, b, c]);
	});

	it("requires a genuine RPC EOSE; beacon EOSE alone cannot resolve readiness", async () => {
		const resolved = vi.fn();
		const ready = session.ensureReady(keys("A"), "lpk-A").then(resolved);
		const rpc = await server.waitForReq("rpc:1");
		const beacon = await server.waitForReq("beacons:1");

		server.send(["EOSE", "beacons:1"], beacon.connectionId);
		await flush();
		expect(resolved).not.toHaveBeenCalled();
		expect(relay.openSubs.get("rpc:1")?.eosed).toBe(false);

		server.send(["EOSE", "rpc:1"], rpc.connectionId);
		await ready;
		expect(resolved).toHaveBeenCalledTimes(1);
	});

	it("keeps old RPC and beacon REQs live until their independent handovers reach EOSE", async () => {
		const old = await initialA();
		const bReady = session.ensureReady(keys("B"), "lpk-B");
		const rpc2 = await server.waitForReq("rpc:2");
		const beacon2 = await server.waitForReq("beacons:2");

		expect(rpcFilter(rpc2)["#p"]).toEqual(["pub-A", "pub-B"]);
		expect(beaconFilter(beacon2).authors).toEqual(["lpk-A", "lpk-B"]);
		expect(server.hasFrame("CLOSE", "rpc:1")).toBe(false);
		expect(server.hasFrame("CLOSE", "beacons:1")).toBe(false);
		expect(relay.openSubs.has("rpc:1")).toBe(true);
		expect(relay.openSubs.has("rpc:2")).toBe(true);

		server.send(["EOSE", "rpc:2"], rpc2.connectionId);
		await bReady;
		await server.waitForClose("rpc:1");
		expect(server.hasFrame("CLOSE", "beacons:1")).toBe(false);
		expect(relay.openSubs.has("rpc:1")).toBe(false);

		server.send(["EOSE", "beacons:2"], beacon2.connectionId);
		await server.waitForClose("beacons:1");
		expect(relay.openSubs.has("beacons:1")).toBe(false);
		expect(relay.openSubs.has("beacons:2")).toBe(true);
		expect(old.rpc.connectionId).toBe(rpc2.connectionId);
	});

	it("continues receiving RPC events on the old subscription during a handover", async () => {
		const first = await initialA();
		const oldSub = relay.openSubs.get("rpc:1")!;
		const delivered = vi.fn();
		oldSub.onevent = delivered;

		const readyB = session.ensureReady(keys("B"), "lpk-B");
		const rpc2 = await server.waitForReq("rpc:2");
		const beacon2 = await server.waitForReq("beacons:2");

		const event = finalizeEvent({
			kind: 21000,
			created_at: Math.floor(Date.now() / 1000),
			tags: [["p", "pub-A"]],
			content: "in-flight event",
		}, generateSecretKey());
		server.send(["EVENT", "rpc:1", event], first.rpc.connectionId);
		await vi.waitFor(() => expect(delivered).toHaveBeenCalledOnce());

		server.send(["EOSE", "rpc:2"], rpc2.connectionId);
		await readyB;
		await server.waitForClose("rpc:1");
		server.send(["EOSE", "beacons:2"], beacon2.connectionId);
	});

	it("serializes A -> A+B -> A+B+C, with at most two RPC subscriptions in flight", async () => {
		await initialA();

		const bResolved = vi.fn();
		const cResolved = vi.fn();
		const readyB = session.ensureReady(keys("B"), "lpk-B").then(bResolved);
		const rpc2 = await server.waitForReq("rpc:2");
		const beacon2 = await server.waitForReq("beacons:2");
		const readyC = session.ensureReady(keys("C"), "lpk-C").then(cResolved);

		await flush();
		expect(server.hasFrame("REQ", "rpc:3")).toBe(false);
		expect(server.hasFrame("REQ", "beacons:3")).toBe(false);
		expect(bResolved).not.toHaveBeenCalled();
		expect(cResolved).not.toHaveBeenCalled();

		// A"s old EOSE cannot complete either new recipient"s readiness.
		server.send(["EOSE", "rpc:1"], rpc2.connectionId);
		await flush();
		expect(bResolved).not.toHaveBeenCalled();

		server.send(["EOSE", "rpc:2"], rpc2.connectionId);
		await readyB;
		expect(cResolved).not.toHaveBeenCalled();
		expect(server.hasFrame("REQ", "rpc:3")).toBe(false);

		// Actor waits for BOTH handovers before starting its next pass.
		server.send(["EOSE", "beacons:2"], beacon2.connectionId);
		const rpc3 = await server.waitForReq("rpc:3");
		const beacon3 = await server.waitForReq("beacons:3");
		expect(rpcFilter(rpc3)["#p"]).toEqual(["pub-A", "pub-B", "pub-C"]);
		expect(beaconFilter(beacon3).authors).toEqual(["lpk-A", "lpk-B", "lpk-C"]);
		expect(relay.openSubs.has("rpc:2")).toBe(true);
		expect(relay.openSubs.has("rpc:3")).toBe(true);
		expect([...relay.openSubs.keys()].filter(id => id.startsWith("rpc:"))).toHaveLength(2);

		server.send(["EOSE", "rpc:3"], rpc3.connectionId);
		await readyC;
		await server.waitForClose("rpc:2");
		server.send(["EOSE", "beacons:3"], beacon3.connectionId);
		await server.waitForClose("beacons:2");
	});

	it("does not make already-ready A wait for B's handover", async () => {
		await initialA();
		const bReady = session.ensureReady(keys("B"), "lpk-B");
		const rpc2 = await server.waitForReq("rpc:2");
		const beacon2 = await server.waitForReq("beacons:2");

		await session.ensureReady(keys("A"), "lpk-A");
		expect(server.hasFrame("REQ", "rpc:3")).toBe(false);
		server.send(["EOSE", "rpc:2"], rpc2.connectionId);
		await bReady;
		server.send(["EOSE", "beacons:2"], beacon2.connectionId);
	});

	it("on RPC CLOSED, rejects B but retains confirmed A; an explicit retry uses a fresh ID", async () => {
		await initialA();
		const readyB = session.ensureReady(keys("B"), "lpk-B");
		const rejection = expect(readyB).rejects.toThrow(/blocked/);
		const rpc2 = await server.waitForReq("rpc:2");
		const beacon2 = await server.waitForReq("beacons:2");

		server.send(["CLOSED", "rpc:2", "blocked"], rpc2.connectionId);
		server.send(["EOSE", "beacons:2"], beacon2.connectionId);
		await rejection;
		await flush();
		expect(relay.openSubs.has("rpc:1")).toBe(true);
		expect(relay.openSubs.get("rpc:1")?.eosed).toBe(true);
		expect(relay.openSubs.has("rpc:2")).toBe(false);
		expect(server.hasFrame("CLOSE", "rpc:1")).toBe(false);
		expect(server.hasFrame("REQ", "rpc:3")).toBe(false);

		const retryB = session.ensureReady(keys("B"), "lpk-B");
		const rpc3 = await server.waitForReq("rpc:3");
		server.send(["EOSE", "rpc:3"], rpc3.connectionId);
		await retryB;
		await server.waitForClose("rpc:1");
	});

	it("on beacon CLOSED, preserves beacon coverage without failing RPC readiness", async () => {
		await initialA();
		const readyB = session.ensureReady(keys("B"), "lpk-B");
		const rpc2 = await server.waitForReq("rpc:2");
		const beacon2 = await server.waitForReq("beacons:2");

		server.send(["CLOSED", "beacons:2", "not allowed"], beacon2.connectionId);
		server.send(["EOSE", "rpc:2"], rpc2.connectionId);
		await readyB;
		await flush();
		expect(relay.openSubs.has("beacons:1")).toBe(true);
		expect(relay.openSubs.has("beacons:2")).toBe(false);
		expect(server.hasFrame("CLOSE", "beacons:1")).toBe(false);

		const readyC = session.ensureReady(keys("C"), "lpk-C");
		const rpc3 = await server.waitForReq("rpc:3");
		const beacon3 = await server.waitForReq("beacons:3");
		server.send(["EOSE", "rpc:3"], rpc3.connectionId);
		server.send(["EOSE", "beacons:3"], beacon3.connectionId);
		await readyC;
		await server.waitForClose("beacons:1");
	});

	it("rejects conflicting private keys without opening another subscription", async () => {
		await initialA();
		await expect(session.ensureReady({ publicKey: "pub-A", privateKey: "wrong" }, "lpk-A"))
			.rejects.toThrow(/conflicting private keys/);
		await flush();
		expect(server.hasFrame("REQ", "rpc:2")).toBe(false);
	});


	it("deduplicates RPC and beacons events via the shared handledEvents but not beacon events", async () => {
		const secretKey = generateSecretKey();
		const lpk = getPublicKey(secretKey);
		const first = await initialA(lpk);
		const rpcSub = relay.openSubs.get("rpc:1")!;
		const beaconSub = relay.openSubs.get("beacons:1")!;
		const rpcReceived = vi.fn();
		const beaconReceived = vi.fn();
		const rpcDelivered = vi.fn();
		const beaconDelivered = vi.fn();
		rpcSub.receivedEvent = rpcReceived;
		beaconSub.receivedEvent = beaconReceived;
		rpcSub.onevent = rpcDelivered;
		beaconSub.onevent = beaconDelivered;

		const now = Math.floor(Date.now() / 1000);
		const rpcEvent = finalizeEvent({
			kind: 21000, created_at: now, tags: [["p", "pub-A"]], content: "test",
		}, secretKey);
		const beaconEvent = finalizeEvent({
			kind: 30078, created_at: now, tags: [["d", "Lightning.Pub"]], content: "{}",
		}, secretKey);

		handledEvents.add(rpcEvent.id);
		handledEvents.add(beaconEvent.id);
		server.send(["EVENT", "rpc:1", rpcEvent], first.rpc.connectionId);
		server.send(["EVENT", "beacons:1", beaconEvent], first.beacons.connectionId);
		await vi.waitFor(() => {
			expect(rpcReceived).toHaveBeenCalledTimes(1);
			expect(beaconReceived).toHaveBeenCalledTimes(1);
			expect(beaconDelivered).toHaveBeenCalledTimes(1);
		});
		expect(rpcDelivered).not.toHaveBeenCalled();
	});

	// This integration test takes ~8 s because RelaySession__ currently fixes
	// INTERNAL_EOSE_TIMEOUT_MS at 8_000. It intentionally uses real timers.
	it("treats a missing RPC EOSE as failure, never as readiness", async () => {
		const ready = session.ensureReady(keys("A"), "lpk-A");
		const rejection = expect(ready).rejects.toThrow(/EOSE timed out/);
		await server.waitForReq("rpc:1");
		const beacon = await server.waitForReq("beacons:1");
		server.send(["EOSE", "beacons:1"], beacon.connectionId);
		await rejection;
		expect(relay.openSubs.has("rpc:1")).toBe(false);
		expect(relay.openSubs.has("beacons:1")).toBe(true);
	}, 12_000);


	describe("lifecycle", () => {
		// `ws` ordinarily exposes native ping/pong. Hiding ping lets these tests
		// exercise browser-style Nostr REQ/EOSE pings over a real WebSocket.
		class BrowserLikeWebSocket extends WebSocket {
			constructor(url: string | URL) {
				super(url);
				Object.defineProperty(this, "ping", { value: undefined });
			}
		}

		function useBrowserTransport() {
			relay = new AbstractRelay(server.url, {
				verifyEvent,
				websocketImplementation: BrowserLikeWebSocket as unknown as typeof globalThis.WebSocket,
				enableReconnect: true,
				enablePing: true,
			});
			// Avoid periodic pings interfering with the explicit foreground tests.
			relay.pingFrequency = 60_000;
			relay.pingTimeout = 1_000;
			session = new RelaySession(
				server.url,
				relay,
				emitter as unknown as ConstructorParameters<typeof RelaySession>[2],
				handledEvents,
			);
		}

		async function reconnectedReq(id: string, previousConnection: number) {
			return server.waitForFrame(({ connectionId, message }) =>
				connectionId > previousConnection && message[0] === "REQ" && message[1] === id,
			);
		}

		async function pingReq(connectionId: number) {
			return server.waitForFrame(({ connectionId: conn, message }) =>
				conn === connectionId && message[0] === "REQ" &&
				typeof message[1] === "string" && message[1].startsWith("forced-ping:"),
			);
		}

		it("native background retains active RPC, beacon and document subscriptions; foreground re-fires the same objects", async () => {
			const first = await initialA();
			const documents = relay.subscribe([{ kinds: [1] }], { id: "documents", onevent: vi.fn() });
			await server.waitForReq("documents", first.rpc.connectionId);
			const rpc = relay.openSubs.get("rpc:1")!;
			const beacons = relay.openSubs.get("beacons:1")!;

			session.onNativeBackground();
			expect(session.isConnected()).toBe(false);
			expect(relay.openSubs.get("rpc:1")).toBe(rpc);
			expect(relay.openSubs.get("beacons:1")).toBe(beacons);
			expect(relay.openSubs.get("documents")).toBe(documents);
			expect([rpc, beacons, documents].every(sub => !sub.closed && !sub.eosed)).toBe(true);

			const resolved = vi.fn();
			const readyAgain = session.ensureReady(keys("A"), "lpk-A").then(resolved);
			await flush();
			expect(server.connectionCount).toBe(1);
			expect(resolved).not.toHaveBeenCalled();

			session.onNativeForeground();
			const rpcAgain = await reconnectedReq("rpc:1", first.rpc.connectionId);
			const connection = rpcAgain.connectionId;
			await server.waitForReq("beacons:1", connection);
			await server.waitForReq("documents", connection);
			expect(relay.openSubs.get("documents")).toBe(documents);
			expect(server.hasFrame("REQ", "rpc:2", connection)).toBe(false);

			server.send(["EOSE", "beacons:1"], connection);
			await flush();
			expect(resolved).not.toHaveBeenCalled();
			server.send(["EOSE", "rpc:1"], connection);
			await readyAgain;
			expect(resolved).toHaveBeenCalledOnce();
			expect(relay.openSubs.get("rpc:1")).toBe(rpc);
		});

		it("does not start a connection for interests registered while native is backgrounded", async () => {
			session.onNativeBackground();
			const readyA = session.ensureReady(keys("A"), "lpk-A");
			const readyB = session.ensureReady(keys("B"), "lpk-B");
			await flush();
			expect(server.connectionCount).toBe(0);
			expect(relay.openSubs.size).toBe(0);

			session.onNativeForeground();
			const rpc = await server.waitForReq("rpc:1");
			const beacons = await server.waitForReq("beacons:1");
			expect(rpcFilter(rpc)["#p"]).toEqual(["pub-A", "pub-B"]);
			expect(beaconFilter(beacons).authors).toEqual(["lpk-A", "lpk-B"]);
			server.send(["EOSE", "rpc:1"], rpc.connectionId);
			server.send(["EOSE", "beacons:1"], beacons.connectionId);
			await Promise.all([readyA, readyB]);
		});

		it("retains unconfirmed staged subscriptions on native background and waits for fresh EOSE on foreground", async () => {
			const resolved = vi.fn();
			const ready = session.ensureReady(keys("A"), "lpk-A").then(resolved);
			const first = await server.waitForReq("rpc:1");
			await server.waitForReq("beacons:1");
			const rpc = relay.openSubs.get("rpc:1")!;
			const beacons = relay.openSubs.get("beacons:1")!;

			session.onNativeBackground();
			expect(relay.openSubs.get("rpc:1")).toBe(rpc);
			expect(relay.openSubs.get("beacons:1")).toBe(beacons);
			expect(rpc.closed).toBe(false);
			expect(beacons.closed).toBe(false);
			expect(resolved).not.toHaveBeenCalled();

			session.onNativeForeground();
			const rpcAgain = await reconnectedReq("rpc:1", first.connectionId);
			const connection = rpcAgain.connectionId;
			await server.waitForReq("beacons:1", connection);
			expect(server.hasFrame("REQ", "rpc:2", connection)).toBe(false);
			server.send(["EOSE", "beacons:1"], connection);
			await flush();
			expect(resolved).not.toHaveBeenCalled();
			server.send(["EOSE", "rpc:1"], connection);
			await ready;
			expect(resolved).toHaveBeenCalledOnce();
			expect(relay.openSubs.get("rpc:1")).toBe(rpc);
		});

		it("retains an A -> A+B handover and serializes an interest added while paused", async () => {
			const first = await initialA();
			const resolvedB = vi.fn();
			const resolvedC = vi.fn();
			const readyB = session.ensureReady(keys("B"), "lpk-B").then(resolvedB);
			await server.waitForReq("rpc:2");
			await server.waitForReq("beacons:2");
			const rpc2 = relay.openSubs.get("rpc:2")!;
			const beacons2 = relay.openSubs.get("beacons:2")!;

			session.onNativeBackground();
			const readyC = session.ensureReady(keys("C"), "lpk-C").then(resolvedC);
			expect(relay.openSubs.get("rpc:2")).toBe(rpc2);
			expect(relay.openSubs.get("beacons:2")).toBe(beacons2);
			expect(rpc2.eosed).toBe(false);
			await flush();
			expect(resolvedB).not.toHaveBeenCalled();
			expect(resolvedC).not.toHaveBeenCalled();

			session.onNativeForeground();
			const again = await reconnectedReq("rpc:2", first.rpc.connectionId);
			const connection = again.connectionId;
			await Promise.all([
				server.waitForReq("rpc:1", connection),
				server.waitForReq("beacons:1", connection),
				server.waitForReq("beacons:2", connection),
			]);
			expect(rpcFilter(again)["#p"]).toEqual(["pub-A", "pub-B"]);
			expect(server.hasFrame("REQ", "rpc:3", connection)).toBe(false);
			server.send(["EOSE", "rpc:1"], connection);
			await flush();
			expect(resolvedB).not.toHaveBeenCalled();

			server.send(["EOSE", "rpc:2"], connection);
			await readyB;
			expect(resolvedC).not.toHaveBeenCalled();
			expect(server.hasFrame("REQ", "rpc:3", connection)).toBe(false);
			server.send(["EOSE", "beacons:2"], connection);

			const rpc3 = await server.waitForReq("rpc:3", connection);
			const beacon3 = await server.waitForReq("beacons:3", connection);
			expect(rpcFilter(rpc3)["#p"]).toEqual(["pub-A", "pub-B", "pub-C"]);
			expect(beaconFilter(beacon3).authors).toEqual(["lpk-A", "lpk-B", "lpk-C"]);
			expect(relay.openSubs.get("rpc:2")).toBe(rpc2);
			server.send(["EOSE", "rpc:3"], connection);
			await readyC;
			server.send(["EOSE", "beacons:3"], connection);
			await server.waitForClose("rpc:2", connection);
		});

		it("backgrounding during connect leaves readiness pending and foreground restarts it", async () => {
			const resolved = vi.fn();
			const ready = session.ensureReady(keys("A"), "lpk-A").then(resolved);
			// The first connect() has started, but its WebSocket has not opened yet.
			session.onNativeBackground();
			await flush();
			expect(session.isConnected()).toBe(false);
			expect(resolved).not.toHaveBeenCalled();

			session.onNativeForeground();
			const rpc = await server.waitForReq("rpc:1");
			const beacons = await server.waitForReq("beacons:1");
			server.send(["EOSE", "rpc:1"], rpc.connectionId);
			server.send(["EOSE", "beacons:1"], beacons.connectionId);
			await ready;
			expect(resolved).toHaveBeenCalledOnce();
		});

		it("handles rapid background/foreground/background/foreground without losing retained subscription identity", async () => {
			const first = await initialA();
			const rpc = relay.openSubs.get("rpc:1")!;
			session.onNativeBackground();
			session.onNativeForeground();
			session.onNativeBackground();
			const resolved = vi.fn();
			const ready = session.ensureReady(keys("A"), "lpk-A").then(resolved);
			session.onNativeForeground();

			const again = await reconnectedReq("rpc:1", first.rpc.connectionId);
			await server.waitForReq("beacons:1", again.connectionId);
			expect(resolved).not.toHaveBeenCalled();
			server.send(["EOSE", "rpc:1"], again.connectionId);
			await ready;
			expect(relay.openSubs.get("rpc:1")).toBe(rpc);
			expect(relay.openSubs.has("rpc:2")).toBe(false);
		});

		it("active RPC EOSE timeout after native resume rejects new ensureReady callers", async () => {
			const first = await initialA();
			const rpc = relay.openSubs.get("rpc:1")!;
			// On reconnection Subscription.fire() reads the current timeout value.
			rpc.eoseTimeout = 80;
			session.onNativeBackground();
			const rejection = expect(session.ensureReady(keys("A"), "lpk-A"))
				.rejects.toThrow(/EOSE timed out for rpc:1/);
			session.onNativeForeground();
			await reconnectedReq("rpc:1", first.rpc.connectionId);
			// No EOSE: the active subscription"s original `confirmed` promise
			// is already settled, but this NEW caller must still be rejected.
			await rejection;
			expect(relay.openSubs.get("rpc:1")).toBeUndefined(); // gets removed
			expect(rpc.eosed).toBe(false);
		});

		it("web foreground shares a ping and preserves an already responsive connection", async () => {
			useBrowserTransport();
			const first = await initialA();
			const rpc = relay.openSubs.get("rpc:1")!;
			const check1 = session.onWebForeground();
			const check2 = session.onWebForeground();
			expect(check2).toBe(check1);
			const ping = await pingReq(first.rpc.connectionId);
			const id = ping.message[1] as string;
			const resolved = vi.fn();
			const readyAgain = session.ensureReady(keys("A"), "lpk-A").then(resolved);
			await flush();
			expect(resolved).not.toHaveBeenCalled();

			server.send(["EOSE", id], ping.connectionId);
			await Promise.all([check1, check2, readyAgain]);
			await server.waitForClose(id, ping.connectionId);
			expect(server.connectionCount).toBe(1);
			expect(relay.openSubs.has(id)).toBe(false);
			expect(relay.openSubs.get("rpc:1")).toBe(rpc);
			expect(server.hasFrame("REQ", "rpc:2")).toBe(false);
		});

		it("web foreground also accepts a relay CLOSED response as proof of responsiveness", async () => {
			useBrowserTransport();
			const first = await initialA();
			const foreground = session.onWebForeground();
			const ping = await pingReq(first.rpc.connectionId);
			const id = ping.message[1] as string;
			server.send(["CLOSED", id, "unknown subscription"], ping.connectionId);
			await foreground;
			expect(server.connectionCount).toBe(1);
			expect(relay.openSubs.has(id)).toBe(false);
		});

		it("web ping timeout reconnects and waits for new RPC EOSE without replacing active subscriptions", async () => {
			useBrowserTransport();
			const first = await initialA();
			const rpc = relay.openSubs.get("rpc:1")!;
			relay.pingTimeout = 100;
			const foreground = session.onWebForeground();
			const resolved = vi.fn();
			const readyAgain = session.ensureReady(keys("A"), "lpk-A").then(resolved);
			await pingReq(first.rpc.connectionId);
			const again = await reconnectedReq("rpc:1", first.rpc.connectionId);
			await server.waitForReq("beacons:1", again.connectionId);
			await foreground;
			expect(resolved).not.toHaveBeenCalled();
			expect(relay.openSubs.get("rpc:1")).toBe(rpc);
			expect(server.hasFrame("REQ", "rpc:2", again.connectionId)).toBe(false);
			server.send(["EOSE", "rpc:1"], again.connectionId);
			await readyAgain;
		});

		it("web foreground connects an already disconnected relay without sending a ping", async () => {
			useBrowserTransport();
			const first = await initialA();
			relay.close();
			// Foreground, not ensureReady(), must initiate this reconnection.
			const foreground = session.onWebForeground();
			const resolved = vi.fn();
			const readyAgain = session.ensureReady(keys("A"), "lpk-A").then(resolved);
			const again = await reconnectedReq("rpc:1", first.rpc.connectionId);
			await server.waitForReq("beacons:1", again.connectionId);
			await foreground;
			expect(resolved).not.toHaveBeenCalled();
			expect(server.frames.some(f => f.message[0] === "REQ" &&
				String(f.message[1]).startsWith("forced-ping:"))).toBe(false);
			server.send(["EOSE", "rpc:1"], again.connectionId);
			await readyAgain;
		});

		it("web ping failure during A -> A+B handover retains and re-fires both staged and active subscriptions", async () => {
			useBrowserTransport();
			const first = await initialA();
			const resolvedB = vi.fn();
			const readyB = session.ensureReady(keys("B"), "lpk-B").then(resolvedB);
			await server.waitForReq("rpc:2");
			await server.waitForReq("beacons:2");
			const rpc2 = relay.openSubs.get("rpc:2")!;
			relay.pingTimeout = 100;
			const foreground = session.onWebForeground();
			await pingReq(first.rpc.connectionId);

			const rpcAgain = await reconnectedReq("rpc:2", first.rpc.connectionId);
			const connection = rpcAgain.connectionId;
			await Promise.all([
				server.waitForReq("rpc:1", connection),
				server.waitForReq("beacons:1", connection),
				server.waitForReq("beacons:2", connection),
			]);
			await foreground;
			expect(relay.openSubs.get("rpc:2")).toBe(rpc2);
			expect(resolvedB).not.toHaveBeenCalled();
			expect(server.hasFrame("REQ", "rpc:3", connection)).toBe(false);
			server.send(["EOSE", "rpc:2"], connection);
			await readyB;
			server.send(["EOSE", "beacons:2"], connection);
			await server.waitForClose("rpc:1", connection);
		});

		it("automatic ping timeout reconnects without an explicit foreground notification", async () => {
			useBrowserTransport();
			relay.pingFrequency = 120;
			relay.pingTimeout = 100;
			relay.resubscribeBackoff = [40];
			const first = await initialA();
			await pingReq(first.rpc.connectionId);
			// Do not reply; periodic ping must mark the socket unusable.
			const again = await reconnectedReq("rpc:1", first.rpc.connectionId);
			await server.waitForReq("beacons:1", again.connectionId);
			expect(relay.openSubs.has("rpc:1")).toBe(true);
			expect(relay.openSubs.has("rpc:2")).toBe(false);
			const readyAgain = session.ensureReady(keys("A"), "lpk-A");
			server.send(["EOSE", "rpc:1"], again.connectionId);
			await readyAgain;
		});
		it("queues ensureConnection during native background and resolves before EOSE on foreground", async () => {
			const rpcResolved = vi.fn();
			const ready = session.ensureReady(keys("A"), "lpk-A").then(rpcResolved);

			const first = await server.waitForReq("rpc:1");
			await server.waitForReq("beacons:1");

			// The reconciler is currently waiting for EOSE.
			session.onNativeBackground();

			const connectionResolved = vi.fn();
			const connection = session.ensureConnection().then(connectionResolved);

			await flush();
			expect(session.isConnected()).toBe(false);
			expect(server.connectionCount).toBe(1);
			expect(connectionResolved).not.toHaveBeenCalled();

			session.onNativeForeground();

			const again = await server.waitForFrame(({ connectionId, message }) =>
				connectionId > first.connectionId &&
				message[0] === "REQ" &&
				message[1] === "rpc:1"
			);

			await server.waitForReq("beacons:1", again.connectionId);

			// Connection readiness does NOT require EOSE.
			await connection;
			expect(connectionResolved).toHaveBeenCalledOnce();
			expect(rpcResolved).not.toHaveBeenCalled();

			// Existing staged subscriptions are reused.
			expect(server.hasFrame("REQ", "rpc:2")).toBe(false);

			server.send(["EOSE", "rpc:1"], again.connectionId);
			server.send(["EOSE", "beacons:1"], again.connectionId);

			await ready;
			expect(rpcResolved).toHaveBeenCalledOnce();
		});

		it("ensureConnection waits for an in-progress web foreground check", async () => {
			useBrowserTransport();
			await session.ensureConnection();
			const foreground = session.onWebForeground();
			const ping = await pingReq(1);

			const resolved = vi.fn();
			const connection = session.ensureConnection().then(resolved);
			await flush();
			expect(resolved).not.toHaveBeenCalled();
			expect(server.connectionCount).toBe(1);

			server.send(["EOSE", ping.message[1] as string], ping.connectionId);
			await Promise.all([foreground, connection]);
			expect(resolved).toHaveBeenCalledOnce();
			expect(server.connectionCount).toBe(1);
		});

		it("disposal during a web foreground ping cannot reconnect the abandoned session", async () => {
			useBrowserTransport();
			const first = await initialA();
			const foreground = session.onWebForeground();
			await pingReq(first.rpc.connectionId);

			session.dispose();
			await foreground;
			await flush();

			expect(relay.connected).toBe(false);
			expect(relay.openSubs.size).toBe(0);
			expect(server.connectionCount).toBe(1);
		});
	});

	describe("direct connection readiness", () => {
		it("connects without any subscriptions or EOSE, sharing the initial socket", async () => {
			const first = session.ensureConnection();
			const second = session.ensureConnection();
			const third = session.ensureConnection();
			await Promise.all([first, second, third]);
			await session.ensureConnection();

			expect(session.isConnected()).toBe(true);
			expect(server.connectionCount).toBe(1);
			expect(relay.openSubs.size).toBe(0);
			expect(server.frames.filter(frame => frame.message[0] === "REQ")).toHaveLength(0);
		});

		it("does not wait for a reconciler blocked on RPC and beacon EOSE", async () => {
			const readyResolved = vi.fn();
			const ready = session.ensureReady(keys("A"), "lpk-A").then(readyResolved);
			const rpc = await server.waitForReq("rpc:1");
			await server.waitForReq("beacons:1", rpc.connectionId);

			await session.ensureConnection();
			expect(readyResolved).not.toHaveBeenCalled();
			expect(server.connectionCount).toBe(1);

			server.send(["EOSE", "rpc:1"], rpc.connectionId);
			server.send(["EOSE", "beacons:1"], rpc.connectionId);
			await ready;
		});

		it("connects directly after an unexpected disconnect while reconciliation awaits EOSE", async () => {
			relay.resubscribeBackoff = [500];
			const readyResolved = vi.fn();
			const ready = session.ensureReady(keys("A"), "lpk-A").then(readyResolved);
			const original = await server.waitForReq("rpc:1");
			await server.waitForReq("beacons:1", original.connectionId);

			server.terminate(original.connectionId);
			await vi.waitFor(() => expect(session.isConnected()).toBe(false));

			await session.ensureConnection();
			const again = await server.waitForFrame(({ connectionId, message }) =>
				connectionId > original.connectionId && message[0] === "REQ" && message[1] === "rpc:1"
			);
			await server.waitForReq("beacons:1", again.connectionId);

			expect(server.connectionCount).toBe(2);
			expect(readyResolved).not.toHaveBeenCalled();
			server.send(["EOSE", "rpc:1"], again.connectionId);
			server.send(["EOSE", "beacons:1"], again.connectionId);
			await ready;
		});

		it("retains a pending connection request when native background interrupts connect", async () => {
			const resolved = vi.fn();
			const connection = session.ensureConnection().then(resolved);
			session.onNativeBackground();
			await flush();

			expect(session.isConnected()).toBe(false);
			expect(resolved).not.toHaveBeenCalled();

			session.onNativeForeground();
			await connection;
			expect(resolved).toHaveBeenCalledOnce();
			expect(session.isConnected()).toBe(true);
		});

		it("rejects every connection waiter when the direct connection attempt fails", async () => {
			const connect = vi.spyOn(relay, "connect").mockRejectedValue(new Error("connect failed"));
			const first = session.ensureConnection();
			const second = session.ensureConnection();
			await Promise.all([
				expect(first).rejects.toThrow("connect failed"),
				expect(second).rejects.toThrow("connect failed"),
			]);
			expect(server.connectionCount).toBe(0);

			connect.mockRestore();
			await session.ensureConnection();
			expect(session.isConnected()).toBe(true);
		});
	});

	describe("terminal disposal", () => {
		it("closes confirmed RPC, beacon and ordinary subscriptions and cannot resume", async () => {
			const first = await initialA();
			const onDocumentClose = vi.fn();
			const documents = session.subscribe([{ kinds: [1] }], {
				id: "documents", onclose: onDocumentClose,
			});
			await server.waitForReq("documents", first.rpc.connectionId);
			const rpc = relay.openSubs.get("rpc:1")!;
			const beacons = relay.openSubs.get("beacons:1")!;

			session.dispose();
			session.dispose();
			expect([rpc, beacons, documents].every(sub => sub.closed)).toBe(true);
			expect(onDocumentClose).toHaveBeenCalledOnce();
			expect(relay.openSubs.size).toBe(0);
			expect(session.isConnected()).toBe(false);

			await Promise.all([
				expect(session.ensureConnection()).rejects.toThrow("disposed"),
				expect(session.ensureReady(keys("B"), "lpk-B")).rejects.toThrow("disposed"),
			]);
			session.onNativeForeground();
			await flush();
			expect(server.connectionCount).toBe(1);
		});

		it("rejects connection and RPC readiness queued while backgrounded", async () => {
			session.onNativeBackground();
			const connection = session.ensureConnection();
			const ready = session.ensureReady(keys("A"), "lpk-A");
			const rejections = Promise.all([
				expect(connection).rejects.toThrow("disposed"),
				expect(ready).rejects.toThrow("disposed"),
			]);

			await flush();
			expect(server.connectionCount).toBe(0);
			session.dispose();
			await rejections;

			session.onNativeForeground();
			await flush();
			expect(server.connectionCount).toBe(0);
		});

		it("terminates an A -> A+B handover and rejects its pending readiness caller", async () => {
			const first = await initialA();
			const confirmed = relay.openSubs.get("rpc:1")!;
			const readyB = session.ensureReady(keys("B"), "lpk-B");
			const rejection = expect(readyB).rejects.toThrow(/disposed/);
			const staged = await server.waitForReq("rpc:2", first.rpc.connectionId);
			await server.waitForReq("beacons:2", staged.connectionId);

			session.dispose();
			await rejection;
			expect(confirmed.closed).toBe(true);
			expect(relay.openSubs.size).toBe(0);
			expect(session.isConnected()).toBe(false);

			session.onNativeForeground();
			await flush();
			expect(server.connectionCount).toBe(1);
		});
	});

});
