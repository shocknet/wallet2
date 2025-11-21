import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { ListenerSpec } from "../lifecycle/lifecycle";
import { isAnyOf } from "@reduxjs/toolkit";
import { getDeviceId } from "@/constants";
import { selectLiveSourceIds } from "@/State/scoped/backups/sources/selectors";
import { identityActions, selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";

export const favInvariantpec: ListenerSpec = {
	name: "puller",
	listeners: [
		(add) =>
			add({
				matcher: isAnyOf(
					sourcesActions._createDraftDoc,
					sourcesActions.markDeleted,
					sourcesActions.applyRemoteSource
				),
				effect: async (_, listenerApi) => {

					// debounce
					listenerApi.cancelActiveListeners();
					await listenerApi.delay(15);

					const deviceId = getDeviceId();
					const state = listenerApi.getState();
					const ids = selectLiveSourceIds(state);
					const fav = selectFavoriteSourceId(state);

					if (ids.length === 0) {
						if (fav !== null) listenerApi.dispatch(identityActions.setFavoriteSource({ sourceId: null, by: deviceId }));
						return;
					}


					if (!fav || !ids.includes(fav)) {
						listenerApi.dispatch(identityActions.setFavoriteSource({ sourceId: ids[0], by: deviceId }));
					}

				}
			})
	]
}
