import { useCallback, useEffect, useState } from "react";
import { sourceRpcKey, type SourceView } from "@/State/scoped/backups/sources/selectors";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { runtimeActions } from "@/State/runtime/slice";
import {
	probePubDashboardCapability,
	type PubDashboardCapability,
} from "./pubDashboardCapability";

export function usePubDashboardCapability(adminSource: SourceView | null | undefined) {
	const dispatch = useAppDispatch();
	const sourceId = adminSource?.sourceId;
	const capability = useAppSelector((s) => (
		sourceId ? s.runtime.pubDashboardCapabilityBySourceId[sourceId] : undefined
	));
	const [checking, setChecking] = useState(false);
	const rpcKey = adminSource ? sourceRpcKey(adminSource) : "";
	const [attemptedRpcKey, setAttemptedRpcKey] = useState<string | null>(null);

	const runProbe = useCallback(async (force: boolean) => {
		if (!adminSource || !sourceId) return;
		if (!force && capability) return;

		setChecking(true);
		try {
			const result = await probePubDashboardCapability(adminSource);
			dispatch(runtimeActions.setPubDashboardCapability({
				sourceId,
				capability: result,
			}));
		} catch {
			// Leave previous/unset capability so pages can surface real RPC errors.
		} finally {
			setAttemptedRpcKey(rpcKey);
			setChecking(false);
		}
	}, [rpcKey, capability, dispatch, sourceId]);

	useEffect(() => {
		if (!adminSource || !sourceId || capability) return;
		void runProbe(false);
	}, [rpcKey, capability, runProbe, sourceId]);

	const markNeedsUpgrade = useCallback(() => {
		if (!sourceId) return;
		dispatch(runtimeActions.setPubDashboardCapability({
			sourceId,
			capability: "needs_upgrade",
		}));
	}, [dispatch, sourceId]);
	const initialProbePending = !!adminSource
		&& !capability
		&& attemptedRpcKey !== rpcKey;

	return {
		capability: capability as PubDashboardCapability | undefined,
		checking: (checking || initialProbePending) && capability !== "supported",
		needsUpgrade: capability === "needs_upgrade",
		recheck: () => void runProbe(true),
		markNeedsUpgrade,
	};
}
