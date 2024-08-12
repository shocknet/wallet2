import { DataVersion } from "../types"

export const mergeBasicRecords = (local: Record<string, any>, remote: Record<string, any>,): Record<string, any> => {
    return  { ...remote, ...local }
}


const isRemoteNewer = (localVersion: DataVersion, remoteVersion: DataVersion): boolean => {
    if (remoteVersion.version > localVersion.version) {
        return true;
    } else if (remoteVersion.version < localVersion.version) {
        return false;
    } else {
        if (remoteVersion.timestamp > localVersion.timestamp) {
            return true;
        } else if (remoteVersion.timestamp < localVersion.timestamp) {
            return false;
        } else {
            return true // same versions, same values
        }
    }
}

export const mergeRecords = <T>(local: Record<string, T>, remote: Record<string, T>, mergeItem: (local: T, remote: T) => T) => {
    for (const key in remote) {
        if (!local[key]) {
            local[key] = remote[key]
        } else {
            local[key] = mergeItem(local[key], remote[key])
        }
    }
    return local
}


export const mergeNonFungibleRecords = <T>(
    local: Record<string, T>,
    remote: Record<string, T>,
    localVersion: DataVersion,
    remoteVersion: DataVersion
) => {

    const merged: Record<string, T> = {};

    for (const key in remote) {
        const localItem = local[key]
        const remoteItem = remote[key]
        if (!localItem) {
            if (remoteVersion.version === 0) { // Just got introduced to backup versions
                merged[key] = remoteItem;
            } else if (isRemoteNewer(localVersion, remoteVersion)) {
                merged[key] = remoteItem
            }
        } else {
            if (remoteVersion.version === 0) { // Just got introduced to backup versions
                merged[key] = remoteItem;
            } else {
                if (isRemoteNewer(localVersion, remoteVersion)) {
                    merged[key] = remoteItem;
                } else {
                    merged[key] = localItem
                }
            }
        }
    }

    for (const key in local) {
        const localItem = local[key];
        const remoteItem = remote[key];
        if (!remoteItem) {
            if (localVersion.version === 0) { // Just subbed to back up
                merged[key] = localItem;
            } else {
                if (!isRemoteNewer(localVersion, remoteVersion)) {
                   merged[key] = localItem;
                }
            }
        }
    }
    return merged
}

export const mergeArrayValues = <T>(local: T[], remote: T[], getId: (v: T) => string): T[] => {
    const record: Record<string, T> = {}
    local.forEach(l => record[getId(l)] = l)
    remote.forEach(r => record[getId(r)] = r)
    return Object.values(record)
}

export const mergeArrayValuesWithOrder = <T>(local: T[], remote: T[], localVersion: DataVersion, remoteVersion: DataVersion, getId: (v: T) => string): T[] => {
    const map = new Map<string, T>();
    const order: string[] = [];
    const orderAndRecord = (value: T) => {
        const id = getId(value);
        if (!map.has(id)) {
            order.push(id);
        }
        map.set(id, value)
    }
    const remoteNewer = isRemoteNewer(localVersion, remoteVersion)
    const first = remoteNewer ? remote : local;
    const second = remoteNewer ? local : remote
    first.forEach(orderAndRecord);
    second.forEach(orderAndRecord);
    return order.map(id => map.get(id)!);
}






