import { getAppBackup, newBackupEvent, publishNostrEvent } from "../Api/nostrHandler"
import { getDeviceId } from "../constants"
import { getSanctumNostrExtention } from "./nip07Extention"

export const fetchRemoteBackup = async (dTag?: string): Promise<{ result: 'accessTokenMissing' } | { result: 'success', decrypted: string }> => {
    const ext = getSanctumNostrExtention()
    if (!ext.valid) {
        return { result: 'accessTokenMissing' }
    }
    const pubkey = await ext.getPublicKey()
    const relays = await ext.getRelays()
    const backupEvent = await getAppBackup(pubkey, Object.keys(relays), dTag)
    if (!backupEvent) {
        console.log("no backups found")
        return { result: 'success', decrypted: "" }
    }
    const decrypted = await ext.decrypt(pubkey, backupEvent.content)
    return { result: 'success', decrypted }
}

export const saveRemoteBackup = async (backup: string, dTag?: string) => {
    const ext = getSanctumNostrExtention()
    if (!ext.valid) {
        throw new Error('access token missing')
    }
    const pubkey = await ext.getPublicKey()
    const relays = await ext.getRelays()
    const encrypted = await ext.encrypt(pubkey, backup)

    const backupEvent = newBackupEvent(encrypted, pubkey, dTag)

    const signed = await ext.signEvent(backupEvent)

    await publishNostrEvent(signed, Object.keys(relays))
}
const subsPaymentsTag = "shockwallet:subs"
const lockExpirationSeconds = 5 * 60
type SubsPaymentsEntry = { clientId: string, paymentId: string, expirationUnix: number, success: boolean }
type SubsPayments = Record<string, SubsPaymentsEntry>
export enum PaymentLock {
    SUCCESSFULLY_LOCKED,
    ALREADY_PENDING,
    ALREADY_SUCCESS
}

export const lockSubscriptionPayment = async (id: string): Promise<PaymentLock> => {
    const existing = await fetchRemoteBackup(subsPaymentsTag)
    if (existing.result === 'accessTokenMissing') {
        console.log("remote sync not enabled, no need to lock")
        return PaymentLock.SUCCESSFULLY_LOCKED
    }
    const subs = existing.decrypted ? (JSON.parse(existing.decrypted) as SubsPayments) : {}
    const entry = subs[id]
    const nowUnix = Math.floor(Date.now() / 1000)
    if (entry && entry.success) {
        return PaymentLock.ALREADY_SUCCESS
    }
    if (entry && nowUnix < entry.expirationUnix) {
        return PaymentLock.ALREADY_PENDING
    }
    const myDeviceId = getDeviceId()
    subs[id] = { clientId: myDeviceId, paymentId: id, expirationUnix: nowUnix + lockExpirationSeconds, success: false }
    await saveRemoteBackup(JSON.stringify(subs), subsPaymentsTag)
    await new Promise((res) => setTimeout(res, 3000))

    const updated = await fetchRemoteBackup(subsPaymentsTag)
    if (updated.result === 'accessTokenMissing') {
        throw new Error("remote sync not enabled")
    }
    const updatedEntry = subs[id]
    if (updatedEntry.clientId === myDeviceId) {
        return PaymentLock.SUCCESSFULLY_LOCKED
    }
    return updatedEntry.success ? PaymentLock.ALREADY_SUCCESS : PaymentLock.ALREADY_PENDING
}

export const unlockSubscriptionPayment = async (id: string, success: boolean) => {
    const existing = await fetchRemoteBackup(subsPaymentsTag)
    if (existing.result === 'accessTokenMissing') {
        console.log("remote sync not enabled, no need to unlock")
        return
    }
    const myDeviceId = getDeviceId()
    const subs = existing.decrypted ? (JSON.parse(existing.decrypted) as SubsPayments) : {}
    const entry = subs[id]
    if (!entry || entry.clientId !== myDeviceId) {
        return
    }
    if (success) {
        subs[id] = { ...entry, success: true }
    } else {
        delete subs[id]
    }
    await saveRemoteBackup(JSON.stringify(subs), subsPaymentsTag)
}
