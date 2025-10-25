import { useAppLifecycle } from "./useAppLifecycle";
/* import { usePush } from "./usePush"; */
/* import { useSubscriptionsBackground } from "./useSubscriptionsBackground"; */


const BackgroundJobs = () => {
	/* usePush(); */
	/* useSubscriptionsBackground(); */
	useAppLifecycle();

	return null;
}

export default BackgroundJobs;
