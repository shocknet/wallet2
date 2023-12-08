import { SimplePool, Sub, Event, UnsignedEvent, finishEvent, relayInit } from './tools'
import { encryptData, decryptData, getSharedSecret, decodePayload, encodePayload } from './nip44'
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
        const sub = this.pool.sub(this.settings.relays, [
            {
                since: Math.ceil(Date.now() / 1000),
                kinds: [21000],
                '#p': [this.settings.publicKey],
            }
        ])
        sub.on('eose', connectedCallback)
        sub.on("event", async (e) => {
            console.log({ nostrEvent: e })
            if (e.kind !== 21000 || !e.pubkey) {
                return
            }
            const eventId = e.id
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
            kind: 21000,
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