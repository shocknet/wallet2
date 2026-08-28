import { IonButton, useIonLoading } from "@ionic/react";
import { alertCircleOutline, shieldCheckmarkOutline } from "ionicons/icons";
import { connectAsAdmin } from "@/State/scoped/backups/sources/thunks";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { NodeCard } from "../common/NodeCard";
import { selectSourceViewsByLpk } from "@/State/scoped/backups/sources/selectors";
import type { ParsedNprofileInput } from "@/lib/types/parse";
import type { ModalDismiss } from "@/Components/Modals/hooks/useAskModal";

export const connectAsAdminTitle = "Connect as admin";

export type ParsedNprofileWithAdmin = ParsedNprofileInput & {
	adminEnrollToken: string;
};

export function ConnectAsAdminCase({
	parsed,
	dismiss,
}: {
	parsed: ParsedNprofileWithAdmin;
	dismiss: ModalDismiss<true>;
}) {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const [presentLoading, dismissLoading] = useIonLoading();
	const adminEnrollToken = parsed.adminEnrollToken;

	const sourcesFromSameLpk = useAppSelector((state) =>
		selectSourceViewsByLpk(state, parsed.pubkey),
	);
	const existingAdmin = sourcesFromSameLpk.find((source) => !!source.adminToken);
	const alreadyAdmin =
		!!existingAdmin && existingAdmin.adminToken === adminEnrollToken;

	const handleConnect = async () => {
		try {
			await presentLoading({ cssClass: "app-loading", message: "Connecting…", backdropDismiss: false });
			await dispatch(connectAsAdmin({
				lpk: parsed.pubkey,
				relays: parsed.relays,
				adminEnrollToken,
			}));
			showToast({
				color: "success",
				message: "Connected as admin",
				icon: shieldCheckmarkOutline,
			});
			dismiss(true, "confirm");
		} catch (err: unknown) {
			showToast({
				color: "danger",
				header: "Failed to connect as admin",
				icon: alertCircleOutline,
				message: err instanceof Error ? err.message : undefined,
			});
			dismiss(null, "cancel");
		} finally {
			await dismissLoading();
		}
	};


	if (alreadyAdmin) {
		return (
			<div className="flex flex-col gap-2">
				<NodeCard parsed={parsed} />
				<p className="mt-5 text-base font-medium text-primary">
					You&apos;re already the admin of this Lightning.Pub node
				</p>
				<p className="m-0 text-sm leading-5 text-muted">
					This wallet already has operator access to the dashboard, invitations,
					and node management. You can close this.
				</p>
				<div className="mt-12 flex justify-end gap-2">
					<IonButton color="primary" onClick={() => dismiss(true, "confirm")}>
						Done
					</IonButton>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<NodeCard parsed={parsed} />
			<p className="mt-5 text-base font-medium text-primary">
				Connecting as admin
			</p>
			<p className="text-sm leading-5 text-muted">
				Admin unlocks the node dashboard in ShockWallet — metrics, invitations,
				channels, and other operator tools for this node.
			</p>
			<div className="mt-12 flex justify-end gap-2">
				<IonButton color="medium" onClick={() => dismiss(null, "cancel")}>
					Cancel
				</IonButton>
				<IonButton color="primary" onClick={() => void handleConnect()}>
					{connectAsAdminTitle}
				</IonButton>
			</div>
		</div>
	);
}
