import { DashDialog } from "@/Layout2/Metrics/DashDialog";
import { ChannelOpenForm } from "@/Pages/Metrics/ChannelOpenForm";

export function OpenChannelDialog({
	open,
	onClose,
	onOpened,
	peerLocked,
}: {
	open: boolean;
	onClose: () => void;
	onOpened?: () => void;
	peerLocked?: string;
}) {
	if (!open) return null;
	return (
		<DashDialog title="Open channel" onClose={onClose}>
			<ChannelOpenForm
				peerLocked={peerLocked}
				onOpened={() => {
					onOpened?.();
					onClose();
				}}
			/>
		</DashDialog>
	);
}
