import { useEffect } from "react"
import { useSelector } from "@/State/store/store"
import { addBackupListener, backupMiddlewareListner, backupPollingListener, backupSubStarted, backupSubStopped, removeBackupListener, useBackupMiddlewareListenerDispatch } from "@/State/backupMiddleware";

export const useRemoteBackup = () => {
	const dispatch = useBackupMiddlewareListenerDispatch();
	const backupStates = useSelector(state => state.backupStateSlice);

	useEffect(() => {
		if (backupStates.subbedToBackUp) {
			dispatch(addBackupListener(backupPollingListener));
			dispatch(addBackupListener(backupMiddlewareListner));
			dispatch(backupSubStarted());
		} else {
			dispatch(removeBackupListener(backupPollingListener));
			dispatch(removeBackupListener(backupMiddlewareListner));
			dispatch(backupSubStopped());
		}
	}, [backupStates.subbedToBackUp, dispatch]);
}
