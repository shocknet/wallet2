import { useMemo, useState } from "react";
import { IonButton, IonContent, IonPage } from "@ionic/react";

import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { selectAdminSourceViews, type SourceView } from "@/State/scoped/backups/sources/selectors";
import { runtimeActions } from "@/State/runtime/slice";

import { CustomSelect } from "@/Components/CustomSelect";
import { SelectedSource, SourceSelectOption } from "@/Components/CustomSelect/commonSelects";

export default function MetricsSelectSource() {
	const dispatch = useAppDispatch();
	const admins = useAppSelector(selectAdminSourceViews);
	const [pendingId, setPendingId] = useState("");

	const pending = useMemo(
		() => (pendingId ? admins.find((a) => a.sourceId === pendingId) : undefined),
		[admins, pendingId]
	);

	return (
		<IonPage data-product="lnpub">
			<IonContent className="ion-content-no-footer">
				<div className="pub-dash-page">
					<div className="pub-dash-heading">
						<h1>Select source</h1>
					</div>
					<div className="flex w-full sm:w-2/3 flex-col mx-auto justify-center items-stretch gap-4">
						<CustomSelect<SourceView>
							items={admins}
							selectedItem={pending}
							onSelect={(v) => setPendingId(v.sourceId)}
							getIndex={(s) => s.sourceId}
							title="Select Source"
							subTitle="Pick the admin source to use for the dashboard"
							placeholder="Choose your admin source"
							renderItem={(s) => <SourceSelectOption source={s} />}
							renderSelected={(s) => <SelectedSource source={s} />}
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
