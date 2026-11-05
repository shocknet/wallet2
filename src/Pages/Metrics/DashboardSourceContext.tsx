import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DashDialog } from "@/Layout2/Metrics/DashDialog";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	selectAdminSourceIds,
	type SourceView,
} from "@/State/scoped/backups/sources/selectors";
import { useLiveSourceView } from "@/Hooks/useSourceView";
import { runtimeActions, selectMetricsAdminSession } from "@/State/runtime/slice";
import {
	activeAdminSourceId,
	readRememberedDashAdminSource,
	sessionSourceIdForIdentity,
} from "@/State/runtime/dashAdminSourceMemory";
import { selectActiveIdentityRuntime } from "@/State/identitiesRegistry/slice";
import { sourceNodeDisplayName } from "@/Components/Source/sourceDisplayName";
import { BeaconStatusLine } from "@/Components/BeaconStatusLine";

type DashboardSourceCtx = {
	source: SourceView;
	open: () => void;
	canSwitch: boolean;
};

const DashboardSourceContext = createContext<DashboardSourceCtx | null>(null);

function useDashboardSourceCtx(): DashboardSourceCtx {
	const ctx = useContext(DashboardSourceContext);
	if (!ctx) {
		throw new Error("must be used inside DashboardSourceProvider");
	}
	return ctx;
}

export function useDashAdminSelection() {
	const adminIds = useAppSelector(selectAdminSourceIds);
	const session = useAppSelector(selectMetricsAdminSession);
	const pubkey = useAppSelector((s) => selectActiveIdentityRuntime(s)?.pubkey ?? null);
	const selectedId = sessionSourceIdForIdentity(session, pubkey);
	const rememberedId = pubkey ? readRememberedDashAdminSource(pubkey) : null;
	const activeId = activeAdminSourceId(adminIds, selectedId, rememberedId);
	return { adminIds, selectedId, pubkey, activeId };
}

export function useDashboardSource(): SourceView {
	return useDashboardSourceCtx().source;
}

export function useDashboardSourceSwitch() {
	const { open, canSwitch } = useDashboardSourceCtx();
	return { open, canSwitch };
}

export function SelectedAdminSourceProvider({
	sourceId,
	children,
}: {
	sourceId: string;
	children: ReactNode;
}) {
	const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false);
	const open = useCallback(() => setIsSwitchDialogOpen(true), []);
	const close = useCallback(() => setIsSwitchDialogOpen(false), []);
	const source = useLiveSourceView(sourceId);
	const adminIds = useAppSelector(selectAdminSourceIds);
	const canSwitch = adminIds.length > 1;
	const value = useMemo(
		() => ({ source, open, canSwitch }),
		[source, canSwitch, open],
	);

	return (
		<DashboardSourceContext.Provider value={value}>
			{children}
			{isSwitchDialogOpen && <DashSourceSwitchDialog onClose={close} />}
		</DashboardSourceContext.Provider>
	);
}

function DashSourceSwitchDialog({ onClose }: { onClose: () => void }) {
	const dispatch = useAppDispatch();
	const selectedId = useDashboardSource().sourceId;
	const adminIds = useAppSelector(selectAdminSourceIds);
	const pubkey = useAppSelector((s) => selectActiveIdentityRuntime(s)?.pubkey ?? null);

	const pick = (sourceId: string) => {
		if (pubkey && sourceId !== selectedId) {
			dispatch(runtimeActions.setSelectedMetricsAdminSourceId({
				identityPubkey: pubkey,
				sourceId,
			}));
		}
		onClose();
	};

	return (
		<DashDialog title="Switch source" onClose={onClose}>
			<div className="dash-peer-stack">
				{adminIds.map((id) => (
					<DashSourceSwitchRow
						key={id}
						sourceId={id}
						selected={id === selectedId}
						onPick={pick}
					/>
				))}
			</div>
		</DashDialog>
	);
}

function DashSourceSwitchRow({
	sourceId,
	selected,
	onPick,
}: {
	sourceId: string;
	selected: boolean;
	onPick: (sourceId: string) => void;
}) {
	const source = useLiveSourceView(sourceId);

	return (
		<button
			type="button"
			className="dash-peer-item"
			onClick={() => onPick(source.sourceId)}
		>
			<div className="dash-peer-item-main">
				<div className="dash-peer-item-name">{sourceNodeDisplayName(source)}</div>
				<div className="dash-peer-item-sub">
					<BeaconStatusLine state={source.beaconStale} showWhenFresh />
				</div>
			</div>
			{selected && <span className="dash-pill is-ok">current</span>}
		</button>
	);
}
