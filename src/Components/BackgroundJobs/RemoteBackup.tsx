import { useEffect } from "react"
import { useDispatch, useSelector } from "../../State/store"
import { backupMiddleware, backupSubStarted, backupSubStopped, typedAddListener, typedRemoveListener } from "../../State/backupMiddleware"
export const RemoteBackup = () => {
    const dispatch = useDispatch();
    const backupStates = useSelector(state => state.backupStateSlice);

    useEffect(() => {
        if (!backupStates.subbedToBackUp) {
            dispatch(typedRemoveListener(backupMiddleware))
            dispatch(backupSubStopped())
            return;
        }
        dispatch(typedAddListener(backupMiddleware))
        dispatch(backupSubStarted());
    }, [backupStates.subbedToBackUp, dispatch]);


    return null
}