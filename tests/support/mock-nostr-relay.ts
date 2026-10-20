import { once } from "node:events";
import { createServer, type IncomingMessage, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Duplex } from "node:stream";
import WebSocket, { WebSocketServer } from "ws";
import { expect, vi } from "vitest";

export type NostrFrame = [string, ...unknown[]];

export type RecordedFrame = {
	connectionId: number;
	message: NostrFrame;
};

export type MockNostrRelayOptions = {
	// hold new WebSocket handshakes until resumeConnections() is called
	pauseConnections?: boolean;
};

type PendingUpgrade = {
	request: IncomingMessage;
	socket: Duplex;
	head: Buffer;
	onClose: () => void;
	onError: () => void;
};

export class MockNostrRelay {
	readonly url: string;
	readonly frames: RecordedFrame[] = [];

	private connections = new Map<number, WebSocket>();
	private nextConnectionId = 0;
	private pendingUpgrades = new Set<PendingUpgrade>();
	private connectionsPaused: boolean;
	private stopped = false;

	private constructor(
		private server: WebSocketServer,
		private httpServer: HttpServer,
		port: number,
		options: MockNostrRelayOptions,
	) {
		this.url = `ws://127.0.0.1:${port}`;
		this.connectionsPaused = options.pauseConnections ?? false;

		server.on("connection", socket => {
			const connectionId = ++this.nextConnectionId;
			this.connections.set(connectionId, socket);

			socket.on("message", raw => {
				const message = JSON.parse(raw.toString()) as NostrFrame;
				this.frames.push({ connectionId, message });
			});

			socket.on("close", () => this.connections.delete(connectionId));
		});
	}

	static async start(options: MockNostrRelayOptions = {}): Promise<MockNostrRelay> {
		// Own the HTTP upgrade so tests can hold the handshake before ws opens.
		const httpServer = createServer();
		const server = new WebSocketServer({ noServer: true });
		httpServer.listen(0, "127.0.0.1");
		if (!httpServer.listening) await once(httpServer, "listening");

		const port = (httpServer.address() as AddressInfo).port;
		const relay = new MockNostrRelay(server, httpServer, port, options);
		httpServer.on("upgrade", (request, socket, head) => {
			relay.handleUpgrade(request, socket, head);
		});
		return relay;
	}

	private handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
		if (this.stopped) {
			socket.destroy();
			return;
		}

		if (!this.connectionsPaused) {
			this.acceptUpgrade(request, socket, head);
			return;
		}

		const pending: PendingUpgrade = {
			request,
			socket,
			head,
			onClose: () => this.removePendingUpgrade(pending),
			onError: () => {
				this.removePendingUpgrade(pending);
				socket.destroy();
			},
		};
		this.pendingUpgrades.add(pending);
		socket.once("close", pending.onClose);
		socket.once("error", pending.onError);
	}

	private removePendingUpgrade(pending: PendingUpgrade): void {
		this.pendingUpgrades.delete(pending);
		pending.socket.off("close", pending.onClose);
		pending.socket.off("error", pending.onError);
	}

	private acceptUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
		if (socket.destroyed) return;
		this.server.handleUpgrade(request, socket, head, ws => {
			this.server.emit("connection", ws, request);
		});
	}

	pauseConnections(): void {
		this.connectionsPaused = true;
	}


	resumeConnections(): void {
		this.connectionsPaused = false;
		for (const pending of [...this.pendingUpgrades]) {
			this.removePendingUpgrade(pending);
			this.acceptUpgrade(pending.request, pending.socket, pending.head);
		}
	}


	get pendingConnectionCount(): number {
		return this.pendingUpgrades.size;
	}

	get connectionCount(): number {
		return this.nextConnectionId;
	}

	async waitForFrame(
		predicate: (record: RecordedFrame) => boolean,
	): Promise<RecordedFrame> {
		await vi.waitFor(() => {
			expect(this.frames.some(predicate)).toBe(true);
		}, { timeout: 2_000, interval: 5 });

		return this.frames.find(predicate)!;
	}

	async waitForReq(id: string, connectionId?: number): Promise<RecordedFrame> {
		return this.waitForFrame(({ connectionId: connection, message }) =>
			message[0] === "REQ" && message[1] === id &&
			(connectionId === undefined || connection === connectionId));
	}

	async waitForClose(id: string, connectionId?: number): Promise<RecordedFrame> {
		return this.waitForFrame(({ connectionId: connection, message }) =>
			message[0] === "CLOSE" && message[1] === id &&
			(connectionId === undefined || connection === connectionId));
	}

	hasFrame(type: string, id: string, connectionId?: number): boolean {
		return this.frames.some(({ connectionId: connection, message }) =>
			message[0] === type && message[1] === id &&
			(connectionId === undefined || connection === connectionId));
	}

	// Send a server frame on the SAME connection that received the REQ
	send(message: NostrFrame, connectionId: number): void {
		const socket = this.connections.get(connectionId);
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			throw new Error(`connection ${connectionId} is not open`);
		}
		socket.send(JSON.stringify(message));
	}

	// An unexpected network loss: no protocol CLOSE frame is sent
	terminate(connectionId: number): void {
		const socket = this.connections.get(connectionId);
		if (!socket) throw new Error(`connection ${connectionId} not found`);
		socket.terminate();
	}

	async stop(): Promise<void> {
		this.stopped = true;
		for (const pending of [...this.pendingUpgrades]) {
			this.removePendingUpgrade(pending);
			pending.socket.destroy();
		}
		for (const socket of this.connections.values()) socket.terminate();

		await Promise.all([
			new Promise<void>((resolve, reject) => {
				this.server.close(err => err ? reject(err) : resolve());
			}),
			new Promise<void>((resolve, reject) => {
				this.httpServer.close(err => err ? reject(err) : resolve());
			}),
		]);
	}
}
