import { Event, UnsignedEvent, finishEvent, relayInit, Relay } from './tools'
import { encryptData, decryptData, getSharedSecret, decodePayload, encodePayload } from './nip44'
import { decrypt, encrypt } from './tools/nip04'
import { Sub } from 'nostr-tools';
import logger from './helpers/logger';
import { SimplePool } from 'nostr-tools';
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
}
export type Nip69Success = { bolt11: string }
export type Nip69Error = { code: number, error: string, range: { min: number, max: number } }
export type Nip69Response = Nip69Success | Nip69Error

export type RelaysSettings = {
    relays: string[];
    keys: NostrKeyPair
}
export type NofferData = { offer: string, amount?: number }
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

    SendNip69 = async (relays: string[], pubKey: string, data: NofferData, keys: NostrKeyPair): Promise<Nip69Response> => {
        const decoded = await encryptData(JSON.stringify(data), getSharedSecret(keys.privateKey, pubKey))
        const content = encodePayload(decoded)
        const e = await this.sendRaw(
            relays,
            {
                content,
                created_at: Math.floor(Date.now() / 1000),
                kind: 21001,
                pubkey: keys.publicKey,
                tags: [['p', pubKey]]
            },
            keys.privateKey
        )
        const sub = this.pool.sub(relays, [{
            since: Math.floor(Date.now() / 1000) - 1,
            kinds: [21001],
            '#p': [keys.publicKey],
            '#e': [e.id]
        }])
        return new Promise<Nip69Response>((res, rej) => {
            const timeout = setTimeout(() => {
                sub.unsub(); rej("failed to get nip69 reponse in time")
            }, 30 * 1000)
            sub.on('event', async (e) => {
                clearTimeout(timeout)
                const decoded = decodePayload(e.content)
                const content = await decryptData(decoded, getSharedSecret(keys.privateKey, pubKey))
                res(JSON.parse(content))
            })
        })
    }

    sendRaw = async (relays: string[], event: UnsignedEvent, privateKey: string) => {
        const signed = finishEvent(event, privateKey)
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
    sub: Sub | null = null;
    beaconSub: Sub | null = null;
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
        const relay = relayInit(this.args.relay)
        this.subbedPairs.push(keys);

        try {
            await relay.connect()
        } catch (err) {
            logger.error("failed to connect to relay, will try again in 2 seconds")
            setTimeout(() => {
                this.Connect(true, keys)
            }, 2000)
            return
        }
        logger.info("connected, subbing...")
        relay.on('disconnect', () => {
            logger.warn("relay disconnected, will try to reconnect")
            if (this.sub) {
                this.sub.unsub()
            }
            if (this.beaconSub) {
                this.beaconSub.unsub()
            }
            relay.close()
            this.connected = false
            this.args.disconnectCallback()
            this.Connect(false, keys)
        })
        this.relay = relay
        this.SubToEvents(triggerConnectCb)
        this.SubToBeacon()
    }

    SubToBeacon = async () => {
        if (!this.relay) { return }
        this.beaconSub = this.relay.sub([
            { kinds: [30078], '#d': [pubServiceTag] }
        ])
        this.beaconSub.on('eose', () => { console.log("subbed to beacon") })
        this.beaconSub.on("event", async (e) => {
            const b = JSON.parse(e.content)
            this.args.beaconCallback({ updatedAtUnix: e.created_at, createdByPub: e.pubkey, name: b.name })
        })
    }

    SubToEvents = async (triggerConnectCb: boolean, keys?: NostrKeyPair, connectedCallback?: () => void) => {
        if (!this.relay) { return }
        if (keys) { // new keys to sub with
            logger.info("renewing sub")
            this.subbedPairs.push(keys);
        }
        this.sub = this.relay.sub([
            {
                since: Math.ceil(Date.now() / 1000),
                kinds: allowedKinds,
                '#p': this.subbedPairs.map(k => k.publicKey),
            }
        ])

        this.sub.on('eose', () => { this.onConnect(triggerConnectCb) })
        this.sub.on("event", async (e) => {
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

            let addressedKeyPair: NostrKeyPair | null | undefined = null;
            for (const tag of e.tags) {
                if (tag[0] === 'p') {
                    const pubkey = tag[1];
                    addressedKeyPair = this.subbedPairs.find(p => p.publicKey === pubkey);
                }
            }

            if (e.kind === 24133) {
                const decryptedNip46 = await decrypt(addressedKeyPair!.privateKey, e.pubkey, e.content)
                logger.log({ decryptedNip46 })
                this.args.eventCallback({ id: eventId, content: decryptedNip46, pub: e.pubkey, kind: e.kind })
            }
            const decoded = decodePayload(e.content)
            const content = await decryptData(decoded, getSharedSecret(addressedKeyPair!.privateKey, e.pubkey))
            logger.log({ decrypted: content }, addressedKeyPair?.publicKey)
            this.args.eventCallback({ id: eventId, content, pub: e.pubkey, kind: e.kind })
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
        kind: 5500,
        tags: [["d", changelogsTag]],
        pubkey
    }
}

export const subToNip78Changelogs = (pubkey: string, relays: string[], timestamp: number) => {
    const sub = pool.sub(relays, [
        {
            since: timestamp,
            kinds: [5500],
            '#d': [changelogsTag],
            authors: [pubkey]
        }
    ])
    return sub;
}