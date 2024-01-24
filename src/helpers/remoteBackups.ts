import { getPublicKey } from "nostr-tools"
import { getNip46PrivateKey, getNip46Sender, parseNprofile, setNip46PrivateKey } from "../Api/nostr"
import { getAppBackup, saveAppBackup } from "../Api/nostrHandler"

const validateBackupData = (nprofile: string) => {
    let nip46PrivateKey = getNip46PrivateKey()
    if (!nip46PrivateKey) {
        setNip46PrivateKey()
        nip46PrivateKey = getNip46PrivateKey()
    }
    if (!nip46PrivateKey) {
        throw new Error("no nip46 key found")
    }
    const nip46Pub = getPublicKey(nip46PrivateKey)
    const { pubkey, relays } = parseNprofile(nprofile)
    if (!relays) {
        throw new Error("nprofile does not contain any relays")
    }
    return { pubkey, relays, nip46Pub, nip46Priv: nip46PrivateKey }
}

export const fetchRemoteBackup = async (nprofile: string, sanctumToken?: string): Promise<string | null> => {
    const { pubkey, relays, nip46Pub } = validateBackupData(nprofile)
    const sender = await getNip46Sender({ pubkey, relays })
    if (sanctumToken) {
        const connectRes = await sender({ method: 'connect', pubkey: nip46Pub, secret: sanctumToken })
        if (connectRes.error) {
            throw new Error("falied to connect to sanctum" + connectRes.error)
        }
    }
    const backupEvent = await getAppBackup(pubkey, relays)
    if (!backupEvent) {
        console.log("no backups found")
        return null
    }

    const decryptRes = await sender({ method: 'nip44_decrypt', pubkey, ciphertext: backupEvent.content })
    if (decryptRes.error) {
        throw new Error("failed to decrypt" + decryptRes.error)
    }
    return decryptRes.result
}

export const saveRemoteBackup = async (nprofile: string, backup: string) => {
    const { pubkey, relays, nip46Priv } = validateBackupData(nprofile)
    const sender = await getNip46Sender({ pubkey, relays })
    const encryptRes = await sender({ method: 'nip44_encrypt', pubkey, plaintext: backup })
    if (encryptRes.error) {
        throw new Error("failed to encrypt" + encryptRes.error)
    }
    await saveAppBackup(nip46Priv, pubkey, relays, backup)
}