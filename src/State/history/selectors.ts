import { createSelector } from "@reduxjs/toolkit";
import { State } from "../store";


export const makeSelectSortedOperationsArray = () => {
	const selectSortedOperationsArray = createSelector(
		[
			(state: State) => state.history,
		],
		(history) => {
			if (history === undefined) return [];
			const sources = history.sources;
			const mergedOps = Object.entries(sources).flatMap(
				([sourceId, sourceHistory]) =>
					sourceHistory.data.map(op => ({ ...op, sourceId }))
			);
			return [...mergedOps].sort((a, b) => b.paidAtUnix - a.paidAtUnix);
		}
	);

	return selectSortedOperationsArray;

}
