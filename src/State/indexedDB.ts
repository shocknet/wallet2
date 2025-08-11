import type { NostrKeyPair } from '../Api/nostrHandler';
import { openDB } from 'idb';
export const DbName = 'shockwallet:notifications';
const getDB = async () => {
    return openDB(DbName, 1, {
        upgrade(db) {
            db.createObjectStore('keyval');
        },
    })
}
export type KeyToSave = {
    keys: NostrKeyPair,
    appNpub: string
}
export const saveMultipleKeys = async (toSaveList: KeyToSave[]) => {
    const db = await getDB();
    for (const toSave of toSaveList) {
        await db.put('keyval', toSave.keys, toSave.appNpub);
    }
}

export const saveKeys = async (toSave: KeyToSave) => {
    const db = await getDB();
    await db.put('keyval', toSave.keys, toSave.appNpub);
}

export const getKeys = async (appNpub: string): Promise<NostrKeyPair | undefined> => {
    const db = await getDB();
    return db.get('keyval', appNpub);
}

export const getAllKeys = async () => {
    const db = await getDB();
    return db.getAllKeys('keyval');
}