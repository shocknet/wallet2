import { Event, UnsignedEvent, Relay, finalizeEvent, nip04, Filter } from 'nostr-tools'
import { NofferData, NofferResponse, SendNofferRequest } from "@shocknet/clink-sdk"
import { Buffer } from 'buffer';
//import { Event, UnsignedEvent, finishEvent, relayInit, Relay } from './tools'
import { encryptData, decryptData, getSharedSecret, decodePayload, encodePayload } from './nip44v1'
import logger from './helpers/logger';
import { SimplePool } from 'nostr-tools';
import { Subscription } from 'nostr-tools/lib/types/abstract-relay';
import { getAllNostrClients } from './nostr';
import { App } from '@capacitor/app';
import { startHealthCheckLoop, stopHealthCheckLoop } from './health';
import { utils } from "nostr-tools";
import { isPlatform } from '@ionic/react';
const { decrypt, encrypt } = nip04
export const pubServiceTag = "Lightning.Pub"
export const appTag = "shockwallet"
const changelogsTag = "shockwallet:changelog";
const EVENT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_SECONDS = 60
const handledEvents: { eventId: string, addedAtUnix: number }[] = []
const removeExpiredEvents = () => {
	const now = Date.now();
	for (let i = handledEvents.length - 1; i >= 0; i--) {
		if (now - handledEvents[i].addedAtUnix > EVENT_TTL_MS) {
			handledEvents.splice(i, 1);
		}
	}
}
const pool = new SimplePool()
setInterval(removeExpiredEvents, CLEANUP_INTERVAL_SECONDS * 1000);
export type BeaconUpdate = {
	updatedAtUnix: number
	createdByPub: string
	name: string
}
export type NostrKeyPair = {
	privateKey: string
	publicKey: string
}
export type NostrEvent = {
	id: string
	pub: string
	content: string
	kind: number
	to: string // addressed pubkey
}

export type RelaysSettings = {
	relays: string[];
	keys: NostrKeyPair
}

type RelayArgs = {
	eventCallback: (event: NostrEvent) => void
	beaconCallback: (beaconUpdate: BeaconUpdate) => void
	disconnectCallback: () => void
}

type RelayData = {
	relay: Relay;
	subscription?: Subscription;
	subbedPairs: Map<string, string>;
	eventCallback: (event: NostrEvent) => void
	beaconCallback: (beaconUpdate: BeaconUpdate) => void
	disconnectCallback: () => void
	closed: boolean;

	ready: Promise<void>;
	_resolveReady?: () => void;

} & RelayArgs
const allowedKinds = [21000, 24133]

const RETRY_UNSAFE = new Set(["PayAddress", "PayInvoice"])
export default class RelayCluster {
	pool: SimplePool = new SimplePool()
	private relays = new Map<string, RelayData>();
	private connectingRelays = new Map<string, Promise<RelayData>>();
	beaconListeners: Record<number, (beaconUpdate: BeaconUpdate) => void> = {}
	private bgTimer: ReturnType<typeof setTimeout> | null = null;
	private allowConnet: boolean;

	constructor() {
		this.allowConnet = true;
		startHealthCheckLoop();
		App.addListener("appStateChange", ({ isActive }) => {
			if (isActive) {
				startHealthCheckLoop();
				if (isPlatform("hybrid")) { // only run backgrounding logic in native mobile
					this.foregroundReconnect();
				}
			} else {
				stopHealthCheckLoop();
				if (isPlatform("hybrid")) { // only run backgrounding logic in native mobile
					this.backgroundGraceClose();
				}
			}
		})
	}


	addRelays = (relaysSettings: RelaysSettings, eventCallback: (event: NostrEvent) => void, disconnectCallback: (disconnectedRelayUrl: string) => void) => {
		const relayUrls = relaysSettings.relays;


		return Promise.any(relayUrls.map(r => {
			this.addRelay(r, relaysSettings.keys, eventCallback, () => disconnectCallback(r))
		}))
	}
	addBeaconListener = (callback: (beaconUpdate: BeaconUpdate) => void) => {
		const subId = Math.floor(Math.random() * 1000000)
		this.beaconListeners[subId] = callback
		return () => {
			delete this.beaconListeners[subId]
		}
	}

	async addRelay(relayUrl: string, keys: NostrKeyPair, eventCallback: (event: NostrEvent) => void, disconnectCallback: () => void) {
		if (!this.allowConnet) return;
		const relay = await this.getOrCreateRelay(
			relayUrl,
			[keys],
			{
				eventCallback,
				disconnectCallback,
				beaconCallback: (beaconUpdate: BeaconUpdate) => {
					Object.values(this.beaconListeners).forEach(cb => cb(beaconUpdate))
				}
			}
		);


		await relay.ready; // Make sure to await eose event from relay before allowing any client to send requests
		this.updateFilters(relay, keys);
	}


	private async getOrCreateRelay(relay: string, keys: NostrKeyPair[], relayArgs: RelayArgs) {
		const relayUrl = utils.normalizeURL(relay)
		const existing = this.relays.get(relayUrl);
		if (existing?.relay.connected) {
			return existing;
		}

		// race here can only happen between one nostr client (since GetNostrClient is queued)
		// and the foreground handler in mobile app
		let connecting = this.connectingRelays.get(relayUrl);
		if (!connecting) {
			connecting = (async () => {
				try {
					const relay = await Relay.connect(relayUrl);

					const existingAfterConnect = this.relays.get(relayUrl);
					if (existingAfterConnect && !existingAfterConnect.closed) {
						relay.close();
						return existingAfterConnect;
					}

					const subbedPairs = new Map<string, string>();
					keys.forEach(key => {
						subbedPairs.set(key.publicKey, key.privateKey);
					})

					let resolveReady: () => void;
					const relayData: RelayData = {
						relay,
						subbedPairs,
						...relayArgs,
						closed: false,
						ready: new Promise<void>(r => resolveReady = r),
						_resolveReady: () => resolveReady(),
					};

					const sub = this.createSubscription(relayData);
					relayData.subscription = sub;

					this.subToBeacon(relayData);

					relay.onclose = () => this.relays.delete(relayUrl); // onclose is not closed when we manually close the connection
					this.relays.set(relayUrl, relayData);
					return relayData;
				} finally {
					this.connectingRelays.delete(relayUrl)
				}
			})();
			this.connectingRelays.set(relayUrl, connecting);
		}

		return connecting;
	}

	private createSubscription(relay: RelayData): Subscription {
		const filter: Filter = {
			since: Math.floor(Date.now() / 1000),
			kinds: allowedKinds,
			'#p': Array.from(relay.subbedPairs.keys()),
		};
		return relay.relay.subscribe([filter], {
			onevent: (event) => this.handleEvent(event, relay),
			oneose: () => {
				relay._resolveReady?.();
			}
		});
	}

	private updateFilters(relay: RelayData, keyPair: NostrKeyPair) {
		if (!relay.subscription || relay.subscription?.closed) {
			relay.subbedPairs.set(keyPair.publicKey, keyPair.privateKey);
			const sub = this.createSubscription(relay);
			relay.subscription = sub;
		} else {
			if (relay.subbedPairs.has(keyPair.publicKey)) {
				return;
			}
			relay.subbedPairs.set(keyPair.publicKey, keyPair.privateKey);


			const filter: Filter = {
				since: Math.floor(Date.now() / 1000),
				kinds: allowedKinds,
				'#p': Array.from(relay.subbedPairs.keys()),
			};

			relay.subscription.filters = [filter];
			relay.subscription.fire();
		}

	}

	private async handleEvent(e: Event, relay: RelayData) {
		logger.log({ nostrEvent: e })

		if (!e.pubkey || !allowedKinds.includes(e.kind)) {
			return
		}
		const eventId = e.id
		if (handledEvents.find(e => e.eventId === eventId)) {
			logger.info("event already handled")
			return
		}
		handledEvents.push({ eventId, addedAtUnix: Date.now() });

		const targetPubkey = e.tags.find(tag => tag[0] === 'p')?.[1];
		if (!targetPubkey) {
			logger.warn("no 'p' tag found in event");
			return;
		}

		const privKey = relay.subbedPairs.get(targetPubkey);
		if (!privKey) {
			logger.warn(`no keypair found for pubkey: ${targetPubkey}`);
			return;
		}

		if (e.kind === 24133) {
			const decryptedNip46 = await decrypt(privKey, e.pubkey, e.content)
			logger.log({ decryptedNip46 })
			relay.eventCallback({ id: eventId, content: decryptedNip46, pub: e.pubkey, kind: e.kind, to: targetPubkey })
		}
		const decoded = decodePayload(e.content)
		const content = await decryptData(decoded, getSharedSecret(privKey, e.pubkey))
		relay.eventCallback({ id: eventId, content, pub: e.pubkey, kind: e.kind, to: targetPubkey })
	}

	private async subToBeacon(relay: RelayData) {
		relay.relay.subscribe([
			{ kinds: [30078], '#d': [pubServiceTag] }
		], {
			oneose: () => { console.log("subbed to beacon") },
			onevent: (e) => {
				const b = JSON.parse(e.content)
				relay.beaconCallback({ updatedAtUnix: e.created_at, createdByPub: e.pubkey, name: b.name })
			}
		})
	}

	SendNip46 = async (relays: string[], pubKey: string, message: string, keys: NostrKeyPair) => {
		const nip04Encrypted = await encrypt(keys.privateKey, pubKey, message)
		this.sendRaw(
			relays,
			{
				pubkey: keys.publicKey,
				kind: 24133,
				tags: [["p", pubKey]],
				created_at: Math.floor(Date.now() / 1000),
				content: nip04Encrypted,
			},
			keys.privateKey
		)
	}

	Send = async (relays: string[], pubKey: string, message: string, keys: NostrKeyPair) => {
		const decoded = await encryptData(message, getSharedSecret(keys.privateKey, pubKey))
		const content = encodePayload(decoded)
		this.sendRaw(
			relays,
			{
				content,
				created_at: Math.floor(Date.now() / 1000),
				kind: 21000,
				pubkey: keys.publicKey,
				tags: [['p', pubKey]]
			},
			keys.privateKey
		)
	}

	SendNip69 = async (relays: string[], pubKey: string, data: NofferData, keys: NostrKeyPair): Promise<NofferResponse> => {
		return SendNofferRequest(this.pool, new Uint8Array(Buffer.from(keys.privateKey, 'hex')), relays, pubKey, data)
	}

	sendRaw = async (relays: string[], event: UnsignedEvent, privateKey: string) => {
		const signed = finalizeEvent(event, new Uint8Array(Buffer.from(privateKey, 'hex')))
		this.pool.publish(relays, signed).forEach(p => {
			p.then(() => logger.info("sent ok"))
			p.catch(() => logger.error("failed to send"))
		})
		return signed
	}

	getActiveRelays = () => {
		return Array.from(this.relays.entries()).filter(([_, relay]) => relay.relay?.connected).map(([url, _]) => url)
	}

	resetrelays = async () => {
		this.allowConnet = false;
		if (this.connectingRelays.size !== 0) {
			await Promise.allSettled(this.connectingRelays.values());
			this.connectingRelays.clear();
		}
		this.relays.values().forEach(relay => {
			relay.relay.close();
		})
		this.relays.clear();
		this.beaconListeners = {};
	}
	backgroundGraceClose = () => {
		if (this.bgTimer) return;
		this.bgTimer = setTimeout(() => {
			getAllNostrClients().forEach(c => {
				Object.entries(c.clientCbs).forEach(([id, cb]) => {
					if (cb.type !== "single") return;
					const rpcName = cb.message.rpcName || "";
					const safe = !RETRY_UNSAFE.has(rpcName);

					if (safe) {
						cb.paused = true;
					} else {
						cb.f({ status: "ERROR", reason: "backgrounded" });
						delete c.clientCbs[id];
					}
				})
			})
			this.relays.values().forEach(relay => {
				relay.relay.close();
				relay.closed = true;
				relay.subscription = undefined;
			})
			this.bgTimer = null;
		}, 5_000);
	}


	foregroundReconnect = async () => {
		if (this.bgTimer) {
			clearTimeout(this.bgTimer);
			this.bgTimer = null;
			return;
		}

		await Promise.allSettled(this.relays.values().map(async relay => {
			await this.getOrCreateRelay( // Recreate the relay connection, using the existing args
				relay.relay.url,
				Array.from(relay.subbedPairs.entries().map(([pubkey, privkey]) => ({ publicKey: pubkey, privateKey: privkey }))),
				{
					eventCallback: relay.eventCallback,
					disconnectCallback: relay.disconnectCallback,
					beaconCallback: relay.beaconCallback
				}
			)
			await relay.ready;
		}))

		getAllNostrClients().forEach(c => {
			Object.values(c.clientCbs).forEach(cb => {
				if (cb.paused) {
					cb.startedAtMillis = Date.now(); // makes healthCheck happy
					cb.paused = undefined;
					c.send(c.relays, cb.to, JSON.stringify(cb.message), c.settings) // resend event
				}
			});
		});
	}
}

export const getNip78Event = (pubkey: string, relays: string[], dTag = appTag) => {

	return pool.get(relays, { kinds: [30078], '#d': [dTag], authors: [pubkey] })
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
export const publishNostrEvent = async (data: Event, relays: string[]) => {

	return Promise.any(pool.publish(relays, data))
}


export const newNip78ChangelogEvent = (data: string, pubkey: string) => {
	return {
		content: data,
		created_at: Math.floor(Date.now() / 1000),
		kind: 2121,
		tags: [["d", changelogsTag]],
		pubkey
	}
}


export const subToNip78DocEvents = (pubkey: string, relays: string[], filter: Filter[], onEvent: (e: Event) => Promise<void>) => {
	return pool.subscribeMany(
		relays,
		filter,
		{
			onevent: (e) => {
				onEvent(e)
			},
		}
	)
}

export const subToNip78Changelogs = (pubkey: string, relays: string[], timestamp: number, onEvent: (e: Event) => Promise<void>) => {
	return pool.subscribeMany(
		relays,
		[
			{
				since: timestamp,
				kinds: [2121],
				'#d': [changelogsTag],
				authors: [pubkey]
			}
		],
		{
			onevent: (e) => {
				onEvent(e)
			},
		}
	)
}


export const fetchNostrUserMetadataEvent = async (pubKey: string, relayUrl: string[]) => {
	return pool.get(relayUrl, { kinds: [0], authors: [pubKey] })
}

