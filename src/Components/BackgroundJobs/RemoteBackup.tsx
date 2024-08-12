import { useEffect } from "react"
import { useDispatch, useSelector } from "../../State/store"
import { addListener, removeListener } from "@reduxjs/toolkit"
import { backupMiddleware, backupPollingStarted, backupPollingStopped } from "../../State/backupMiddleware"
export const RemoteBackup = () => {
    const dispatch = useDispatch();
    const backupStates = useSelector(state => state.backupStateSlice);

    useEffect(() => {
        if (!backupStates.subbedToBackUp) {
            dispatch(removeListener(backupMiddleware))
            dispatch(backupPollingStopped())
        }
        dispatch(addListener(backupMiddleware))
        dispatch(backupPollingStarted());
    }, [backupStates.subbedToBackUp, dispatch]);


    return null
}