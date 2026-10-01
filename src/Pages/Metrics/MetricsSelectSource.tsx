import { useState } from "react";
import { IonButton, IonContent, IonPage } from "@ionic/react";

import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { selectAdminSourceIds } from "@/State/scoped/backups/sources/selectors";
import { runtimeActions } from "@/State/runtime/slice";
import { useLiveSourceView, useSourceView } from "@/Hooks/useSourceView";

import { CustomSelect } from "@/Components/CustomSelect";
import { SelectedSource, SourceSelectOption } from "@/Components/CustomSelect/commonSelects";

function AdminSourceOption({ sourceId }: { sourceId: string }) {
	const source = useLiveSourceView(sourceId);
	return <SourceSelectOption source={source} />;
}

function AdminSourceSelected({ sourceId }: { sourceId: string }) {
	const source = useSourceView(sourceId);
	if (!source) return null;
	return <SelectedSource source={source} />;
}

export default function MetricsSelectSource() {
	const dispatch = useAppDispatch();
	const adminIds = useAppSelector(selectAdminSourceIds);
	const [pendingId, setPendingId] = useState("");
	const pending = useSourceView(pendingId);

	return (
		<IonPage data-product="lnpub">
			<IonContent className="ion-content-no-footer">
				<div className="pub-dash-page">
					<div className="pub-dash-heading">
						<h1>Select source</h1>
					</div>
					<div className="flex w-full sm:w-2/3 flex-col mx-auto justify-center items-stretch gap-4">
						<CustomSelect<string>
							items={adminIds}
							selectedItem={pendingId || undefined}
							onSelect={setPendingId}
							getIndex={(id) => id}
							title="Select Source"
							subTitle="Pick the admin source to use for the dashboard"
							placeholder="Choose your admin source"
							renderItem={(id) => <AdminSourceOption sourceId={id} />}
							renderSelected={(id) => <AdminSourceSelected sourceId={id} />}
						/>

						<IonButton
							expand="block"
							disabled={!pending}
							onClick={() => pending && dispatch(runtimeActions.setSelectedMetricsAdminSourceId({ sourceId: pending.sourceId }))}
						>
							Continue
						</IonButton>

						{pending?.beaconStale === "stale" && (
							<div className="text-sm opacity-70">
								This source is currently unreachable.
							</div>
						)}
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
}
