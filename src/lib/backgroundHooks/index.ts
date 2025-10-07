import { useAppLifecycle } from "./useAppLifecycle";
import { useBackupReminder } from "./useBackReminder";
import { useDebitRequestHandler } from "./useDebitRequestHandler"
import { useLnAddressCheck } from "./useLnAddressCheck";
import { useManageRequestHandler } from "./useManageRequestHandler";
/* import { usePush } from "./usePush"; */
import { useRemoteBackup } from "./useRemoteBackup";
import { useSubscriptionsBackground } from "./useSubscriptionsBackground";
import { useSubToBeacons } from "./useSubToBeacons";

const BackgroundJobs = () => {
	useBackupReminder();
	useDebitRequestHandler();
	/* usePush(); */
	useLnAddressCheck();
	useManageRequestHandler();
	useRemoteBackup();
	useSubscriptionsBackground();
	useSubToBeacons();
	useAppLifecycle();

	return null;
}

export default BackgroundJobs;
