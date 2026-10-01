import { selectResolvedAdminSourceId } from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import { useState } from "react";

export function useAdminSourceSelection() {
	const [overrideSourceId, setOverrideSourceId] = useState<string | null>(null);
	const sourceId = useAppSelector(state =>
		selectResolvedAdminSourceId(state, overrideSourceId)
	);

	return {
		sourceId,
		overrideSourceId,
		setOverrideSourceId,
	};
}
