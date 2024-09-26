import logger from "../Api/helpers/logger"
import { getNip78Event, newNip78ChangelogEvent, newNip78Event, publishNostrEvent, pubServiceTag, subToNip78Changelogs } from "../Api/nostrHandler"
import { getDeviceId } from "../constants"
import { getSanctumNostrExtention } from "./nip07Extention"

export const fetchRemoteBackup = async (dTag?: string): Promise<{ result: 'accessTokenMissing' } | { result: 'success', decrypted: string }> => {
    const ext = getSanctumNostrExtention()
    if (!ext.valid) {
        return { result: 'accessTokenMissing' }
    }
    const pubkey = await ext.getPublicKey()
    const relays = await ext.getRelays()
    const backupEvent = await getNip78Event(pubkey, Object.keys(relays), dTag)
    if (!backupEvent) {
        logger.info("no backups found")
        return { result: 'success', decrypted: "" }
    }
    const decrypted = await ext.decrypt(pubkey, backupEvent.content)
    return { result: 'success', decrypted }
}


export const subscribeToRemoteChangelogs = async (
    latestTimestamp: number,
    handleChangelogCallback: (decrypted: string, eventTimestamp: number) => Promise<void>,
): Promise<() => void> => {
    const ext = getSanctumNostrExtention()
    if (!ext.valid) {
        throw new Error("accessTokenMissing")
    }
    const pubkey = await ext.getPublicKey()
    const relays = await ext.getRelays()
    const closer = subToNip78Changelogs(pubkey, Object.keys(relays), latestTimestamp, async event => {
        const decrypted = await ext.decrypt(pubkey, event.content);
        await handleChangelogCallback(decrypted, event.created_at);
    });
    return () => {
        closer.close()
    }
}

export const saveChangelog = async (changelog: string): Promise<number> => {
    const ext = getSanctumNostrExtention()
    if (!ext.valid) {
        throw new Error('access token missing')
    }
    const pubkey = await ext.getPublicKey()
    const relays = await ext.getRelays()
    const encrypted = await ext.encrypt(pubkey, changelog);

    const changelogEvent = newNip78ChangelogEvent(encrypted, pubkey);

    const signed = await ext.signEvent(changelogEvent);

    await publishNostrEvent(signed, Object.keys(relays));

    return signed.created_at;



}

export const saveRemoteBackup = async (backup: string, dTag?: string): Promise<number> => {
    const ext = getSanctumNostrExtention()
    if (!ext.valid) {
        throw new Error('access token missing')
    }
    const pubkey = await ext.getPublicKey()
    const relays = await ext.getRelays()
    const encrypted = await ext.encrypt(pubkey, backup)

    const backupEvent = newNip78Event(encrypted, pubkey, dTag)

    const signed = await ext.signEvent(backupEvent)

    await publishNostrEvent(signed, Object.keys(relays))
    return signed.created_at
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

export const lockSubscriptionPayment = async (id: string, backupEnabled: boolean): Promise<PaymentLock> => {
    // only when the flag has been set to true after backup service sub
    if (!backupEnabled) {
        return PaymentLock.SUCCESSFULLY_LOCKED
    }
    const existing = await fetchRemoteBackup(subsPaymentsTag)
    if (existing.result === 'accessTokenMissing') {
        logger.info("remote sync not enabled, no need to lock")
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
        logger.info("remote sync not enabled, no need to unlock")
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


export const fetchBeacon = async (pubkey: string, relays: string[], maxAgeSeconds: number) => {
    const event = await getNip78Event(pubkey, relays, pubServiceTag)
    if (!event) {
        return null
    }
    if (event.created_at + maxAgeSeconds < Math.floor(Date.now() / 1000)) {
        return null
    }
    const data = JSON.parse(event.content) as { type: 'service', name: string }
    return { createdAt: event.created_at, data }
}