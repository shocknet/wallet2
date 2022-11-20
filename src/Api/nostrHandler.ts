import { relayPool, Subscription, Event, RelayPool } from 'nostr-tools'
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
    pool: RelayPool = relayPool()
    settings: NostrSettings
    sub: Subscription
    constructor(settings: NostrSettings, eventCallback: (event: NostrEvent) => void) {
        this.settings = settings
        this.pool.setPrivateKey(settings.privateKey)
        settings.relays.forEach(relay => {
            try {
                this.pool.addRelay(relay, { read: true, write: true })
            } catch (e) {
                console.error("cannot add relay:", relay)
            }
        });
        console.log("subbing...")
        this.sub = this.pool.sub({
            //@ts-ignore
            filter: {
                since: Math.floor(Date.now() / 1000) - 1,
                kinds: [4],
                '#p': [settings.publicKey],
            },
            cb: async (e, relay) => {
                console.log(e)
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
                eventCallback({ id: eventId, content: decrypt(this.settings.privateKey, e.pubkey, e.content), pub: e.pubkey })
            }
        })
    }

    Send(nostrPub: string, message: string) {
        this.pool.publish({
            content: encrypt(this.settings.privateKey, nostrPub, message),
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            pubkey: this.settings.publicKey,
            //@ts-ignore
            tags: [['p', nostrPub]]
        }, (status, url) => {
            console.log(status, url) // TODO
        })
    }
}