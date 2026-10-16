// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WebSocket from "ws";
import { verifyEvent, type Event as NostrEvent } from "nostr-tools";
import { AbstractRelay } from "./AbstractRelay";
import { MockNostrRelay, type RecordedFrame } from "@tests/support/mock-nostr-relay";



const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Exercise the browser WebSocket branch of AbstractRelay.ping() without
// depending on whether the test runner"s Node version has global WebSocket.
class BrowserLikeWebSocket extends WebSocket {
	constructor(url: string | URL) {
		super(url);
		// Browser WebSockets have no native ping/pong interface.
		Object.defineProperty(this, "ping", { value: undefined });
	}
}

function newRelay(
	url: string,
	options: { reconnect?: boolean; browserSocket?: boolean; autoPing?: boolean } = {},
) {
	return new AbstractRelay(url, {
		verifyEvent,
		enableReconnect: options.reconnect ?? true,
		enablePing: options.autoPing ?? false,
		websocketImplementation: (options.browserSocket ? BrowserLikeWebSocket : WebSocket) as unknown as typeof globalThis.WebSocket,
	});
}

function requestId(record: RecordedFrame): string {
	return record.message[1] as string;
}

async function waitForPingReq(server: MockNostrRelay, connectionId?: number) {
	return server.waitForFrame(({ connectionId: conn, message }) =>
		message[0] === "REQ" &&
		typeof message[1] === "string" &&
		message[1].startsWith("forced-ping:") &&
		(connectionId === undefined || conn === connectionId),
	);
}

describe("AbstractRelay connection reuse", () => {
	let server: MockNostrRelay;
	let relay: AbstractRelay;

	beforeEach(async () => {
		server = await MockNostrRelay.start();
		relay = newRelay(server.url);
	});

	afterEach(async () => {
		relay.close();
		await server.stop();
		vi.restoreAllMocks();
	});

	it("coalesces concurrent connect() calls and does not create extra sockets while connected", async () => {
		await Promise.all([relay.connect(), relay.connect(), relay.connect()]);
		await relay.connect();

		expect(relay.connected).toBe(true);
		expect(server.connectionCount).toBe(1);
	});

	it("manual close retains subscriptions, disarms EOSE, and notifies the old socket", async () => {
		const relayClosed = vi.fn();
		const subClosed = vi.fn();
		relay.onclose = relayClosed;
		const sub = relay.prepareSubscription([{ kinds: [21000] }], {
			id: "rpc:1", onclose: subClosed,
		});

		await relay.connect();
		const req = await server.waitForReq(sub.id, 1);
		server.send(["EOSE", sub.id], req.connectionId);
		await vi.waitFor(() => expect(sub.eosed).toBe(true));

		relay.close();
		expect(relay.connected).toBe(false);
		expect(sub.closed).toBe(false);
		expect(sub.eosed).toBe(false);
		expect(relay.openSubs.get(sub.id)).toBe(sub);
		expect(subClosed).not.toHaveBeenCalled();
		expect(relayClosed).toHaveBeenCalledTimes(1);
		await server.waitForClose(sub.id, req.connectionId);

		relay.close();
		expect(relayClosed).toHaveBeenCalledTimes(1);
	});

	it("reuses original subscription objects across multiple close/connect cycles without changing filters", async () => {
		const filters = [{ kinds: [1], since: 1234 }];
		const documents = relay.prepareSubscription(filters, { id: "documents" });
		const rpc = relay.prepareSubscription([{ kinds: [21000] }], { id: "rpc:1" });
		const onEose = vi.fn();
		documents.oneose = onEose;

		for (let connectionId = 1; connectionId <= 3; connectionId++) {
			await relay.connect();
			const req = await server.waitForReq(documents.id, connectionId);
			await server.waitForReq(rpc.id, connectionId);

			expect(req.message[2]).toEqual(filters[0]);
			expect(server.frames.filter(f => f.connectionId === connectionId && f.message[0] === "REQ"))
				.toHaveLength(2);
			expect(documents.eosed).toBe(false);

			server.send(["EOSE", documents.id], connectionId);
			await vi.waitFor(() => expect(onEose).toHaveBeenCalledTimes(connectionId));
			expect(documents.eosed).toBe(true);

			relay.close();
			expect(documents.eosed).toBe(false);
		}

		expect(server.connectionCount).toBe(3);
		expect(documents.filters).toEqual(filters);
		expect(relay.openSubs.get("documents")).toBe(documents);
		expect(relay.openSubs.get("rpc:1")).toBe(rpc);
	});

	it("can close a connection still CONNECTING, then connect successfully again", async () => {
		const connecting = relay.connect();
		const rejected = expect(connecting).rejects.toThrow("closed by us");

		relay.close();
		await rejected;
		expect(relay.connected).toBe(false);

		await relay.connect();
		expect(relay.connected).toBe(true);
	});

	it("a send awaiting an old connection rejects rather than leaking to a new socket", async () => {
		const connecting = relay.connect();
		const oldSend = relay.send(JSON.stringify(["REQ", "old-send", { kinds: [1] }]));
		const connectRejected = expect(connecting).rejects.toThrow();
		const sendRejected = expect(oldSend).rejects.toThrow();

		relay.close();
		await Promise.all([connectRejected, sendRejected]);
		await relay.connect();
		await relay.send(JSON.stringify(["REQ", "new-send", { kinds: [1] }]));
		await server.waitForReq("new-send");
		expect(server.hasFrame("REQ", "old-send")).toBe(false);
	});

	it("automatic reconnection restores retained subscriptions without mutating since", async () => {
		relay.resubscribeBackoff = [25];
		const subClosed = vi.fn();
		const sub = relay.prepareSubscription([{ kinds: [1], since: 100 }], {
			id: "documents", onclose: subClosed,
		});

		await relay.connect();
		await server.waitForReq(sub.id, 1);
		server.terminate(1);
		const req = await server.waitForReq(sub.id, 2);

		expect(req.message[2]).toEqual({ kinds: [1], since: 100 });
		expect(relay.connected).toBe(true);
		expect(relay.openSubs.get(sub.id)).toBe(sub);
		expect(sub.closed).toBe(false);
		expect(subClosed).not.toHaveBeenCalled();
	});

	it("manual close cancels automatic reconnection already scheduled by a failure", async () => {
		relay.resubscribeBackoff = [130];
		const onclose = vi.fn();
		relay.onclose = onclose;
		await relay.connect();
		server.terminate(1);
		await vi.waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));

		relay.close();
		await sleep(180);
		expect(server.connectionCount).toBe(1);
		expect(relay.connected).toBe(false);
	});

	it("explicit connect during reconnect backoff cancels the older retry timer", async () => {
		relay.resubscribeBackoff = [160];
		const onclose = vi.fn();
		relay.onclose = onclose;
		await relay.connect();
		server.terminate(1);
		await vi.waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));

		await relay.connect();
		await sleep(220);
		expect(server.connectionCount).toBe(2);
		expect(relay.connected).toBe(true);
	});

	it("unexpected disconnect closes subscriptions if enableReconnect is false", async () => {
		relay.close();
		relay = newRelay(server.url, { reconnect: false });
		const subClosed = vi.fn();
		const sub = relay.prepareSubscription([{ kinds: [1] }], {
			id: "documents", onclose: subClosed,
		});
		await relay.connect();
		await server.waitForReq(sub.id, 1);

		server.terminate(1);
		await vi.waitFor(() => expect(sub.closed).toBe(true));
		expect(relay.openSubs.has(sub.id)).toBe(false);
		expect(subClosed).toHaveBeenCalledTimes(1);
	});

	it("rejects pending publish and count when a connection closes", async () => {
		await relay.connect();
		const publishing = relay.publish({ id: "a".repeat(64) } as NostrEvent);
		const counting = relay.count([{ kinds: [1] }], { id: "count:test" });
		const rejectedPublish = expect(publishing).rejects.toThrow("closed by us");
		const rejectedCount = expect(counting).rejects.toThrow("closed by us");

		await server.waitForFrame(f => f.message[0] === "EVENT");
		await server.waitForFrame(f => f.message[0] === "COUNT");
		relay.close();
		await Promise.all([rejectedPublish, rejectedCount]);
	});
});

describe("AbstractRelay subscription lifecycle and genuine EOSE", () => {
	let server: MockNostrRelay;
	let relay: AbstractRelay;

	beforeEach(async () => {
		server = await MockNostrRelay.start();
		relay = newRelay(server.url);
	});

	afterEach(async () => {
		relay.close();
		await server.stop();
		vi.restoreAllMocks();
	});

	it("EOSE timeout does not indicate readiness; a late real EOSE still succeeds", async () => {
		await relay.connect();
		const onTimeout = vi.fn();
		const onEose = vi.fn();
		const sub = relay.subscribe([{ kinds: [1] }], {
			id: "late-eose", eoseTimeout: 60,
			onEoseTimeout: onTimeout, oneose: onEose,
		});
		const req = await server.waitForReq(sub.id);

		await vi.waitFor(() => expect(onTimeout).toHaveBeenCalledTimes(1));
		expect(sub.eosed).toBe(false);
		expect(onEose).not.toHaveBeenCalled();

		server.send(["EOSE", sub.id], req.connectionId);
		await vi.waitFor(() => expect(onEose).toHaveBeenCalledTimes(1));
		expect(sub.eosed).toBe(true);
	});

	it("closing a subscription cancels its EOSE timer and is idempotent", async () => {
		await relay.connect();
		const onTimeout = vi.fn();
		const onclose = vi.fn();
		const sub = relay.subscribe([{ kinds: [1] }], {
			id: "removed", eoseTimeout: 60, onclose,
			onEoseTimeout: onTimeout,
		});
		await server.waitForReq(sub.id);
		sub.close();
		sub.close();
		await server.waitForClose(sub.id);
		await sleep(110);

		expect(sub.closed).toBe(true);
		expect(sub.eosed).toBe(false);
		expect(onclose).toHaveBeenCalledTimes(1);
		expect(onTimeout).not.toHaveBeenCalled();
		expect(relay.openSubs.has(sub.id)).toBe(false);
		expect(server.frames.filter(f => f.message[0] === "CLOSE" && f.message[1] === sub.id))
			.toHaveLength(1);
	});

	it("a relay CLOSED frame removes a subscription without echoing CLOSE to the relay", async () => {
		await relay.connect();
		const onclose = vi.fn();
		const sub = relay.subscribe([{ kinds: [1] }], { id: "rejected", onclose });
		const req = await server.waitForReq(sub.id);

		server.send(["CLOSED", sub.id, "restricted"], req.connectionId);
		await vi.waitFor(() => expect(sub.closed).toBe(true));

		expect(onclose).toHaveBeenCalledTimes(1);
		expect(onclose).toHaveBeenCalledWith("restricted");
		expect(relay.openSubs.has(sub.id)).toBe(false);
		expect(server.hasFrame("CLOSE", sub.id)).toBe(false);
	});

	it("a permanently closed subscription is never restored on the next connection", async () => {
		await relay.connect();
		const removed = relay.subscribe([{ kinds: [1] }], { id: "removed" });
		const retained = relay.subscribe([{ kinds: [2] }], { id: "retained" });
		await server.waitForReq(removed.id, 1);
		await server.waitForReq(retained.id, 1);

		removed.close();
		await server.waitForClose(removed.id, 1);
		relay.close();
		await relay.connect();
		await server.waitForReq(retained.id, 2);

		expect(server.hasFrame("REQ", removed.id, 2)).toBe(false);
		expect(relay.openSubs.has(removed.id)).toBe(false);
		expect(relay.openSubs.get(retained.id)).toBe(retained);
	});

	it("disarms EOSE timers on manual close and starts a new one on reconnect", async () => {
		const onTimeout = vi.fn();
		const sub = relay.prepareSubscription([{ kinds: [1] }], {
			id: "documents", eoseTimeout: 140, onEoseTimeout: onTimeout,
		});
		await relay.connect();
		await server.waitForReq(sub.id, 1);
		await sleep(80);
		relay.close();
		await sleep(80); // Old timer would have fired by now.
		expect(onTimeout).not.toHaveBeenCalled();

		await relay.connect();
		await server.waitForReq(sub.id, 2);
		await vi.waitFor(() => expect(onTimeout).toHaveBeenCalledTimes(1));
		expect(sub.eosed).toBe(false);
	});

	it("clears a pre-connect fire() timeout when connect() re-fires the same subscription", async () => {
		const onTimeout = vi.fn();
		const sub = relay.prepareSubscription([{ kinds: [1] }], {
			id: "prepared", eoseTimeout: 140, onEoseTimeout: onTimeout,
		});
		sub.fire(); // send fails because there is no connection, but starts its timeout
		await sleep(75);
		await relay.connect();
		const req = await server.waitForReq(sub.id);
		await sleep(85); // Original pre-connect timeout has elapsed.
		expect(onTimeout).not.toHaveBeenCalled();

		server.send(["EOSE", sub.id], req.connectionId);
		await vi.waitFor(() => expect(sub.eosed).toBe(true));
		await sleep(65);
		expect(onTimeout).not.toHaveBeenCalled();
	});
});

describe("AbstractRelay public ping()", () => {
	let server: MockNostrRelay;
	let relay: AbstractRelay;

	beforeEach(async () => {
		server = await MockNostrRelay.start();
		// Simulate a browser WebSocket (no native ping/pong methods), so the mock
		// can choose when to answer the Nostr dummy REQ.
		relay = newRelay(server.url, { browserSocket: true });
	});

	afterEach(async () => {
		relay.close();
		await server.stop();
		vi.restoreAllMocks();
	});

	it("returns false when disconnected without opening a socket", async () => {
		expect(await relay.ping()).toBe(false);
		expect(server.connectionCount).toBe(0);
	});

	it("succeeds only after genuine EOSE and removes the temporary ping subscription", async () => {
		await relay.connect();
		relay.pingTimeout = 400;
		const document = relay.subscribe([{ kinds: [1] }], { id: "documents" });
		await server.waitForReq(document.id, 1);

		const result = relay.ping();
		const req = await waitForPingReq(server, 1);
		const id = requestId(req);
		expect(relay.openSubs.has(id)).toBe(true);

		server.send(["EOSE", id], req.connectionId);
		expect(await result).toBe(true);
		await server.waitForClose(id, req.connectionId);
		expect(relay.openSubs.has(id)).toBe(false);
		expect(relay.openSubs.get(document.id)).toBe(document);
		expect(relay.connected).toBe(true);
	});

	it("a relay CLOSED reply also proves responsiveness, without echoing CLOSE", async () => {
		await relay.connect();
		relay.pingTimeout = 400;
		const result = relay.ping();
		const req = await waitForPingReq(server, 1);
		const id = requestId(req);

		server.send(["CLOSED", id, "not supported"], req.connectionId);
		expect(await result).toBe(true);
		expect(relay.openSubs.has(id)).toBe(false);
		expect(server.hasFrame("CLOSE", id, req.connectionId)).toBe(false);
		expect(relay.connected).toBe(true);
	});

	it("coalesces concurrent pings into exactly one REQ", async () => {
		await relay.connect();
		relay.pingTimeout = 400;
		const first = relay.ping();
		const second = relay.ping();
		expect(second).toBe(first);

		const req = await waitForPingReq(server, 1);
		expect(server.frames.filter(f => f.message[0] === "REQ" &&
			typeof f.message[1] === "string" && f.message[1].startsWith("forced-ping:")))
			.toHaveLength(1);

		server.send(["EOSE", requestId(req)], req.connectionId);
		expect(await Promise.all([first, second])).toEqual([true, true]);
		await server.waitForClose(requestId(req), req.connectionId);
	});

	it("on ping timeout, closes the unresponsive socket and never restores the temporary REQ", async () => {
		relay.resubscribeBackoff = [30];
		relay.pingTimeout = 90;
		const retained = relay.prepareSubscription([{ kinds: [1] }], { id: "documents" });
		await relay.connect();
		await server.waitForReq(retained.id, 1);

		const result = relay.ping();
		const req = await waitForPingReq(server, 1);
		const pingId = requestId(req);
		// Deliberately do NOT send EOSE or CLOSED.
		expect(await result).toBe(false);
		expect(relay.openSubs.has(pingId)).toBe(false);
		await server.waitForReq(retained.id, 2);
		expect(server.hasFrame("REQ", pingId, 2)).toBe(false);
		expect(relay.openSubs.get(retained.id)).toBe(retained);
		expect(relay.connected).toBe(true);
	});

	it("close() aborts an in-flight ping; it cannot close the next socket", async () => {
		await relay.connect();
		relay.pingTimeout = 200;
		const oldPing = relay.ping();
		const oldReq = await waitForPingReq(server, 1);
		const oldId = requestId(oldReq);

		relay.close();
		expect(await oldPing).toBe(false);
		expect(relay.openSubs.has(oldId)).toBe(false);

		await relay.connect();
		expect(relay.connected).toBe(true);
		await sleep(240); // The former ping"s timeout would have elapsed.
		expect(relay.connected).toBe(true);
		const newPing = relay.ping();
		const newReq = await waitForPingReq(server, 2);
		server.send(["EOSE", requestId(newReq)], newReq.connectionId);
		expect(await newPing).toBe(true);
	});

	it("uses native WebSocket ping/pong when the implementation supports it", async () => {
		relay.close();
		relay = newRelay(server.url); // `ws` exposes .ping/.once; server auto-pongs.
		await relay.connect();
		relay.pingTimeout = 400;

		expect(await relay.ping()).toBe(true);
		expect(server.frames.filter(f => f.message[0] === "REQ")).toHaveLength(0);
		expect(relay.openSubs.size).toBe(0);
	});

	it("automatic periodic ping can be disabled by close()", async () => {
		relay.close();
		relay = newRelay(server.url, { autoPing: true });
		relay.pingFrequency = 30;
		const spy = vi.spyOn(relay, "ping");
		await relay.connect();
		await vi.waitFor(() => expect(spy).toHaveBeenCalled());

		relay.close();
		const callsAtClose = spy.mock.calls.length;
		await sleep(100);
		expect(spy).toHaveBeenCalledTimes(callsAtClose);
	});
});
