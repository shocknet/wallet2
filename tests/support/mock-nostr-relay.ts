import { once } from "node:events";
import type { AddressInfo } from "node:net";
import WebSocket, { WebSocketServer } from "ws";
import { expect, vi } from "vitest";

export type NostrFrame = [string, ...unknown[]];

export type RecordedFrame = {
	connectionId: number;
	message: NostrFrame;
};


export class MockNostrRelay {
	readonly url: string;
	readonly frames: RecordedFrame[] = [];

	private connections = new Map<number, WebSocket>();
	private nextConnectionId = 0;

	private constructor(private server: WebSocketServer, port: number) {
		this.url = `ws://127.0.0.1:${port}`;

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

	static async start(): Promise<MockNostrRelay> {
		const server = new WebSocketServer({ host: "127.0.0.1", port: 0 });
		if (!server.address()) await once(server, "listening");
		const port = (server.address() as AddressInfo).port;
		return new MockNostrRelay(server, port);
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
		for (const socket of this.connections.values()) socket.terminate();
		await new Promise<void>((resolve, reject) => {
			this.server.close(err => err ? reject(err) : resolve());
		});
	}
}
