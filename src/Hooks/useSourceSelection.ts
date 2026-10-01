import { selectResolvedSourceId } from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import { useState } from "react";

export function useSourceSelection() {
	const [overrideSourceId, setOverrideSourceId] = useState<string | null>(null);
	const sourceId = useAppSelector(state =>
		selectResolvedSourceId(state, overrideSourceId)
	);


	return {
		sourceId,
		overrideSourceId,
		setOverrideSourceId,
	};
}
