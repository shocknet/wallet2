import { SimplePool, Event, UnsignedEvent, finishEvent, relayInit } from './tools'
import { encryptData, decryptData, getSharedSecret, decodePayload, encodePayload } from './nip44'
import { decrypt, encrypt } from './tools/nip04'
const handledEvents: string[] = [] // TODO: - big memory leak here, add TTL
export type NostrSettings = {
    privateKey: string
    publicKey: string
}
export type NostrEvent = {
    id: string
    pub: string
    content: string
    kind: number
}
const allowedKinds = [21000, 24133]

export default class RelayCluster {
    pool: SimplePool = new SimplePool()
    settings: NostrSettings
    relays: Record<string, RelayHandler> = {}
    constructor(settings: NostrSettings) {
        this.settings = settings
    }


    addRelays = (relayUrls: string[], connectedCallback: (connectedRelayUrl: string) => void, eventCallback: (event: NostrEvent) => void, disconnectCallback: (disconnectedRelayUrl: string) => void) => {
        const relaysToAdd = relayUrls.filter(r => !this.relays[r])
        const alreadyConnected = relaysToAdd.length !== relayUrls.length
        if (alreadyConnected) {
            connectedCallback(relayUrls.find(r => this.relays[r]) as string)
        }
        let batchConnected = false
        const onConnect = (relay: string) => {
            if (!alreadyConnected) {
                console.log("connected to:", relay, "not triggering callback, as another relay is already connected")
                return
            }
            if (batchConnected) {
                console.log("connected to:", relay, "not triggering callback, as batch connected callback already triggered")
                return
            }
            batchConnected = true
            console.log("connected to:", relay, "triggering callback")
            connectedCallback(relay)
        }
        relaysToAdd.forEach(r => {
            this.addRelay(r, () => onConnect(r), eventCallback, () => disconnectCallback(r))
        })
    }

    addRelay = (relayUrl: string, connectedCallback: () => void, eventCallback: (event: NostrEvent) => void, disconnectCallback: () => void) => {
        if (this.relays[relayUrl]) {
            return
        }
        this.relays[relayUrl] = new RelayHandler({
            settings: this.settings,
            relay: relayUrl,
            connectedCallback,
            eventCallback,
            disconnectCallback
        })
    }

    SendNip46 = async (relays: string[], pubKey: string, message: string) => {
        const nip04Encrypted = await encrypt(this.settings.privateKey, pubKey, message)
        this.sendRaw(relays, {
            pubkey: this.settings.publicKey,
            kind: 24133,
            tags: [["p", pubKey]],
            created_at: Math.floor(Date.now() / 1000),
            content: nip04Encrypted
        })
    }

    Send = async (relays: string[], pubKey: string, message: string) => {
        const decoded = await encryptData(message, getSharedSecret(this.settings.privateKey, pubKey))
        const content = encodePayload(decoded)
        this.sendRaw(relays, {
            content,
            created_at: Math.floor(Date.now() / 1000),
            kind: 21000,
            pubkey: this.settings.publicKey,
            tags: [['p', pubKey]],
        })
    }

    sendRaw = async (relays: string[], event: UnsignedEvent) => {
        const signed = finishEvent(event, this.settings.privateKey)
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
    settings: NostrSettings
    relay: string
    connectedCallback: () => void
    eventCallback: (event: NostrEvent) => void
    disconnectCallback: () => void
}

class RelayHandler {
    args: RelayArgs
    connected = false
    constructor(args: RelayArgs) {
        this.args = args
        this.Connect(true)
    }

    isConnected = () => {
        return this.connected
    }

    onConnect = (triggerConnectCb: boolean) => {
        this.connected = true
        if (triggerConnectCb) {
            this.args.connectedCallback()
        }
    }

    Connect = async (triggerConnectCb: boolean) => {
        const relay = relayInit(this.args.relay)
        try {
            await relay.connect()
        } catch (err) {
            console.log("failed to connect to relay, will try again in 2 seconds")
            setTimeout(() => {
                this.Connect(true)
            }, 2000)
            return
        }
        console.log("connected, subbing...")
        relay.on('disconnect', () => {
            console.log("relay disconnected, will try to reconnect")
            relay.close()
            this.connected = false
            this.args.disconnectCallback()
            this.Connect(false)
        })

        const sub = relay.sub([
            {
                since: Math.ceil(Date.now() / 1000),
                kinds: allowedKinds,
                '#p': [this.args.settings.publicKey],
            }
        ])
        sub.on('eose', () => { this.onConnect(triggerConnectCb) })
        sub.on("event", async (e) => {
            console.log({ nostrEvent: e })

            if (!e.pubkey || !allowedKinds.includes(e.kind)) {
                return
            }
            const eventId = e.id
            if (handledEvents.includes(eventId)) {
                console.log("event already handled")
                return
            }

            handledEvents.push(eventId)
            if (e.kind === 24133) {
                const decryptedNip46 = await decrypt(this.args.settings.privateKey, e.pubkey, e.content)
                console.log({ decryptedNip46 })
                this.args.eventCallback({ id: eventId, content: decryptedNip46, pub: e.pubkey, kind: e.kind })
            }
            const decoded = decodePayload(e.content)
            const content = await decryptData(decoded, getSharedSecret(this.args.settings.privateKey, e.pubkey))
            console.log({ decrypted: content })
            this.args.eventCallback({ id: eventId, content, pub: e.pubkey, kind: e.kind })
        })
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