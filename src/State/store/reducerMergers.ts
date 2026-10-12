import { storageKey as paySourcesStorageKey, mergeLogic as paySourcesMergeLogic } from "../Slices/paySourcesSlice";
import { storageKey as spendSourcesStorageKey, mergeLogic as spendSourcesMergeLogic } from "../Slices/spendSourcesSlice";
import { storageKey as prefsStorageKey, mergeLogic as prefsMergeLogic } from "../Slices/prefsSlice";
import { storageKey as addressbookStorageKey, mergeLogic as addressbookMergeLogic } from "../Slices/addressbookSlice";
import type { BackupAction } from "../types";

export const findReducerMerger = (storageKey: string): ((l: string, r: string) => { data: string, actions: BackupAction[] }) | null => {
	switch (storageKey) {
		case paySourcesStorageKey:
			return paySourcesMergeLogic;
		case spendSourcesStorageKey:
			return spendSourcesMergeLogic;
		case prefsStorageKey:
			return prefsMergeLogic;
		case addressbookStorageKey:
			return addressbookMergeLogic;
		default:
			return null;
	}
};
