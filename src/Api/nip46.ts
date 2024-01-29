/*export type Nip46Request = { method: "ping" } | { method: "connect", pubkey: string, secret: string } | { method: "get_public_key" } | { method: "nip44_encrypt", pubkey: string, plaintext: string } | { method: "nip44_decrypt", pubkey: string, ciphertext: string }
export type Nip46Response = { id: string, result: string, error?: string }
export const serializeNip46Event = (id: string, req: Nip46Request) => {
    const { method } = req
    let params: string[] = []
    if (method === 'connect') {
        params = [req.pubkey, req.secret]
    } else if (method === 'nip44_encrypt') {
        params = [req.pubkey, req.plaintext]
    } else if (method === 'nip44_decrypt') {
        params = [req.pubkey, req.ciphertext]
    }
    return JSON.stringify({ id, method, params })
}*/