import type { Event, EventTemplate, VerifiedEvent, Nostr, NostrEvent, Filter } from "nostr-tools";
import { matchFilters } from "nostr-tools";
import { getHex64, getSubscriptionId } from "@/utils/json";
import { Queue } from "@/utils/queue";
import { normalizeWsUrl } from "@/lib/url";






type RelayWebSocket = WebSocket & {
	ping?(): void
	once?(event: 'pong', listener: () => void): void
	off?(event: 'pong', listener: () => void): void
}

export type AbstractRelayConstructorOptions = {
	verifyEvent: Nostr['verifyEvent']
	websocketImplementation?: typeof WebSocket
	enablePing?: boolean
	enableReconnect?: boolean
}

export class SendingOnClosedConnection extends Error {
	constructor(message: string, relay: string) {
		super(`Tried to send message '${message} on a closed connection to ${relay}.`)
		this.name = 'SendingOnClosedConnection'
	}
}


export class PublishTimeout extends Error {
	constructor() {
		super('Publish timed out')
		this.name = 'PublishTimeout'
	}
}

export class AbstractRelay {
	public readonly url: string
	private _connected: boolean = false

	public onclose: (() => void) | null = null
	public onnotice: (msg: string) => void = msg => console.debug(`NOTICE from ${this.url}: ${msg}`)
	public onauth: undefined | ((evt: EventTemplate) => Promise<VerifiedEvent>)

	public baseEoseTimeout: number = 4400
	public connectionTimeout: number = 4400
	public publishTimeout: number = 4400
	public pingFrequency: number = 29000
	public pingTimeout: number = 20000
	public resubscribeBackoff: number[] = [10000, 10000, 10000, 20000, 20000, 30000, 60000]
	public openSubs: Map<string, Subscription> = new Map()
	public enablePing: boolean | undefined
	public enableReconnect: boolean
	private connectionTimeoutHandle: ReturnType<typeof setTimeout> | undefined
	private reconnectTimeoutHandle: ReturnType<typeof setTimeout> | undefined
	private pingIntervalHandle: ReturnType<typeof setInterval> | undefined
	private pingInFlight: {
		ws: RelayWebSocket
		promise: Promise<boolean>
		abort: () => void
	} | undefined
	private reconnectAttempts: number = 0
	private socketGen = 0
	private disposed = false

	private connectionPromise: Promise<void> | undefined
	private connectReject: ((error: Error) => void) | undefined
	private openCountRequests = new Map<string, CountResolver>()
	private openEventPublishes = new Map<string, EventPublishResolver>()
	private ws: RelayWebSocket | undefined
	private incomingMessageQueue = new Queue<string>()
	private queueRunning = false
	private challenge: string | undefined
	private authPromise: Promise<string> | undefined
	private serial: number = 0
	private verifyEvent: Nostr['verifyEvent']

	private _WebSocket: typeof WebSocket

	constructor(url: string, opts: AbstractRelayConstructorOptions) {
		this.url = normalizeWsUrl(url)
		this.verifyEvent = opts.verifyEvent
		this._WebSocket = opts.websocketImplementation || WebSocket
		this.enablePing = opts.enablePing
		this.enableReconnect = opts.enableReconnect || false
	}

	static async connect(url: string, opts: AbstractRelayConstructorOptions): Promise<AbstractRelay> {
		const relay = new AbstractRelay(url, opts)
		await relay.connect()
		return relay
	}

	private closeAllSubscriptions(reason: string) {
		for (const [_, sub] of this.openSubs) {
			sub.close(reason)
		}
		this.openSubs.clear()

		for (const [_, ep] of this.openEventPublishes) {
			ep.reject(new Error(reason))
		}
		this.openEventPublishes.clear()

		for (const [_, cr] of this.openCountRequests) {
			cr.reject(new Error(reason))
		}
		this.openCountRequests.clear()
	}

	public get connected(): boolean {
		return this._connected
	}

	private async reconnect(): Promise<void> {
		const backoff = this.resubscribeBackoff[Math.min(this.reconnectAttempts, this.resubscribeBackoff.length - 1)]
		this.reconnectAttempts++

		this.reconnectTimeoutHandle = setTimeout(async () => {
			try {
				await this.connect()
			} catch {
				// this will be called again through onclose/onerror
			}
		}, backoff)
	}



	/** End this connection immediately; keep subscription objects for a future connect(). */
	private dropConnection(reason: string, notifyRelay = false): boolean {
		if (!this.ws && !this.connectionPromise) return false

		if (this.connectionTimeoutHandle) {
			clearTimeout(this.connectionTimeoutHandle)
			this.connectionTimeoutHandle = undefined
		}

		if (this.pingIntervalHandle) {
			clearInterval(this.pingIntervalHandle)
			this.pingIntervalHandle = undefined
		}

		// Invalidate the socket and pending connect before any user callbacks run.
		this.socketGen++
		const ws = this.ws
		this.ws = undefined
		this._connected = false
		this.connectionPromise = undefined
		const reject = this.connectReject
		this.connectReject = undefined
		this.challenge = undefined
		this.authPromise = undefined
		this.pingInFlight?.abort()

		if (ws) {
			ws.onopen = null
			// Closing a CONNECTING socket emits an error. Keep a listener so it does not escape.
			ws.onerror = () => { }
			ws.onclose = null
			ws.onmessage = null

			if (ws.readyState === this._WebSocket.OPEN) {
				if (notifyRelay) {
					for (const sub of this.openSubs.values()) {
						try {
							ws.send(JSON.stringify(['CLOSE', sub.id]))
						} catch { /* Best effort; the socket may already be dead. */ }
					}
				}
				try { ws.close() } catch { /* Already unusable. */ }
			} else if (ws.readyState === this._WebSocket.CONNECTING) {
				try { ws.close() } catch { /* Browser may reject close() while CONNECTING. */ }
			}
		}

		// Old EOSE timers must not make retained subscriptions appear ready.
		for (const sub of this.openSubs.values()) sub.disarm()
		while (this.incomingMessageQueue.dequeue()) { /* Drop old socket messages. */ }

		for (const ep of this.openEventPublishes.values()) {
			clearTimeout(ep.timeout)
			ep.reject(new Error(reason))
		}
		this.openEventPublishes.clear()
		for (const cr of this.openCountRequests.values()) {
			cr.reject(new Error(reason))
		}
		this.openCountRequests.clear()

		reject?.(new Error(reason))
		return true
	}

	private handleHardClose(reason: string) {
		if (!this.dropConnection(reason)) return
		if (this.enableReconnect) this.reconnect()
		else this.closeAllSubscriptions(reason)
		this.onclose?.()
	}

	public async connect(): Promise<void> {
		if (this.disposed) throw new Error('relay disposed')
		if (this.reconnectTimeoutHandle) {
			clearTimeout(this.reconnectTimeoutHandle)
			this.reconnectTimeoutHandle = undefined
		}
		if (this.connectionPromise) return this.connectionPromise

		this.challenge = undefined
		this.authPromise = undefined
		const gen = ++this.socketGen
		const ws = new this._WebSocket(this.url)
		this.ws = ws

		this.connectionPromise = new Promise((resolve, reject) => {
			this.connectReject = reject
			this.connectionTimeoutHandle = setTimeout(() => {
				if (this.socketGen === gen && this.ws === ws) {
					this.handleHardClose('relay connection timed out')
				}
			}, this.connectionTimeout)

			ws.onopen = () => {
				if (this.socketGen !== gen || this.ws !== ws) return
				clearTimeout(this.connectionTimeoutHandle)
				this.connectionTimeoutHandle = undefined
				this.connectReject = undefined
				this._connected = true

				this.reconnectAttempts = 0

				// resubscribe to all retained subscriptions without changing their filters
				for (const sub of this.openSubs.values()) {
					sub.disarm()
					sub.fire()
				}

				if (this.enablePing) {
					this.pingIntervalHandle = setInterval(() => { this.ping() }, this.pingFrequency)
				}
				resolve()
			}

			ws.onerror = () => {
				if (this.socketGen !== gen || this.ws !== ws) return
				this.handleHardClose('relay connection errored')
			}

			ws.onclose = () => {
				if (this.socketGen !== gen || this.ws !== ws) return
				this.handleHardClose('relay connection closed')
			}

			ws.onmessage = ev => {
				if (this.socketGen === gen && this.ws === ws) this._onmessage(ev)
			}
		})

		return this.connectionPromise
	}

	private waitForPingPong(ws: RelayWebSocket) {
		let onPong: () => void
		const promise = new Promise<boolean>((resolve, reject) => {
			onPong = () => resolve(true)
			ws.once!('pong', onPong)
			try {
				ws.ping!()
			} catch (err) {
				reject(err)
			}
		})

		return {
			promise,
			cleanup: () => ws.off?.('pong', onPong),
		}
	}

	private waitForDummyReq() {
		let sub: Subscription | undefined
		let cleaningUp = false
		const promise = new Promise<boolean>((resolve, reject) => {
			try {
				sub = this.subscribe(
					[{ ids: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'], limit: 0 }],
					{
						label: 'forced-ping',
						oneose: () => resolve(true),
						onclose: () => {
							// A relay CLOSED frame also proves the connection is responsive.
							if (!cleaningUp) resolve(true)
						},
						eoseTimeout: this.pingTimeout + 1000,
					},
				)
			} catch (err) {
				reject(err)
			}
		})

		return {
			promise,
			cleanup: () => {
				if (cleaningUp) return
				cleaningUp = true
				sub?.close('ping finished')
			},
		}
	}

	// probe the current socket. Returns false (and drops it) if it stops responding
	public ping(): Promise<boolean> {
		const ws = this.ws
		if (!this._connected || !ws) return Promise.resolve(false)
		if (ws.readyState !== this._WebSocket.OPEN) {
			this.handleHardClose('relay ping found closed socket')
			return Promise.resolve(false)
		}

		if (this.pingInFlight?.ws === ws) return this.pingInFlight.promise

		const probe = ws.ping && ws.once
			? this.waitForPingPong(ws)
			: this.waitForDummyReq()

		let timeout: ReturnType<typeof setTimeout> | undefined
		let abort: () => void = () => { }
		const aborted = new Promise<boolean>(resolve => {
			abort = () => {
				probe.cleanup()
				resolve(false)
			}
		})

		const promise = (async () => {
			try {
				const responsive = await Promise.race([
					probe.promise,
					new Promise<boolean>(resolve => {
						timeout = setTimeout(() => resolve(false), this.pingTimeout)
					}),
					aborted,
				])

				if (this.ws !== ws || !this._connected || ws.readyState !== this._WebSocket.OPEN) {
					return false
				}
				if (!responsive) this.handleHardClose('relay ping timed out')
				return responsive
			} catch {
				if (this.ws === ws) this.handleHardClose('relay ping failed')
				return false
			} finally {
				if (timeout) clearTimeout(timeout)
				probe.cleanup()
				if (this.pingInFlight?.ws === ws) this.pingInFlight = undefined
			}
		})()

		this.pingInFlight = { ws, promise, abort }
		return promise
	}

	private async runQueue() {
		this.queueRunning = true
		while (true) {
			if (false === this.handleNext()) {
				break
			}
			await yieldThread()
		}
		this.queueRunning = false
	}

	private handleNext(): undefined | false {
		const json = this.incomingMessageQueue.dequeue()
		if (!json) {
			return false
		}

		// shortcut EVENT sub
		const subid = getSubscriptionId(json)
		if (subid) {
			const so = this.openSubs.get(subid as string)
			if (!so) {
				// this is an EVENT message, but for a subscription we don't have, so just stop here
				return
			}

			// this will be called only when this message is a EVENT message for a subscription we have
			// we do this before parsing the JSON to not have to do that for duplicate events
			//   since JSON parsing is slow
			const id = getHex64(json, 'id')
			const alreadyHave = so.alreadyHaveEvent?.(id)

			// notify any interested client that the relay has this event
			// (do this after alreadyHaveEvent() because the client may rely on this to answer that)
			so.receivedEvent?.(this, id)

			if (alreadyHave) {
				// if we had already seen this event we can just stop here
				return
			}
		}

		try {
			const data = JSON.parse(json)
			// we won't do any checks against the data since all failures (i.e. invalid messages from relays)
			// will naturally be caught by the encompassing try..catch block

			switch (data[0]) {
				case 'EVENT': {
					const so = this.openSubs.get(data[1] as string) as Subscription
					const event = data[2] as NostrEvent
					if (this.verifyEvent(event) && matchFilters(so.filters, event)) {
						so.onevent(event)
					}
					if (!so.lastEmitted || so.lastEmitted < event.created_at) so.lastEmitted = event.created_at
					return
				}
				case 'COUNT': {
					const id: string = data[1]
					const payload = data[2] as { count: number }
					const cr = this.openCountRequests.get(id) as CountResolver
					if (cr) {
						cr.resolve(payload.count)
						this.openCountRequests.delete(id)
					}
					return
				}
				case 'EOSE': {
					const so = this.openSubs.get(data[1] as string)
					if (!so) return
					so.receivedEose()
					return
				}
				case 'OK': {
					const id: string = data[1]
					const ok: boolean = data[2]
					const reason: string = data[3]
					const ep = this.openEventPublishes.get(id) as EventPublishResolver
					if (ep) {
						clearTimeout(ep.timeout)
						if (ok) ep.resolve(reason)
						else ep.reject(new Error(reason))
						this.openEventPublishes.delete(id)
					}
					return
				}
				case 'CLOSED': {
					const id: string = data[1]
					const so = this.openSubs.get(id)
					if (!so) return
					so.close(data[2] as string, false)
					return
				}
				case 'NOTICE': {
					this.onnotice(data[1] as string)
					return
				}
				case 'AUTH': {
					this.challenge = data[1] as string
					if (this.onauth) {
						this.auth(this.onauth)
					}
					return
				}
				default: {
					const so = this.openSubs.get(data[1])
					so?.oncustom?.(data)
					return
				}
			}
		} catch {
			return
		}
	}

	public async send(message: string) {
		const connection = this.connectionPromise
		if (!connection) throw new SendingOnClosedConnection(message, this.url)

		await connection
		if (this.connectionPromise !== connection || !this._connected || !this.ws) {
			throw new SendingOnClosedConnection(message, this.url)
		}
		this.ws.send(message)
	}

	public async auth(signAuthEvent: (evt: EventTemplate) => Promise<VerifiedEvent>): Promise<string> {
		const challenge = this.challenge
		if (!challenge) throw new Error("can't perform auth, no challenge was received")
		if (this.authPromise) return this.authPromise

		this.authPromise = new Promise<string>(async (resolve, reject) => {
			try {
				const evt = await signAuthEvent(makeAuthEvent(this.url, challenge))
				const timeout = setTimeout(() => {
					const ep = this.openEventPublishes.get(evt.id) as EventPublishResolver
					if (ep) {
						ep.reject(new PublishTimeout())
						this.openEventPublishes.delete(evt.id)
					}
				}, this.publishTimeout)
				this.openEventPublishes.set(evt.id, { resolve, reject, timeout })
				void this.send('["AUTH",' + JSON.stringify(evt) + ']').catch(err => {
					clearTimeout(timeout)
					if (this.openEventPublishes.get(evt.id)) {
						this.openEventPublishes.delete(evt.id)
						reject(err)
					}
				})
			} catch (err) {
				console.warn('subscribe auth function failed:', err)
			}
		})
		return this.authPromise
	}

	public async publish(event: Event): Promise<string> {
		const ret = new Promise<string>((resolve, reject) => {
			const timeout = setTimeout(() => {
				const ep = this.openEventPublishes.get(event.id) as EventPublishResolver
				if (ep) {
					ep.reject(new Error('publish timed out'))
					this.openEventPublishes.delete(event.id)
				}
			}, this.publishTimeout)
			this.openEventPublishes.set(event.id, { resolve, reject, timeout })
		})
		void this.send('["EVENT",' + JSON.stringify(event) + ']').catch(err => {
			const ep = this.openEventPublishes.get(event.id)
			if (ep) {
				clearTimeout(ep.timeout)
				this.openEventPublishes.delete(event.id)
				ep.reject(err)
			}
		})
		return ret
	}

	public async count(filters: Filter[], params: { id?: string | null }): Promise<number> {
		this.serial++
		const id = params?.id || 'count:' + this.serial
		const ret = new Promise<number>((resolve, reject) => {
			this.openCountRequests.set(id, { resolve, reject })
		})
		void this.send('["COUNT","' + id + '",' + JSON.stringify(filters).substring(1)).catch(err => {
			const cr = this.openCountRequests.get(id)
			if (cr) {
				this.openCountRequests.delete(id)
				cr.reject(err)
			}
		})
		return ret
	}

	public subscribe(
		filters: Filter[],
		params: Partial<SubscriptionParams> & { label?: string; id?: string },
	): Subscription {
		const sub = this.prepareSubscription(filters, params)
		sub.fire()
		return sub
	}

	public prepareSubscription(
		filters: Filter[],
		params: Partial<SubscriptionParams> & { label?: string; id?: string },
	): Subscription {
		this.serial++
		const id = params.id || (params.label ? params.label + ':' : 'sub:') + this.serial
		const subscription = new Subscription(this, id, filters, params)
		this.openSubs.set(id, subscription)
		return subscription
	}

	public close() {
		if (this.reconnectTimeoutHandle) {
			clearTimeout(this.reconnectTimeoutHandle)
			this.reconnectTimeoutHandle = undefined
		}
		this.reconnectAttempts = 0
		if (this.dropConnection('relay connection closed by us', true)) this.onclose?.()
	}

	public dispose() {
		if (this.disposed) return
		this.disposed = true
		if (this.reconnectTimeoutHandle) {
			clearTimeout(this.reconnectTimeoutHandle)
			this.reconnectTimeoutHandle = undefined
		}
		this.dropConnection('relay connection disposed', true);
		this.closeAllSubscriptions('relay connection disposed');
	}

	// this is the function assigned to this.ws.onmessage
	// it's exposed for testing and debugging purposes
	public _onmessage(ev: MessageEvent<any>) {
		this.incomingMessageQueue.enqueue(ev.data as string)
		if (!this.queueRunning) {
			this.runQueue()
		}
	}
}

export class Subscription {
	public readonly relay: AbstractRelay
	public readonly id: string

	public lastEmitted: number | undefined
	public closed: boolean = false
	public eosed: boolean = false
	public filters: Filter[]
	public alreadyHaveEvent: ((id: string) => boolean) | undefined
	public receivedEvent: ((relay: AbstractRelay, id: string) => void) | undefined

	public onevent: (evt: Event) => void
	public oneose: (() => void) | undefined
	public onclose: ((reason: string) => void) | undefined
	public onEoseTimeout: (() => void) | undefined

	// will get any messages that have this subscription id as their second item and are not default standard
	public oncustom: ((msg: string[]) => void) | undefined

	public eoseTimeout: number
	private eoseTimeoutHandle: ReturnType<typeof setTimeout> | undefined

	constructor(relay: AbstractRelay, id: string, filters: Filter[], params: SubscriptionParams) {
		if (filters.length === 0) throw new Error("subscription can't be created with zero filters")

		this.relay = relay
		this.filters = filters
		this.id = id
		this.alreadyHaveEvent = params.alreadyHaveEvent
		this.receivedEvent = params.receivedEvent
		this.eoseTimeout = params.eoseTimeout || relay.baseEoseTimeout

		this.oneose = params.oneose
		this.onclose = params.onclose
		this.onEoseTimeout = params.onEoseTimeout
		this.onevent =
			params.onevent ||
			(event => {
				console.warn(
					`onevent() callback not defined for subscription '${this.id}' in relay ${this.relay.url}. event received:`,
					event,
				)
			})
	}

	public fire() {
		this.relay.send('["REQ","' + this.id + '",' + JSON.stringify(this.filters).substring(1)).catch(() => { })

		// only now we start counting the eoseTimeout
		this.eoseTimeoutHandle = setTimeout(() => {
			this.eoseTimeoutHandle = undefined;

			if (this.onEoseTimeout) {
				this.onEoseTimeout();
			} else {
				this.receivedEose();
			}
		}, this.eoseTimeout);

	}

	public disarm() {
		clearTimeout(this.eoseTimeoutHandle)
		this.eoseTimeoutHandle = undefined
		this.eosed = false
	}

	public receivedEose() {
		if (this.closed || this.eosed || !this.relay.connected) return
		clearTimeout(this.eoseTimeoutHandle)
		this.eoseTimeoutHandle = undefined
		this.eosed = true
		this.oneose?.()
	}

	public close(reason: string = 'closed by caller', notifyRelay = true) {
		if (this.closed) return
		this.closed = true
		this.disarm()
		if (notifyRelay && this.relay.connected) {
			this.relay.send('["CLOSE",' + JSON.stringify(this.id) + ']').catch(() => { })
		}
		this.relay.openSubs.delete(this.id)
		this.onclose?.(reason)
	}
}

export type SubscriptionParams = {
	onevent?: (evt: Event) => void
	oneose?: () => void
	onclose?: (reason: string) => void
	onEoseTimeout?: () => void
	alreadyHaveEvent?: (id: string) => boolean
	receivedEvent?: (relay: AbstractRelay, id: string) => void
	eoseTimeout?: number
}

export type CountResolver = {
	resolve: (count: number) => void
	reject: (err: Error) => void
}

export type EventPublishResolver = {
	resolve: (reason: string) => void
	reject: (err: Error) => void
	timeout: ReturnType<typeof setTimeout>
}

async function yieldThread() {
	return new Promise<void>((resolve, reject) => {
		try {
			// Check if MessageChannel is available
			if (typeof MessageChannel !== 'undefined') {
				const ch = new MessageChannel()
				const handler = () => {
					ch.port1.removeEventListener('message', handler)
					resolve()
				}
				ch.port1.addEventListener('message', handler)
				ch.port2.postMessage(0)
				ch.port1.start()
			} else {
				if (typeof setImmediate !== 'undefined') {
					setImmediate(resolve)
				} else if (typeof setTimeout !== 'undefined') {
					setTimeout(resolve, 0)
				} else {
					// Last resort - resolve immediately
					resolve()
				}
			}
		} catch (e) {
			console.error('during yield: ', e)
			reject(e)
		}
	})
}

export const ClientAuth = 22242
function makeAuthEvent(relayURL: string, challenge: string): EventTemplate {
	return {
		kind: ClientAuth,
		created_at: Math.floor(Date.now() / 1000),
		tags: [
			['relay', relayURL],
			['challenge', challenge],
		],
		content: '',
	}
}
