//import { relayPool, Subscription, Event, RelayPool } from 'nostr-tools'
import { SimplePool, Sub, Event, UnsignedEvent, finishEvent, relayInit } from './tools'
import { encryptData, decryptData, getSharedSecret, decodePayload, encodePayload } from './nip44'
//@ts-ignore
import { decrypt, encrypt } from 'nostr-tools/nip04.js'
const handledEvents: string[] = [] // TODO: - big memory leak here, add TTL
export type NostrSettings = {
    privateKey: string
    publicKey: string
    relays: string[]
}
export type NostrEvent = {
    id: string
    pub: string
    content: string
}
export default class Handler {
    pool: SimplePool = new SimplePool()
    settings: NostrSettings
    constructor(settings: NostrSettings, connectedCallback: () => void, eventCallback: (event: NostrEvent) => void) {
        this.settings = settings
        this.Connect(connectedCallback, eventCallback)
    }

    async Connect(connectedCallback: () => void, eventCallback: (event: NostrEvent) => void) {
        console.log("subbing")
        const relay = relayInit(this.settings.relays[0])
        relay.on('connect', () => {
            console.log(`connected to ${relay.url}`)
            connectedCallback()
        })
        relay.on('error', () => {
            console.log(`failed to connect to ${relay.url}`)
        })

        await relay.connect()
        const sub = relay.sub([
            {
                since: Math.ceil(Date.now() / 1000),
                kinds: [4],
                '#p': [this.settings.publicKey],
            }
        ])
        sub.on("event", async (e) => {
            console.log({ nostrEvent: e })
            if (e.kind !== 4 || !e.pubkey) {
                return
            }
            //@ts-ignore
            const eventId = e.id as string
            if (handledEvents.includes(eventId)) {
                console.log("event already handled")
                return
            }
            handledEvents.push(eventId)
            const decoded = decodePayload(e.content)
            const content = await decryptData(decoded, getSharedSecret(this.settings.privateKey, e.pubkey))
            console.log({ decrypted: content })
            eventCallback({ id: eventId, content, pub: e.pubkey })
        })
    }

    async Send(pubKey: string, message: string) {
        const decoded = await encryptData(message, getSharedSecret(this.settings.privateKey, pubKey))
        const content = encodePayload(decoded)
        const event: UnsignedEvent = {
            content,
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            pubkey: this.settings.publicKey,
            tags: [['p', pubKey]],
        }
        const signed = finishEvent(event, this.settings.privateKey)
        this.pool.publish(this.settings.relays, signed).forEach(p => {
            p.then(() => console.log("sent ok"))
            p.catch(() => console.log("failed to send"))
        })
    }
}