import { Event, UnsignedEvent, Relay, finalizeEvent, nip04 } from 'nostr-tools'
import { NofferData, NofferResponse, SendNofferRequest } from "@shocknet/clink-sdk"
import { Buffer } from 'buffer';
//import { Event, UnsignedEvent, finishEvent, relayInit, Relay } from './tools'
import { encryptData, decryptData, getSharedSecret, decodePayload, encodePayload } from './nip44v1'
import logger from './helpers/logger';
import { SimplePool } from 'nostr-tools';
const { decrypt, encrypt } = nip04
export const pubServiceTag = "Lightning.Pub"
const appTag = "shockwallet"
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
const allowedKinds = [21000, 24133]

export default class RelayCluster {
    pool: SimplePool = new SimplePool()
    relays: Record<string, RelayHandler> = {}
    beaconListeners: Record<number, (beaconUpdate: BeaconUpdate) => void> = {}

    addRelays = (relaysSettings: RelaysSettings, connectedCallback: (connectedRelayUrl: string) => void, eventCallback: (event: NostrEvent) => void, disconnectCallback: (disconnectedRelayUrl: string) => void) => {
        const relayUrls = relaysSettings.relays;
        const relaysToAdd = relayUrls.filter(r => !this.relays[r])
        logger.info("existing relays:", Object.keys(this.relays), "relay urls", relayUrls, "new relays to add:", relaysToAdd)
        const onConnect = (relay: string) => {
            connectedCallback(relay)
        }
        relayUrls.forEach(r => {
            this.addRelay(r, relaysSettings.keys, () => onConnect(r), eventCallback, () => disconnectCallback(r))
        })
    }

    addBeaconListener = (callback: (beaconUpdate: BeaconUpdate) => void) => {
        const subId = Math.floor(Math.random() * 1000000)
        this.beaconListeners[subId] = callback
        return () => {
            delete this.beaconListeners[subId]
        }
    }

    addRelay = (relayUrl: string, keys: NostrKeyPair, connectedCallback: () => void, eventCallback: (event: NostrEvent) => void, disconnectCallback: () => void) => {
        if (this.relays[relayUrl] && !this.relays[relayUrl].subbedPairs.find(s => s.privateKey === keys.privateKey)) {
            this.relays[relayUrl].SubToEvents(false, keys, connectedCallback)
            return
        }

        this.relays[relayUrl] = new RelayHandler({
            relay: relayUrl,
            connectedCallback,
            eventCallback,
            disconnectCallback,
            beaconCallback: (beaconUpdate: BeaconUpdate) => {
                Object.values(this.beaconListeners).forEach(cb => cb(beaconUpdate))
            }
        }, keys)
        return
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
        return Object.entries(this.relays).filter(([_, relay]) => relay.isConnected()).map(([url, _]) => url)
    }
}

type RelayArgs = {
    relay: string
    connectedCallback: () => void
    eventCallback: (event: NostrEvent) => void
    beaconCallback: (beaconUpdate: BeaconUpdate) => void
    disconnectCallback: () => void
}

class RelayHandler {
    relay: Relay | null = null
    subbedPairs: NostrKeyPair[] = [];
    args: RelayArgs
    connected = false
    constructor(args: RelayArgs, keys: NostrKeyPair) {
        this.args = args
        this.Connect(true, keys)
    }

    isConnected = () => {
        return this.connected
    }

    onConnect = (triggerConnectCb: boolean) => {
        this.connected = true
        if (triggerConnectCb) {
            setTimeout(() => {
                this.args.connectedCallback()
            }, 1000)

        }
    }

    Connect = async (triggerConnectCb: boolean, keys: NostrKeyPair) => {
        this.subbedPairs.push(keys);
        let relay: Relay;
        try {
            relay = await Relay.connect(this.args.relay)
        } catch {
            logger.error("failed to connect to relay, will try again in 2 seconds")
            setTimeout(() => {
                this.Connect(true, keys)
            }, 2000)
            return
        }
        logger.info("connected, subbing...")
        relay.onclose = () => {
            logger.warn("relay disconnected, will try to reconnect")
            relay.close()
            this.connected = false
            this.args.disconnectCallback()
            this.Connect(false, keys)
        }
        this.relay = relay
        this.SubToEvents(triggerConnectCb)
        this.SubToBeacon()
    }

    SubToBeacon = async () => {
        if (!this.relay) { return }
        this.relay.subscribe([
            { kinds: [30078], '#d': [pubServiceTag] }
        ], {
            oneose: () => { console.log("subbed to beacon") },
            onevent: (e) => {
                const b = JSON.parse(e.content)
                this.args.beaconCallback({ updatedAtUnix: e.created_at, createdByPub: e.pubkey, name: b.name })
            }
        })
    }

    SubToEvents = async (triggerConnectCb: boolean, keys?: NostrKeyPair, connectedCallback?: () => void) => {
        if (!this.relay) { return }
        if (keys) { // new keys to sub with
            logger.info("renewing sub")
            this.subbedPairs.push(keys);
        }
        this.relay.subscribe([
            {
                since: Math.ceil(Date.now() / 1000),
                kinds: allowedKinds,
                '#p': this.subbedPairs.map(k => k.publicKey),
            }
        ], {
            oneose: () => { this.onConnect(triggerConnectCb) },
            onevent: async (e) => {
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

                const addressedKeyPair = this.subbedPairs.find(p => p.publicKey === targetPubkey);
                if (!addressedKeyPair) {
                    logger.warn(`no keypair found for pubkey: ${targetPubkey}`);
                    return;
                }

                if (e.kind === 24133) {
                    const decryptedNip46 = await decrypt(addressedKeyPair.privateKey, e.pubkey, e.content)
                    logger.log({ decryptedNip46 })
                    this.args.eventCallback({ id: eventId, content: decryptedNip46, pub: e.pubkey, kind: e.kind, to: addressedKeyPair.publicKey })
                }
                const decoded = decodePayload(e.content)
                const content = await decryptData(decoded, getSharedSecret(addressedKeyPair.privateKey, e.pubkey))
                this.args.eventCallback({ id: eventId, content, pub: e.pubkey, kind: e.kind, to: addressedKeyPair.publicKey })
            }
        })
        if (keys && connectedCallback) {
            setTimeout(() => {
                connectedCallback()
            }, 1000)
        }
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