import { getAppBackup, newBackupEvent, publishNostrEvent } from "../Api/nostrHandler"
import { getSanctumNostrExtention } from "./nip07Extention"

export const fetchRemoteBackup = async (): Promise<{ result: 'accessTokenMissing' } | { result: 'success', decrypted: string }> => {
    const ext = getSanctumNostrExtention()
    if (!ext.valid) {
        return { result: 'accessTokenMissing' }
    }
    const pubkey = await ext.getPublicKey()
    const relays = await ext.getRelays()
    const backupEvent = await getAppBackup(pubkey, Object.keys(relays))
    if (!backupEvent) {
        console.log("no backups found")
        return { result: 'success', decrypted: "" }
    }
    const decrypted = await ext.decrypt(pubkey, backupEvent.content)
    return { result: 'success', decrypted }
}

export const saveRemoteBackup = async (backup: string) => {
    const ext = getSanctumNostrExtention()
    if (!ext.valid) {
        throw new Error('access token missing')
    }
    const pubkey = await ext.getPublicKey()
    const relays = await ext.getRelays()
    const encrypted = await ext.encrypt(pubkey, backup)

    const backupEvent = newBackupEvent(encrypted, pubkey)

    const signed = await ext.signEvent(backupEvent)

    await publishNostrEvent(signed, Object.keys(relays))
}