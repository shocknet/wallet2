import { makeSelectSourceViewById } from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import { useMemo } from "react";

export function useSourceView(sourceId: string) {
	const selector = useMemo(makeSelectSourceViewById, []);

	return useAppSelector(state =>
		selector(state, sourceId)
	);
}

/*
	When the caller knows the sourceId is live
*/
export function useLiveSourceView(sourceId: string) {
	const source = useSourceView(sourceId);
	if (!source) throw new Error("Expected live source view for " + sourceId);
	return source;
}
