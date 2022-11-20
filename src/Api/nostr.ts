import { generatePrivateKey, getPublicKey } from 'nostr-tools'
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, NOSTR_PUB_DESTINATION, NOSTR_RELAYS } from '../constants'
import { NostrRequest } from './autogenerated/ts/nostr_transport'
import NewNostrClient from './autogenerated/ts/nostr_client'
import NostrHandler from './nostrHandler'
const setNostrPrivateKey = (key: string) => {
    localStorage.setItem(NOSTR_PRIVATE_KEY_STORAGE_KEY, key)
}
const getNostrPrivateKey = () => {
    return localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY)
}
let nostrPrivateKey = getNostrPrivateKey()
if (!nostrPrivateKey) {
    nostrPrivateKey = generatePrivateKey()
    setNostrPrivateKey(nostrPrivateKey)
}
const nostrPublicKey = getPublicKey(Buffer.from(nostrPrivateKey, 'hex'))
const clientCbs: Record<string, (res: any) => void> = {}
const handler = new NostrHandler({
    privateKey: nostrPrivateKey,
    publicKey: nostrPublicKey,
    relays: NOSTR_RELAYS
}, e => {
    const res = JSON.parse(e.content) as { requestId: string }
    if (clientCbs[res.requestId]) {
        console.log("cb found")
        const cb = clientCbs[res.requestId]
        cb(res)
        delete clientCbs[res.requestId]
    } else {
        console.log("cb not found")
    }
})
const clientSend = (to: string, message: NostrRequest): Promise<any> => {
    console.log("sending", message)
    if (!message.requestId) {
        message.requestId = makeId(16)
    }
    const reqId = message.requestId
    if (clientCbs[reqId]) {
        throw new Error("request was already sent")
    }
    handler.Send(to, JSON.stringify(message))
    return new Promise(res => {
        clientCbs[reqId] = (response: any) => {
            res(response)
        }
    })
}
export const nostr = NewNostrClient({
    retrieveNostrUserAuth: async () => { return nostrPublicKey },
    pubDestination: NOSTR_PUB_DESTINATION,
}, clientSend)

function makeId(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}