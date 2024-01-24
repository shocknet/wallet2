import { SimplePool, Sub, Event, UnsignedEvent, finishEvent, relayInit } from './tools'
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
    constructor(settings: NostrSettings, connectedCallback: () => void, eventCallback: (event: NostrEvent) => void) {
        this.settings = settings
        const sub = this.pool.sub(this.settings.relays, [
            {
                since: Math.ceil(Date.now() / 1000),
                kinds: allowedKinds,
                '#p': [this.settings.publicKey],
            }
        ])
        sub.on('eose', () => { connectedCallback() })
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
                eventCallback({ id: eventId, content: decryptedNip46, pub: e.pubkey, kind: e.kind })
            }
            const decoded = decodePayload(e.content)
            const content = await decryptData(decoded, getSharedSecret(this.settings.privateKey, e.pubkey))
            console.log({ decrypted: content })
            eventCallback({ id: eventId, content, pub: e.pubkey, kind: e.kind })
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
export const getAppBackup = (pubkey: string, relays: string[]) => {
    const pool = new SimplePool()
    const userKey = `${pubkey}@${appTag}`
    return pool.get(relays, { kinds: [30078], '#d': [userKey] })
}
const newBackupEvent = (senderPrivateKey: string, ownerPublicKey: string, data: string) => {
    return finishEvent({
        content: data,
        created_at: Math.floor(Date.now() / 1000),
        kind: 30078,
        tags: [["d", `${ownerPublicKey}@${appTag}`]]
    }, senderPrivateKey)
}
export const saveAppBackup = (senderPrivateKey: string, ownerPublicKey: string, relays: string[], data: string) => {
    const signed = newBackupEvent(senderPrivateKey, ownerPublicKey, data)
    const pool = new SimplePool()
    return pool.publish(relays, signed)
}