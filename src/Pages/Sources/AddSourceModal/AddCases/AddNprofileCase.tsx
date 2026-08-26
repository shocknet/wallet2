import { IonButton, useIonLoading } from "@ionic/react";
import { addNprofileSource } from "@/State/scoped/backups/sources/thunks";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { NodeCard } from "../common/NodeCard";
import type { AddSourceCaseProps } from "../types";

export const addNprofileTitle = "Add source";

export function AddNprofileCase({ parsed, dismiss }: AddSourceCaseProps) {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const [presentLoading, dismissLoading] = useIonLoading();


	const handleAdd = async () => {
		try {
			await presentLoading({ message: "Connecting…", cssClass: "app-loading" });
			dispatch(addNprofileSource({
				lpk: parsed.pubkey,
				relays: parsed.relays,
			}));
			showToast({ color: "success", message: "Source added" });
			dismiss(true, "confirm");
		} catch (err: unknown) {
			showToast({
				color: "danger",
				message: err instanceof Error ? err.message : "Failed to add pub source",
			});
			dismiss(null, "cancel");
		} finally {
			await dismissLoading();
		}
	};

	return (
		<div className="flex flex-col gap-2">
			<NodeCard parsed={parsed} />
			<div className="mt-12 flex justify-end gap-2">
				<IonButton color="medium" onClick={() => dismiss(null, "cancel")}>
					Cancel
				</IonButton>
				<IonButton color="primary" onClick={handleAdd}>
					{addNprofileTitle}
				</IonButton>
			</div>
		</div>
	);
}
