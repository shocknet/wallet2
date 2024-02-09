import { SimplePool, Event, UnsignedEvent, finishEvent, relayInit } from './tools'
import { encryptData, decryptData, getSharedSecret, decodePayload, encodePayload } from './nip44'
import { decrypt, encrypt } from './tools/nip04'
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
    kind: number
}
const allowedKinds = [21000, 24133]
export default class Handler {
    pool: SimplePool = new SimplePool()
    settings: NostrSettings
    eventCallback: (event: NostrEvent) => void
    constructor(settings: NostrSettings, connectedCallback: () => void, eventCallback: (event: NostrEvent) => void) {
        this.settings = settings
        this.eventCallback = eventCallback

        this.Connect(connectedCallback)
    }

    async Connect(connectedCallback?: () => void) {
        const relay = relayInit(this.settings.relays[0]) // TODO: create multiple conns for multiple relays
        try {
            await relay.connect()
        } catch (err) {
            console.log("failed to connect to relay, will try again in 2 seconds")
            setTimeout(() => {
                this.Connect(connectedCallback)
            }, 2000)
            return
        }
        console.log("connected, subbing...")
        relay.on('disconnect', () => {
            console.log("relay disconnected, will try to reconnect")
            relay.close()
            this.Connect()
        })

        const sub = relay.sub([
            {
                since: Math.ceil(Date.now() / 1000),
                kinds: allowedKinds,
                '#p': [this.settings.publicKey],
            }
        ])
        sub.on('eose', () => { if (connectedCallback) connectedCallback() })
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
                const decryptedNip46 = await decrypt(this.settings.privateKey, e.pubkey, e.content)
                console.log({ decryptedNip46 })
                this.eventCallback({ id: eventId, content: decryptedNip46, pub: e.pubkey, kind: e.kind })
            }
            const decoded = decodePayload(e.content)
            const content = await decryptData(decoded, getSharedSecret(this.settings.privateKey, e.pubkey))
            console.log({ decrypted: content })
            this.eventCallback({ id: eventId, content, pub: e.pubkey, kind: e.kind })
        })
    }

    async SendNip46(pubKey: string, message: string) {
        /*const testDst = "5474a89ff3495ea0a404b97ee4f45f45dd58a6fbe4093aa29e9474e8eb21a4d8"
        console.log("sending test event for nip46 to", testDst)
        const nip04Encrypted = await encrypt(this.settings.privateKey, testDst, JSON.stringify({ id: Math.random().toString(), method: "connect", params: ["invalid-pub", "super-secret-string"] }))*/
        const nip04Encrypted = await encrypt(this.settings.privateKey, pubKey, message)
        this.sendRaw({
            pubkey: this.settings.publicKey,
            kind: 24133,
            tags: [["p", pubKey]],
            created_at: Math.floor(Date.now() / 1000),
            content: nip04Encrypted
        })
    }

    async Send(pubKey: string, message: string) {
        const decoded = await encryptData(message, getSharedSecret(this.settings.privateKey, pubKey))
        const content = encodePayload(decoded)
        this.sendRaw({
            content,
            created_at: Math.floor(Date.now() / 1000),
            kind: 21000,
            pubkey: this.settings.publicKey,
            tags: [['p', pubKey]],
        })

    }

    async sendRaw(event: UnsignedEvent) {
        const signed = finishEvent(event, this.settings.privateKey)
        this.pool.publish(this.settings.relays, signed).forEach(p => {
            p.then(() => console.log("sent ok"))
            p.catch(() => console.log("failed to send"))
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