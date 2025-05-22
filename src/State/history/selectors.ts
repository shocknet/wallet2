import { createSelector } from "@reduxjs/toolkit";
import { State } from "../store";


export const makeSelectSortedOperationsArray = () => {
	const constselectSortedOperationsArray = createSelector(
		[
			(state: State) => state.history.sources,
		],
		(sources) => {
			const mergedOps = Object.entries(sources).flatMap(
				([sourceId, sourceHistory]) =>
					sourceHistory.data.map(op => ({ ...op, sourceId }))
			);
			return [...mergedOps].sort((a, b) => b.paidAtUnix - a.paidAtUnix);
		}
	);

	return constselectSortedOperationsArray;

}

