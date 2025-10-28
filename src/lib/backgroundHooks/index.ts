import { useAppLifecycle } from "./useAppLifecycle";




import { useWatchClipboard } from "./useWatchClipboard";
/* import { usePush } from "./usePush"; */


/* import { useSubscriptionsBackground } from "./useSubscriptionsBackground"; */



const BackgroundJobs = () => {
	/* usePush(); */

	useWatchClipboard();

	/* useSubscriptionsBackground(); */
	useAppLifecycle();

	return null;
}

export default BackgroundJobs;
