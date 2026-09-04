import { DashDialog } from "@/Layout2/Metrics/DashDialog";
import { SourceView } from "@/State/scoped/backups/sources/selectors";
import { ChannelOpenForm } from "@/Pages/Metrics/ChannelOpenForm";

export function OpenChannelDialog({
	adminSource,
	open,
	onClose,
	onOpened,
	peerLocked,
}: {
	adminSource: SourceView;
	open: boolean;
	onClose: () => void;
	onOpened?: () => void;
	peerLocked?: string;
}) {
	if (!open) return null;
	return (
		<DashDialog title="Open channel" onClose={onClose}>
			<ChannelOpenForm
				adminSource={adminSource}
				peerLocked={peerLocked}
				onOpened={() => {
					onOpened?.();
					onClose();
				}}
			/>
		</DashDialog>
	);
}
