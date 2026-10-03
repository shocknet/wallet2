import {
	selectResolvedAdminSourceId,
	selectResolvedSourceId,
} from "@/State/scoped/backups/sources/selectors";
import type { RootState } from "@/State/store/store";
import { useAppSelector } from "@/State/store/hooks";
import { useState } from "react";

function useOverridableSourceId<T extends string | null>(
	resolve: (state: RootState, overrideSourceId: string | null) => T,
) {
	const [overrideSourceId, setOverrideSourceId] = useState<string | null>(null);
	const sourceId = useAppSelector(state => resolve(state, overrideSourceId));

	return {
		sourceId,
		overrideSourceId,
		setOverrideSourceId,
	};
}

export function useSourceSelection() {
	return useOverridableSourceId(selectResolvedSourceId);
}

export function useAdminSourceSelection() {
	return useOverridableSourceId(selectResolvedAdminSourceId);
}
