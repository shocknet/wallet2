import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DashDialog } from "@/Layout2/Metrics/DashDialog";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	makeSelectSourceViewById,
	selectAdminSourceIds,
	selectAdminSourceViews,
	type SourceView,
} from "@/State/scoped/backups/sources/selectors";
import { runtimeActions } from "@/State/runtime/slice";
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

export function activeAdminSourceId(
	adminIds: string[],
	selectedId: string | null,
): string | null {
	if (selectedId && adminIds.includes(selectedId)) return selectedId;
	if (adminIds.length === 1) return adminIds[0];
	return null;
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
	const selectView = useMemo(makeSelectSourceViewById, []);
	const source = useAppSelector((s) => selectView(s, sourceId));
	const adminIds = useAppSelector(selectAdminSourceIds);
	const canSwitch = adminIds.length > 1;
	const value = useMemo(
		() => (source ? { source, open, canSwitch } : null),
		[source, canSwitch, open],
	);

	if (!value) return null;

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
	const admins = useAppSelector(selectAdminSourceViews);

	const pick = (sourceId: string) => {
		if (sourceId !== selectedId) {
			dispatch(runtimeActions.setSelectedMetricsAdminSourceId({ sourceId }));
		}
		onClose();
	};

	return (
		<DashDialog title="Switch source" onClose={onClose}>
			<div className="dash-peer-stack">
				{admins.map((admin) => (
					<button
						key={admin.sourceId}
						type="button"
						className="dash-peer-item"
						onClick={() => pick(admin.sourceId)}
					>
						<div className="dash-peer-item-main">
							<div className="dash-peer-item-name">{sourceNodeDisplayName(admin)}</div>
							<div className="dash-peer-item-sub">
								<BeaconStatusLine state={admin.beaconStale} showWhenFresh />
							</div>
						</div>
						{admin.sourceId === selectedId && <span className="dash-pill is-ok">current</span>}
					</button>
				))}
			</div>
		</DashDialog>
	);
}
