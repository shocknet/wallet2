export function getHex64(json: string, field: string): string {
    const len = field.length + 3
    const idx = json.indexOf(`"${field}":`) + len
    const s = json.slice(idx).indexOf(`"`) + idx + 1
    return json.slice(s, s + 64)
}

export function getInt(json: string, field: string): number {
    const len = field.length
    const idx = json.indexOf(`"${field}":`) + len + 3
    const sliced = json.slice(idx)
    const end = Math.min(sliced.indexOf(','), sliced.indexOf('}'))
    return parseInt(sliced.slice(0, end), 10)
}

export function getSubscriptionId(json: string): string | null {
    const idx = json.slice(0, 22).indexOf(`"EVENT"`)
    if (idx === -1) return null

    const pstart = json.slice(idx + 7 + 1).indexOf(`"`)
    if (pstart === -1) return null
    const start = idx + 7 + 1 + pstart

    const pend = json.slice(start + 1, 80).indexOf(`"`)
    if (pend === -1) return null
    const end = start + 1 + pend

    return json.slice(start + 1, end)
}

export function matchEventId(json: string, id: string): boolean {
    return id === getHex64(json, 'id')
}

export function matchEventPubkey(json: string, pubkey: string): boolean {
    return pubkey === getHex64(json, 'pubkey')
}

export function matchEventKind(json: string, kind: number): boolean {
    return kind === getInt(json, 'kind')
}