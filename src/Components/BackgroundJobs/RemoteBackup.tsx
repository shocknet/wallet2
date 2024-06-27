import { useEffect } from "react"
import { findReducerMerger, syncRedux, useSelector } from "../../State/store"
import { fetchRemoteBackup, saveRemoteBackup } from "../../helpers/remoteBackups"
import { ignoredStorageKeys } from "../../constants"
import logger from "../../Api/helpers/logger"
import { useStore } from "react-redux"
export const RemoteBackup = () => {
    const store = useStore();
    const backupStates = useSelector(state => state.backupStateSlice);

    useEffect(() => {
        if (!backupStates.subbedToBackUp) {
            logger.info("instance not initialized yet to sync backups");
            return
        }
        syncBackups().then(() => logger.info("backups synced succesfully")).catch((e) => logger.error("failed to sync backups", e))
    }, [backupStates])
    const syncBackups = async () => {
        const backup = await fetchRemoteBackup()
        if (backup.result !== 'success') {
            throw new Error('access token missing')
        }
        let data: Record<string, string | null> = {}
        if (backup.decrypted) {
            data = JSON.parse(backup.decrypted);
            for (const key in data) {

                const merger = findReducerMerger(key)
                if (!merger) {
                    continue
                }
                const serialRemote = data[key] as string
                const serialLocal = localStorage.getItem(key)
                
                let newItem = "";
                // present on backup but not local, for example addressBook
                if (!serialLocal) {
                    newItem = serialRemote;
                } else {
                    newItem = merger(serialLocal, serialRemote)
                }
                console.log(key, JSON.parse(serialLocal ?? "null"), JSON.parse(serialRemote), JSON.parse(newItem));

                // update object that will be sent to backup/nostr
                data[key] = newItem;
                // update local with the merged object too
                localStorage.setItem(key, newItem);
                store.dispatch(syncRedux());
            }

        } else {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i) ?? "null";
                const value = localStorage.getItem(key);
                if (value && !ignoredStorageKeys.includes(key)) {
                    data[key] = value;
                }
            }
        }
        await saveRemoteBackup(JSON.stringify(data))

    }
    return null
}