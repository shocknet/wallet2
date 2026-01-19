import { getNostrClient, GetNostrClientNprofileArgs } from "@/Api/nostr";
import { NostrKeyPair } from "@/Api/nostrHandler";
import { toast } from "react-toastify";
import { Client } from "@/Api/nostr";

type FetcherOps = {
    onStart: () => Promise<void>,
    onEnd: () => Promise<void>,
    onFail: (error: string) => void,
}

export type FetcherFuncs<T extends readonly unknown[]> = {
    [K in keyof T]: (client: Client) => Promise<((T[K] & { status: "OK" }) | { status: "ERROR", reason: string })>
}
export const fetcher = async <T extends readonly unknown[]>(nProfile: GetNostrClientNprofileArgs, keys: NostrKeyPair, opts: FetcherOps, funcs: FetcherFuncs<T>): Promise<{ [K in keyof T]: T[K] } | null> => {
    const { onStart, onEnd, onFail } = opts
    await onStart()
    try {
        const client = await getNostrClient(nProfile, keys)
        const results: any[] = []
        for (let i = 0; i < funcs.length; i++) {
            const res = await funcs[i](client)
            if (res.status !== "OK") {
                throw new Error(res.reason)
            }
            results.push(res)
        }
        return results as { [K in keyof T]: T[K] }
    } catch (e) {
        console.error(e)
        const msg = e instanceof Error ? e.message : "Failed to fetch data"
        onFail(msg)
        return null
    } finally {
        await onEnd()
    }
}
