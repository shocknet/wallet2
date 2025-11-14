import { Creds } from "./socket";
import { getClientKey } from "./helpers";

export interface SanctumSessionOptions {
	sanctumUrl: string;
	sendOnOpen: Record<string, string | number | boolean>;
	onRequestToken: (requestToken: string, clientKey: string) => void;
	onSuccess: (data: Creds) => void;
	onError: (reason: string) => void;


	maxRetries?: number;

	baseRetryDelayMs?: number;

	onRetryScheduled?: (attempt: number, delayMs: number) => void;
}

export class SanctumSession {
	private ws: WebSocket | null = null;
	private readonly clientKey: string;
	private closed = false;      // stop()
	private finished = false;    // success or fatal error
	private retries = 0;
	private reconnectTimeoutId: number | null = null;

	private readonly opts: Required<Omit<SanctumSessionOptions,
		"onRetryScheduled" | "sendOnOpen"
	>> & {
		sendOnOpen: Record<string, string | number | boolean>;
		onRetryScheduled?: (attempt: number, delayMs: number) => void;
	};

	constructor(options: SanctumSessionOptions) {
		this.clientKey = getClientKey();
		this.opts = {
			...options,
			sendOnOpen: { ...options.sendOnOpen, clientKey: this.clientKey },
			maxRetries: options.maxRetries ?? 5,
			baseRetryDelayMs: options.baseRetryDelayMs ?? 500
		};
	}

	start() {
		this.openSocket();
	}

	stop() {
		this.closed = true;
		this.finished = true;
		this.cleanupSocket();
	}

	private openSocket() {
		if (this.closed || this.finished) return;


		if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
			return;
		}

		const { sanctumUrl } = this.opts;
		const wsUrl = `${sanctumUrl.replace("https", "wss").replace("http", "ws")}/`;

		const ws = new WebSocket(wsUrl);
		this.ws = ws;

		ws.onopen = () => {
			if (this.closed || this.finished) return;
			this.retries = 0;
			try {
				ws.send(JSON.stringify(this.opts.sendOnOpen));
			} catch {
				this.failFatal("Failed to send initial payload");
			}
		};

		ws.onmessage = event => {
			if (this.closed || this.finished) return;


			const parsed = JSON.parse(event.data as string);

			if (parsed.error) {
				this.failFatal(parsed.error as string);
				return;
			}

			if (parsed.accessToken) {
				this.finished = true;
				this.cleanupSocket();
				this.opts.onSuccess(parsed as Creds);
				return;
			}

			if (parsed.requestToken) {

				this.opts.onRequestToken(parsed.requestToken as string, this.clientKey);
				return;
			}

		};



		ws.onclose = () => {
			if (this.closed || this.finished) return;

			// At this point, we haven't succeeded yet, so it's "unexpected".
			this.handleUnexpectedClosure();
		};
	}

	private handleUnexpectedClosure() {

		if (this.closed || this.finished) return;

		if (this.retries >= this.opts.maxRetries) {
			this.failFatal("Connection lost after multiple attempts");
			return;
		}

		this.retries += 1;
		const delay = this.getBackoffDelay(this.retries);

		if (this.opts.onRetryScheduled) {
			this.opts.onRetryScheduled(this.retries, delay);
		}

		this.reconnectTimeoutId = window.setTimeout(() => {
			this.reconnectTimeoutId = null;
			this.openSocket();
		}, delay);
	}

	private getBackoffDelay(attempt: number): number {
		const { baseRetryDelayMs } = this.opts;

		const delay = baseRetryDelayMs * Math.pow(2, attempt - 1);
		return Math.min(delay, 10_000);
	}

	private failFatal(reason: string) {
		if (this.finished) return;
		this.finished = true;



		this.cleanupSocket();
		this.opts.onError(reason);
	}

	private cleanupSocket() {

		if (this.reconnectTimeoutId !== null) {
			clearTimeout(this.reconnectTimeoutId);
			this.reconnectTimeoutId = null;
		}
		if (this.ws) {
			this.ws.onopen = null;
			this.ws.onmessage = null;
			this.ws.onerror = null;
			this.ws.onclose = null;
			try {
				this.ws.close();
			} catch {
				// ignore
			}
			this.ws = null;
		}
	}
}
