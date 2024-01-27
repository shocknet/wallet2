export const mergeBasicRecords = (local: Record<string, any>, remote: Record<string, any>): Record<string, any> => {
    for (const key in remote) {
        if (!local[key]) {
            local[key] = remote[key]
        }
    }
    return local
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

export const mergeArrayValues = <T>(local: T[], remote: T[], getId: (v: T) => string): T[] => {
    const record: Record<string, T> = {}
    local.forEach(l => record[getId(l)] = l)
    remote.forEach(r => record[getId(r)] = r)
    return Object.values(record)
}