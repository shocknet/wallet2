import type { AppThunk } from "@/State/store/store";
import { shellActions } from "@/shell/slice";
import type { AppIntent, AppIntentInput } from "./types";

export const enqueueAppIntent = (intent: AppIntentInput): AppThunk<void> => (dispatch) => {
	dispatch(shellActions.pendingIntentSet({
		...intent,
		id: crypto.randomUUID(),
	} as AppIntent));
};
