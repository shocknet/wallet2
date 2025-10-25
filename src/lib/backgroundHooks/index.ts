import { useAppLifecycle } from "./useAppLifecycle";
import { useDebitRequestHandler } from "./useDebitRequestHandler"
/* import { useLnAddressCheck } from "./useLnAddressCheck"; */
import { useManageRequestHandler } from "./useManageRequestHandler";
import { useWatchClipboard } from "./useWatchClipboard";
/* import { usePush } from "./usePush"; */
/* import { useSubscriptionsBackground } from "./useSubscriptionsBackground"; */
/* import { useSubToBeacons } from "./useSubToBeacons"; */

const BackgroundJobs = () => {

	useDebitRequestHandler();
	/* usePush(); */
	/* useLnAddressCheck(); */
	useWatchClipboard();
	useManageRequestHandler();
	/* useSubscriptionsBackground(); */
	/* useSubToBeacons(); */
	useAppLifecycle();

	return null;
}

export default BackgroundJobs;
