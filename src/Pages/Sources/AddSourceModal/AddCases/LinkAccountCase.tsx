import { IonButton, useIonLoading } from "@ionic/react";
import { linkExistingAccount } from "@/State/scoped/backups/sources/thunks";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { NodeCard } from "../common/NodeCard";
import type { AddSourceCaseProps, SourceIntegrationData } from "../types";
import { linkOutline } from "ionicons/icons";



export function LinkExistingAccountCase({
	parsed,
	dismiss,
	integrationData,
}: AddSourceCaseProps & { integrationData: SourceIntegrationData }) {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const [presentLoading, dismissLoading] = useIonLoading();

	const handleLink = async () => {
		try {
			await presentLoading({ cssClass: "app-loading", message: "Linking account…", backdropDismiss: false });
			await dispatch(linkExistingAccount({
				lpk: parsed.pubkey,
				relays: parsed.relays,
				token: integrationData.token,
				lnAddress: integrationData.lnAddress,
			}));
			showToast({
				color: "success",
				header: "Account linked",
				message: "The account has been linked to the wallet.",
				icon: linkOutline,
			});
			dismiss(true, "confirm");
		} catch (err: unknown) {
			showToast({
				color: "danger",
				message: err instanceof Error ? err.message : "Failed to open account",
			});
			dismiss(null, "cancel");
		} finally {
			await dismissLoading();
		}
	};

	return (
		<div className="flex flex-col gap-2">
			<NodeCard parsed={parsed} />
			<p className="m-0 text-sm leading-5 text-muted">
				This opens an existing Lightning account in ShockWallet so you can
				send and receive with its balance.
			</p>

			<p className="m-0 break-all text-sm">
				<span className="text-muted">Address </span>
				<span className="text-secondary">{integrationData.lnAddress}</span>
			</p>

			<div className="mt-12 flex justify-end gap-2">
				<IonButton color="medium" onClick={() => dismiss(null, "cancel")}>
					Cancel
				</IonButton>
				<IonButton color="primary" onClick={handleLink}>
					Link account
				</IonButton>
			</div>
		</div>
	);
}
