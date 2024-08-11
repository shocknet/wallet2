import { useEffect } from "react"
import { useDispatch, useSelector } from "../../State/store"
import logger from "../../Api/helpers/logger"
import { addListener, removeListener } from "@reduxjs/toolkit"
import { backupMiddleware, backupPollingMiddleware, backupPollingStarted, backupPollingStopped } from "../../State/backupMiddleware"
export const RemoteBackup = () => {
    const dispatch = useDispatch();
    const backupStates = useSelector(state => state.backupStateSlice);

    useEffect(() => {
        if (!backupStates.subbedToBackUp) {
            dispatch(removeListener(backupMiddleware))
            dispatch(backupPollingStopped())
        }
        dispatch(addListener(backupMiddleware))
        dispatch(addListener(backupPollingMiddleware))
        dispatch(backupPollingStarted());
    }, [backupStates.subbedToBackUp, dispatch]);


    return null
}