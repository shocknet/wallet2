import type { AppThunk } from '@/State/store/store';
import { createDeferred } from '@/lib/deferred';
import { historyFetchAllRequested } from '@/State/identitiesRegistry/middleware/actions';






// Fetches all pub sources history
export function fetchAllSourcesHistory(): AppThunk<Promise<void>> {
	return async (dispatch) => {
		const deferred = createDeferred<void>();
		dispatch(historyFetchAllRequested({ deferred }));
		await deferred;
	}
}



