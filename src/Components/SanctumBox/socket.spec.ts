import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { SanctumSession } from "./socket2";


class FakeWebSocket {
	url: string;
	readyState = 0; // CONNECTING
	sent: string[] = [];
	closed = false;

	onopen: (() => void) | null = null;
	onmessage: ((event: { data: string }) => void) | null = null;
	onerror: (() => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;

	constructor(url: string) {
		this.url = url;
	}

	send(data: string) {
		this.sent.push(data);
	}

	close() {
		this.closed = true;
		this.readyState = 3; // CLOSED
	}

	emitOpen() {
		this.readyState = 1; // OPEN
		this.onopen?.();
	}

	emitMessage(data: any) {
		this.onmessage?.({ data: JSON.stringify(data) });
	}

	emitError() {
		this.onerror?.();
	}

	emitClose(event: Partial<CloseEvent> = {}) {
		this.readyState = 3;
		this.onclose?.(event as CloseEvent);
	}

	static CONNECTING: number;
	static OPEN: number;
	static CLOSING: number;
	static CLOSED: number;
}

let sockets: FakeWebSocket[] = [];


const originalWebSocket = globalThis.WebSocket;




describe("Sanctum socket", () => {

	const onRequestToken = vi.fn((_requestToken: string, _clientKey: string) => { });
	const onSuccess = vi.fn((_data: any) => { });
	const onError = vi.fn((_reason: string) => { });
	const onRetryScheduled = vi.fn((_attempt: number, _delayMs: number) => { });
	beforeAll(() => {

		FakeWebSocket.CONNECTING = originalWebSocket.CONNECTING;
		FakeWebSocket.OPEN = originalWebSocket.OPEN;
		FakeWebSocket.CLOSING = originalWebSocket.CLOSING;
		FakeWebSocket.CLOSED = originalWebSocket.CLOSED;
	});

	beforeEach(() => {
		sockets = [];

		vi.useFakeTimers();

		const WebSocketMock: any = vi.fn((url: string) => {
			const ws = new FakeWebSocket(url);
			sockets.push(ws);
			return ws as any as WebSocket;
		});

		WebSocketMock.CONNECTING = FakeWebSocket.CONNECTING;
		WebSocketMock.OPEN = FakeWebSocket.OPEN;
		WebSocketMock.CLOSING = FakeWebSocket.CLOSING;
		WebSocketMock.CLOSED = FakeWebSocket.CLOSED;

		vi.stubGlobal("WebSocket", WebSocketMock);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.resetAllMocks();
	});

	it("opens a websocket and sends initial payload on open", () => {


		const session = new SanctumSession({
			sanctumUrl: "https://example.com/sanctum",
			sendOnOpen: { foo: "bar" },
			onRequestToken,
			onSuccess,
			onError,
			onRetryScheduled
		});

		session.start();


		expect(WebSocket).toHaveBeenCalledTimes(1);
		expect(sockets).toHaveLength(1);

		const ws = sockets[0];
		expect(ws.url).toBe("wss://example.com/sanctum/");


		ws.emitOpen();


		expect(ws.sent).toHaveLength(1);
		const payload = JSON.parse(ws.sent[0]);
		expect(payload.foo).toBe("bar");
		expect(payload.clientKey).toBeDefined();
	});

	it("doesn't open a new connection if one already exists and is open or connecting", () => {
		const session = new SanctumSession({
			sanctumUrl: "https://example.com/sanctum",
			sendOnOpen: { foo: "bar" },
			onRequestToken,
			onSuccess,
			onError,
			onRetryScheduled
		});

		session.start();


		expect(WebSocket).toHaveBeenCalledTimes(1);
		expect(sockets).toHaveLength(1);

		session.start();


		expect(WebSocket).toHaveBeenCalledTimes(1);
		expect(sockets).toHaveLength(1);


	});

	it("fatals if server returns error field", () => {
		const session = new SanctumSession({
			sanctumUrl: "https://example.com/sanctum",
			sendOnOpen: { foo: "bar" },
			onRequestToken,
			onSuccess,
			onError,
			onRetryScheduled
		});

		session.start();

		const ws = sockets[0];

		ws.emitOpen();

		ws.emitMessage({ error: "some error" })

		expect(onError).toHaveBeenCalledExactlyOnceWith("some error");
		expect(ws.readyState).toEqual(3);
	});

	it("schedules a connect retry when socket closes unexpectedly", () => {

		const session = new SanctumSession({
			sanctumUrl: "https://example.com/sanctum",
			baseRetryDelayMs: 500,
			maxRetries: 5,
			sendOnOpen: { foo: "bar" },
			onRequestToken,
			onSuccess,
			onError,
			onRetryScheduled
		});

		session.start();

		const ws = sockets[0];

		ws.emitOpen();

		ws.emitClose();

		expect(onRetryScheduled).toHaveBeenCalledExactlyOnceWith(1, 500);
		vi.runAllTimers();
		expect(sockets).toHaveLength(2);
	});
})
