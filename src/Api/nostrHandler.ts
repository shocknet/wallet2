import { SimplePool, Event, UnsignedEvent, finishEvent, relayInit } from './tools'
import { encryptData, decryptData, getSharedSecret, decodePayload, encodePayload } from './nip44'
import { decrypt, encrypt } from './tools/nip04'
import { Sub } from 'nostr-tools';

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
setInterval(removeExpiredEvents, CLEANUP_INTERVAL_SECONDS * 1000);

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

export type RelaysSettings = {
    relays: string[];
    keys: NostrKeyPair
}
const allowedKinds = [21000, 24133]

export default class RelayCluster {
    pool: SimplePool = new SimplePool()
    relays: Record<string, RelayHandler> = {}

    addRelays = (relaysSettings: RelaysSettings, connectedCallback: (connectedRelayUrl: string) => void, eventCallback: (event: NostrEvent) => void, disconnectCallback: (disconnectedRelayUrl: string) => void) => {
        const relayUrls = relaysSettings.relays;
        const relaysToAdd = relayUrls.filter(r => !this.relays[r])
        console.log("existing relays:", Object.keys(this.relays), "relay urls", relayUrls, "new relays to add:", relaysToAdd)
        const onConnect = (relay: string) => {
            connectedCallback(relay)
        }
        relayUrls.forEach(r => {
            this.addRelay(r, relaysSettings.keys, () => onConnect(r), eventCallback, () => disconnectCallback(r))
        })
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
            disconnectCallback
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

    sendRaw = async (relays: string[], event: UnsignedEvent, privateKey: string) => {
        const signed = finishEvent(event, privateKey)
        this.pool.publish(relays, signed).forEach(p => {
            p.then(() => console.log("sent ok"))
            p.catch(() => console.log("failed to send"))
        })
    }

    getActiveRelays = () => {
        return Object.entries(this.relays).filter(([_, relay]) => relay.isConnected()).map(([url, _]) => url)
    }
}

type RelayArgs = {
    relay: string
    connectedCallback: () => void
    eventCallback: (event: NostrEvent) => void
    disconnectCallback: () => void
}

class RelayHandler {
    sub: Sub | null = null;
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
            console.log("failed to connect to relay, will try again in 2 seconds")
            setTimeout(() => {
                this.Connect(true, keys)
            }, 2000)
            return
        }
        console.log("connected, subbing...")
        relay.on('disconnect', () => {
            console.log("relay disconnected, will try to reconnect")
            if (this.sub) {
                this.sub.unsub()
            }
            relay.close()
            this.connected = false
            this.args.disconnectCallback()
            this.Connect(false, keys)
        })
        this.sub = relay.sub([
            {
                since: Math.ceil(Date.now() / 1000),
                kinds: allowedKinds,
                '#p': this.subbedPairs.map(k => k.publicKey),
            }
        ])
        this.SubToEvents(triggerConnectCb)

    }


    SubToEvents = async (triggerConnectCb: boolean, keys?: NostrKeyPair, connectedCallback?: () => void) => {
        if (!this.sub) return // should never happen becuase of the queue in getNostrClient,
        //just appeasing ts

        if (keys) { // new keys to sub with
            console.log("renewing sub")
            this.subbedPairs.push(keys);
            this.sub = this.sub.sub([
                {
                    since: Math.ceil(Date.now() / 1000),
                    kinds: allowedKinds,
                    '#p': this.subbedPairs.map(k => k.publicKey),
                }
            ], {})

        }
        this.sub.on('eose', () => { this.onConnect(triggerConnectCb) })
        this.sub.on("event", async (e) => {
            console.log({ nostrEvent: e })

            if (!e.pubkey || !allowedKinds.includes(e.kind)) {
                return
            }
            const eventId = e.id
            if (handledEvents.find(e => e.eventId === eventId)) {
                console.log("event already handled")
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
                console.log({ decryptedNip46 })
                this.args.eventCallback({ id: eventId, content: decryptedNip46, pub: e.pubkey, kind: e.kind })
            }
            const decoded = decodePayload(e.content)
            const content = await decryptData(decoded, getSharedSecret(addressedKeyPair!.privateKey, e.pubkey))
            console.log({ decrypted: content })
            this.args.eventCallback({ id: eventId, content, pub: e.pubkey, kind: e.kind })
        })
        if (keys && connectedCallback) {
					setTimeout(() => {
						connectedCallback()
					}, 1000)
        }
    }
}
const appTag = "shockwallet"
export const getAppBackup = (pubkey: string, relays: string[], dTag = appTag) => {
    const pool = new SimplePool()
    return pool.get(relays, { kinds: [30078], '#d': [dTag], authors: [pubkey] })
}
export const newBackupEvent = (data: string, pubkey: string, dTag = appTag) => {
    return {
        content: data,
        created_at: Math.floor(Date.now() / 1000),
        kind: 30078,
        tags: [["d", dTag]],
        pubkey
    }
}
export const publishNostrEvent = (data: Event, relays: string[]) => {
    const pool = new SimplePool()
    return pool.publish(relays, data)
}