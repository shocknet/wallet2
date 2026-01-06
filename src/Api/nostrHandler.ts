import { Event, Filter, finalizeEvent, nip04, Relay, SimplePool, UnsignedEvent } from "nostr-tools";
import { Subscription, SubscriptionParams } from "nostr-tools/lib/types/abstract-relay";
export const pubServiceTag = "Lightning.Pub"
import { Buffer } from 'buffer';
import dLogger from "./helpers/debugLog";
import { decodePayload, decryptData, encodePayload, encryptData, getSharedSecret } from "./nip44v1";
import logger from "./helpers/logger";
import { SubCloser, SubscribeManyParams } from "nostr-tools/lib/types/abstract-pool";
import { makeId } from "@/constants";
import { NofferData, NofferResponse, SendNofferRequest } from "@shocknet/clink-sdk";
import { normalizeWsUrl } from "@/lib/url";
const allowedKinds = [21000, 24133]
type HubEvents = RelaySessionEvents;
export type NostrKeyPair = {
	privateKey: string
	publicKey: string
}
export type BeaconUpdate = {
	updatedAtUnix: number
	createdByPub: string
	name: string
	relayUrl: string;
}
export type NostrEvent = {
	id: string
	pub: string
	content: string
	kind: number
	to: string // addressed pubkey
}


export class TransportPool {
	private sessions = new Map<string, RelaySession>();

	readonly events = new TypedEmitter<HubEvents>();

	private handledEvents = new Set<string>();

	private log = dLogger.withContext({ component: "nostr-pool" });

	constructor() { }

	reset() {
		this.sessions.values().forEach(sess => {
			sess.close();
		});

		this.sessions.clear();
		this.events.removeAll();
		this.handledEvents.clear();

	}


	private ensureRelaySession(urlRaw: string): RelaySession {
		const url = normalizeWsUrl(urlRaw);


		let sess = this.sessions.get(url);
		if (!sess) {
			const relay = new Relay(url);
			sess = new RelaySession(url, relay, this.events, this.handledEvents);
			this.sessions.set(url, sess);
		}

		return sess;
	}


	/**
	 * Purely registers interests (idempotent)
	 * Calls sess.applyInerests() to schedule side effects (connect + subs)
	 * Waits until ANY relay reaches readyOnce (EOSE once)
	 */
	async syncRelays(settings: RelaysSettings) {
		const { relays, keys, lpk } = settings;

		const sessions = relays.map(r => this.ensureRelaySession(r));

		const waits = sessions.map(sess => sess.ensureRpcReadyForRecipient(keys, lpk));

		try {
			await Promise.any(waits);
		} catch {
			throw new Error("All relays of this node are down");
		}
	}

	pause() {
		this.sessions.values().forEach((sess) => {
			sess.pause();
		});
	}

	resume() {
		this.sessions.values().forEach(sess => {
			sess.resume();
		});
	}

	listConnectionStatus(): Map<string, boolean> {
		const map = new Map<string, boolean>();
		for (const [url, sess] of this.sessions) map.set(url, sess.isConnected());
		return map;
	}

	getActiveRelays(): string[] {
		return [...this.sessions.values()].filter((s) => s.isConnected()).map((s) => s.url);
	}


	subscribe(relays: string[], filter: Filter, params: SubscribeManyParams): SubCloser {
		const request: { url: string; filter: Filter }[] = []
		for (let i = 0; i < relays.length; i++) {
			const url = normalizeWsUrl(relays[i]);

			if (!request.find(r => r.url === url)) {
				request.push({ url, filter: filter })
			}
		}

		return this.subscribeMap(request, params)
	}


	subscribeMany(relays: string[], filters: Filter[], params: SubscribeManyParams): SubCloser {

		const request: { url: string; filter: Filter }[] = [];
		for (let i = 0; i < relays.length; i++) {
			const url = normalizeWsUrl(relays[i]);

			for (let f = 0; f < filters.length; f++) {
				request.push({ url, filter: filters[f] });
			}

		}

		return this.subscribeMap(request, params)
	}


	private subscribeMap(requests: { url: string; filter: Filter }[], params: SubscribeManyParams): SubCloser {
		const grouped = new Map<string, Filter[]>()
		for (const req of requests) {
			const { url, filter } = req
			if (!grouped.has(url)) grouped.set(url, [])
			grouped.get(url)!.push(filter)
		}
		const groupedRequests = Array.from(grouped.entries()).map(([url, filters]) => ({ url, filters }))


		const _knownIds = new Set<string>()
		const subs: { sess: RelaySession; subId: string }[] = [];

		// batch all EOSEs into a single
		const eosesReceived: boolean[] = []
		let handleEose = (i: number) => {
			if (eosesReceived[i]) return // do not act twice for the same relay
			eosesReceived[i] = true
			if (eosesReceived.filter(a => a).length === groupedRequests.length) {
				params.oneose?.()
				handleEose = () => { }
			}
		}
		// batch all closes into a single
		const closesReceived: string[] = []
		let handleClose = (i: number, reason: string) => {
			if (closesReceived[i]) return // do not act twice for the same relay
			handleEose(i)
			closesReceived[i] = reason
			if (closesReceived.filter(a => a).length === groupedRequests.length) {
				params.onclose?.(closesReceived)
				handleClose = () => { }
			}
		}

		const localAlreadyHaveEventHandler = (id: string) => {
			if (params.alreadyHaveEvent?.(id)) {
				return true
			}
			const have = _knownIds.has(id)
			_knownIds.add(id)
			return have
		}

		// open a subscription in all given relays
		const allOpened = Promise.all(
			groupedRequests.map(async ({ url, filters }, i) => {
				let sess: RelaySession;
				try {
					sess = this.ensureRelaySession(url);
					await sess.ensureConnection();
				} catch (err) {
					handleClose(i, (err as any)?.message || String(err));
					return;
				}

				const { sub } = sess.trackSubscription(filters, {
					...params,
					oneose: () => handleEose(i),
					onclose: reason => {
						handleClose(i, reason)
					},
					alreadyHaveEvent: localAlreadyHaveEventHandler,
					eoseTimeout: params.maxWait,
				});

				sub.fire();

				subs.push({ sess, subId: sub.id })
			}),
		)

		return {
			async close(reason?: string) {
				await allOpened;
				for (const s of subs) s.sess.closeTracked(s.subId, reason);
			},
		};
	}





	async sendNip46(relays: string[], pubKey: string, message: string, keys: NostrKeyPair) {
		const { encrypt } = nip04;
		const nip04Encrypted = encrypt(keys.privateKey, pubKey, message);
		return this.sendRaw(relays, {
			pubkey: keys.publicKey,
			kind: 24133,
			tags: [["p", pubKey]],
			created_at: Math.floor(Date.now() / 1000),
			content: nip04Encrypted,
		}, keys.privateKey);
	}



	async send(relays: string[], pubKey: string, message: string, keys: NostrKeyPair) {
		const decoded = await encryptData(message, getSharedSecret(keys.privateKey, pubKey));
		const content = encodePayload(decoded);
		return this.sendRaw(relays, {
			content,
			created_at: Math.floor(Date.now() / 1000),
			kind: 21000,
			pubkey: keys.publicKey,
			tags: [["p", pubKey]],
		}, keys.privateKey);
	}

	async sendNip69(relays: string[], pubKey: string, data: NofferData, keys: NostrKeyPair): Promise<NofferResponse> {
		return SendNofferRequest(this as any as SimplePool, new Uint8Array(Buffer.from(keys.privateKey, "hex")), relays, pubKey, data);
	}

	async sendRaw(relays: string[], event: UnsignedEvent, privateKeyHex: string) {
		const signed = finalizeEvent(event, new Uint8Array(Buffer.from(privateKeyHex, "hex")));
		return this.publish(relays, signed);
	}

	subscribeEose(
		relays: string[],
		filter: Filter,
		params: Pick<SubscribeManyParams, 'label' | 'id' | 'onevent' | 'onclose' | 'maxWait' | 'onauth'>,
	): SubCloser {
		const subcloser = this.subscribe(relays, filter, {
			...params,
			oneose() {
				subcloser.close('closed automatically on eose')
			},
		})
		return subcloser
	}

	subscribeManyEose(
		relays: string[],
		filters: Filter[],
		params: Pick<SubscribeManyParams, 'label' | 'id' | 'onevent' | 'onclose' | 'maxWait' | 'onauth'>,
	): SubCloser {
		const subcloser = this.subscribeMany(relays, filters, {
			...params,
			oneose() {
				subcloser.close('closed automatically on eose')
			},
		})
		return subcloser
	}

	async querySync(
		relays: string[],
		filter: Filter,
		params?: Pick<SubscribeManyParams, 'label' | 'id' | 'maxWait'>,
	): Promise<Event[]> {
		return new Promise(resolve => {
			const events: Event[] = []
			this.subscribeEose(relays, filter, {
				...params,
				onevent(event: Event) {
					events.push(event)
				},
				onclose(_: string[]) {
					resolve(events)
				},
			})
		})
	}

	async get(
		relays: string[],
		filter: Filter,
		params?: Pick<SubscribeManyParams, 'label' | 'id' | 'maxWait'>,
	): Promise<Event | null> {
		filter.limit = 1
		const events = await this.querySync(relays, filter, params)
		events.sort((a, b) => b.created_at - a.created_at)
		return events[0] || null
	}

	publish(
		relays: string[],
		event: Event,
	) {
		const normalize = (r: string) => {
			const url = normalizeWsUrl(r);
			return url;
		}
		return Promise.any(
			relays.map(normalize).map(async (url, i, arr) => {
				if (arr.indexOf(url) !== i) {
					// duplicate
					return Promise.reject('duplicate url')
				}

				const sess = this.ensureRelaySession(url);
				await sess.ensureConnection();
				return sess.publish(event);
			})
		);
	}
}

type Waiter = { version: number; resolve: () => void; reject: (err: unknown) => void };

type StoredSub = {
	subId: string; // the id passed to nostr-tools
	filters: Filter[];
	params: Partial<SubscriptionParams> & { label?: string; id?: string };
	sub?: Subscription;
	lastEmitted?: number;
};

function cloneFilters(fs: Filter[]) {
	return fs.map(f => ({ ...f }));
}

function bumpSinceFromLastEmitted(filters: Filter[], lastEmitted?: number) {
	if (lastEmitted === undefined) return;
	const next = lastEmitted + 1;
	for (const f of filters) {
		if (f.since !== undefined && f.since < next) f.since = next;
	}
}
export type RelaysSettings = {
	relays: string[];
	lpk: string;
	keys: NostrKeyPair
}
type RelaySessionEvents = {
	relayStatus: { url: string; connected: boolean; reason?: string; atMillis: number };
	nostrEvent: NostrEvent;
	beacon: BeaconUpdate;
};

export const CLIENTS_RPC_SUBID = "__internal:rpc_sub";
export const BEACONS_SUBID = "__internal:beacons_sub";
export class RelaySession {
	readonly url: string;
	private relay: Relay;
	private emitter: TypedEmitter<RelaySessionEvents>;

	private handledEvents: Set<string>;

	private recipients = new Map<string, string>();
	private lpks = new Set<string>();
	private rpcFilterVersion = 0;
	private beaconFilterVersion = 0;
	private rpcAppliedVersion = -1;
	private beaconAppliedVersion = -1;
	private rpcWaiters: Waiter[] = [];
	private running?: Promise<void>;
	private pending = false;


	private subs = new Map<string, StoredSub>();


	private paused = false;

	private epoch = 0; // bumps on pause/resume to invalidate in-flight actor work

	private log = dLogger.withContext({ component: "relay-session" });

	constructor(url: string, relay: Relay, emitter: TypedEmitter<RelaySessionEvents>, handledEvents: Set<string>) {
		this.url = url;
		this.relay = relay;
		this.emitter = emitter;
		this.handledEvents = handledEvents;
	}


	isConnected() {
		return this.relay.connected;
	}

	async ensureConnection() {
		return this.relay.connect();
	}

	close() {
		try {
			this.relay.close()
		} catch (err) {
			console.error(err);
		}
	}

	/**
	 * For a nostr client, this function ensures that the relay and its underlying
	 * rpc subscription are ready to receive responses of rpc calls.
	 */
	async ensureRpcReadyForRecipient(keys: NostrKeyPair, lpk: string) {
		this.addLpk(lpk);
		const v = this.addRecipient(keys.publicKey, keys.privateKey);
		this.applyInterests();
		await this.waitForRpcApplied(v);
	}

	private addRecipient(pubkey: string, privkeyHex: string): number {
		if (this.recipients.has(pubkey)) return this.rpcFilterVersion;
		this.recipients.set(pubkey, privkeyHex);
		this.rpcFilterVersion++;
		this.pending = true;
		return this.rpcFilterVersion;
	}

	private addLpk(lpk: string) {
		if (this.lpks.has(lpk)) return;
		this.lpks.add(lpk);
		this.beaconFilterVersion++;
		this.pending = true;
	}


	private flushRpcWaiters() {
		const v = this.rpcAppliedVersion;
		if (v < 0 || !this.isConnected() || this.paused) return;

		const ready = this.rpcWaiters.filter((w) => w.version <= v);
		this.rpcWaiters = this.rpcWaiters.filter((w) => w.version > v);
		for (const w of ready) w.resolve();
	}

	private rejectAllRpcWaiters(err: unknown) {
		const ws = this.rpcWaiters;
		this.rpcWaiters = [];
		for (const w of ws) w.reject(err);
	}

	private applyInterests() {
		this.pending = true;
		if (this.running) return this.running;

		this.running = this.runActorLoop()
			.catch((err) => {
				this.rejectAllRpcWaiters(err);
				throw err;
			})
			.finally(() => {
				this.running = undefined;

				if (this.pending && !this.paused) {
					this.applyInterests();
				}
			});

		return this.running;
	}

	private async runActorLoop() {
		while (this.pending) {
			this.pending = false;
			if (this.paused) return;

			const myEpoch = this.epoch;

			await this.relay.connect();
			if (this.paused || myEpoch !== this.epoch) return; // if lifecycle moved during our connect wait then stop

			this.ensureClientsInterests();
			if (this.paused || myEpoch !== this.epoch) return;

		}
	}

	pause() {
		if (this.paused) return;

		this.paused = true;
		this.epoch++;

		this.rpcAppliedVersion = -1;
		this.beaconAppliedVersion = -1;

		// snapshot lastEmitted and drop live handles
		for (const s of this.subs.values()) {
			s.lastEmitted = s.sub?.lastEmitted ?? s.lastEmitted;
			s.sub = undefined;
		}


		try {
			this.relay.close();
		} catch (err) {
			this.log.warn("pause-close-failed", { data: { err } });
		}

	}

	resume() {
		if (!this.paused) return;

		this.paused = false;
		this.epoch++;

		this.relay.connect(); // Don't await connect promise. sub.fire() internally awaits the connect promise

		const stored = [...this.subs.values()];
		for (const s of stored) {
			const newFilters = cloneFilters(s.filters);
			bumpSinceFromLastEmitted(newFilters, s.lastEmitted);

			const sub = this.relay.prepareSubscription(newFilters, s.params);
			s.sub = sub;
			s.lastEmitted = sub.lastEmitted;

			sub.fire();
		}


		// Drive internal interests too
		this.pending = true;
		this.applyInterests();
	}




	private waitForRpcApplied(version: number): Promise<void> {
		if (this.isConnected() && this.rpcAppliedVersion >= version) return Promise.resolve();

		return new Promise((resolve, reject) => {
			this.rpcWaiters.push({ version, resolve, reject });
		});
	}



	private ensureOrRefireSub(
		subId: string,
		makeFilters: () => Filter[],
		makeParams: () => Partial<SubscriptionParams> & { id: string }
	) {
		const stored = this.subs.get(subId);
		const filters = makeFilters();

		// If we have a live, open subscription: refire with updated filters if rpc version differs.
		if (stored?.sub && !stored.sub.closed && this.rpcAppliedVersion !== this.rpcFilterVersion) {
			if (stored.sub.lastEmitted) {
				for (const f of filters) {
					if (f.since !== undefined) f.since = Math.max(f.since, stored.sub.lastEmitted + 1);
				}
			}
			stored.sub.filters = filters;
			stored.sub.fire();
			stored.filters = filters;
			stored.lastEmitted = stored.sub.lastEmitted;
			return stored.sub;
		}

		// Otherwise (first time, or after pause close): recreate.
		const params = makeParams();
		params.id = subId;
		const sub = this.relay.prepareSubscription(filters, params);
		this.subs.set(subId, {
			subId: params.id,
			filters,
			params,
			sub,
			lastEmitted: sub.lastEmitted,
		});

		sub.fire();
		return sub;
	}

	private ensureClientsInterests() {
		// RPC
		this.ensureOrRefireSub(
			CLIENTS_RPC_SUBID,
			() => [{
				since: Math.floor(Date.now() / 1000),
				kinds: [...allowedKinds],
				"#p": [...this.recipients.keys()],
			}],
			() => ({
				id: CLIENTS_RPC_SUBID,
				onevent: (e) => void this.onIncomingEvent(e),
				receivedEvent: (_, id) => this.handledEvents.add(id),
				alreadyHaveEvent: (id) => this.handledEvents.has(id),
			})
		);
		this.rpcAppliedVersion = this.rpcFilterVersion;
		this.flushRpcWaiters();

		// Beacons
		this.ensureOrRefireSub(
			BEACONS_SUBID,
			() => [{
				kinds: [30078],
				authors: [...this.lpks],
				"#d": [pubServiceTag],
			}],
			() => ({
				id: BEACONS_SUBID,
				onevent: (e) => void this.onIncomingEvent(e),
				receivedEvent: (_, id) => this.handledEvents.add(id),
				alreadyHaveEvent: (id) => this.handledEvents.has(id),
			})
		);
		this.beaconAppliedVersion = this.beaconFilterVersion;
	}

	trackSubscription(
		filters: Filter[],
		params: Partial<SubscriptionParams> & { label?: string; id?: string },
	) {
		const subId = params.id || makeId(16);

		const wrappedParams = {
			...params,
			id: subId,
			onclose: (reason: string) => {
				if (this.paused) return;
				params.onclose?.(reason);
			},
		};

		const stored: StoredSub = {
			subId,
			filters: cloneFilters(filters),
			params: wrappedParams,
		};


		const sub = this.relay.prepareSubscription(cloneFilters(stored.filters), stored.params);
		stored.sub = sub;
		stored.lastEmitted = sub.lastEmitted;

		this.subs.set(subId, stored);

		return {
			sub,
			remove: () => this.subs.delete(subId),
		};
	}

	closeTracked(subId: string, reason?: string) {
		const s = this.subs.get(subId);
		if (!s) return;
		try {
			s.sub?.close(reason);
		} finally {
			this.subs.delete(subId);
		}
	}



	async publish(event: Event): Promise<string> {
		return this.relay.publish(event);
	}


	private async onIncomingEvent(e: Event) {
		// Beacon
		if (e.kind === 30078) {
			try {
				const b = JSON.parse(e.content);
				this.emitter.emit("beacon", {
					updatedAtUnix: e.created_at,
					createdByPub: e.pubkey,
					name: b.name,
					relayUrl: this.url,
				});
			} catch { /* noop */ }
			return;
		}

		// RPC kinds only
		if (!e.pubkey || !allowedKinds.includes(e.kind)) return;

		const targetPubkey = e.tags.find((t) => t[0] === "p")?.[1];
		if (!targetPubkey) return;

		const privKey = this.recipients.get(targetPubkey);
		if (!privKey) return;

		try {
			let plaintext: string;

			if (e.kind === 24133) {
				const { decrypt } = nip04;
				plaintext = decrypt(privKey, e.pubkey, e.content);
			} else {
				const decoded = decodePayload(e.content);
				plaintext = decryptData(decoded, getSharedSecret(privKey, e.pubkey));
			}

			this.emitter.emit("nostrEvent", {
				id: e.id,
				pub: e.pubkey,
				to: targetPubkey,
				kind: e.kind,
				content: plaintext,
			});
		} catch (err) {
			logger.warn("relay session decrypt/process failed", { relay: this.url, err });
		}
	}
}




let pool: TransportPool | null = null;
export const getPool = () => (pool ??= new TransportPool());



export const appTag = "shockwallet"

export const getNip78Event = async (pubkey: string, relays: string[], dTag = appTag) => {
	if (relays.length === 0) return null;

	return getPool().get(relays, { kinds: [30078], '#d': [dTag], authors: [pubkey] });
}
export const newNip78Event = (data: string, pubkey: string, dTag = appTag) => {
	return {
		content: data,
		created_at: Math.floor(Date.now() / 1000),
		kind: 30078,
		tags: [["d", dTag]],
		pubkey
	}
}

export const newSourceDocEvent = (data: string, pubkey: string, dTag = appTag) => {
	return {
		content: data,
		created_at: Math.floor(Date.now() / 1000),
		kind: 30079,
		tags: [["d", dTag]],
		pubkey
	}
}

export const publishNostrEvent = async (data: Event, relays: string[]) => {

	return getPool().publish(relays, data);
}

export const subToNip78DocEvents = (relays: string[], filters: Filter[], onEvent: (e: Event) => Promise<void>) => {
	return getPool().subscribeMany(
		relays,
		filters,
		{
			onevent: (e) => {
				onEvent(e)
			},
		}
	)
}


export const fetchNostrUserMetadataEvent = async (pubKey: string, relayUrl: string[]) => {
	return getPool().get(relayUrl, { kinds: [0], authors: [pubKey] })
}

export class TypedEmitter<Events extends Record<string, any>> {
	private listeners = new Map<keyof Events, Set<(payload: any) => void>>();

	on<K extends keyof Events>(
		event: K,
		fn: (payload: Events[K]) => void,
		opts?: { signal?: AbortSignal }
	): () => void {
		let set = this.listeners.get(event);
		if (!set) {
			set = new Set();
			this.listeners.set(event, set);
		}
		set.add(fn as any);

		const off = () => {
			set!.delete(fn as any);
			if (set!.size === 0) this.listeners.delete(event);
		};

		if (opts?.signal) {
			if (opts.signal.aborted) off();
			else opts.signal.addEventListener("abort", off, { once: true });
		}

		return off;
	}

	emit<K extends keyof Events>(event: K, payload: Events[K]) {
		const set = this.listeners.get(event);
		if (!set) return;

		[...set].forEach((fn) => {
			try {
				(fn as any)(payload);
			} catch (e) {
				console.error("TypedEmitter listener error", e);
			}
		});
	}

	removeAll() {
		this.listeners.clear();
	}
}
