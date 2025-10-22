import { useAppLifecycle } from "./useAppLifecycle";
import { useDebitRequestHandler } from "./useDebitRequestHandler"
/* import { useLnAddressCheck } from "./useLnAddressCheck"; */
import { useManageRequestHandler } from "./useManageRequestHandler";
import { usePush } from "./usePush";
/* import { useSubscriptionsBackground } from "./useSubscriptionsBackground"; */
/* import { useSubToBeacons } from "./useSubToBeacons"; */

const BackgroundJobs = () => {

	useDebitRequestHandler();
	usePush();
	/* useLnAddressCheck(); */
	useManageRequestHandler();
	/* useSubscriptionsBackground(); */
	/* useSubToBeacons(); */
	useAppLifecycle();

	return null;
}

export default BackgroundJobs;
