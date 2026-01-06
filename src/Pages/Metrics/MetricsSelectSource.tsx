import { useEffect, useMemo, useRef, useState } from "react";
import {
	IonButton,
	IonContent,
	IonHeader,
	IonPage,
	useIonAlert,
	useIonLoading,
	useIonViewWillEnter,
} from "@ionic/react";
import { RouteComponentProps } from "react-router-dom";

import BackToolbar from "@/Layout2/BackToolbar";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { selectAdminNprofileViews, type NprofileView } from "@/State/scoped/backups/sources/selectors";
import { runtimeActions, selectSelectedMetricsAdminSourceId } from "@/State/runtime/slice";

import { CustomSelect } from "@/Components/CustomSelect";
import { SelectedSource, SourceSelectOption } from "@/Components/CustomSelect/commonSelects";
import { useEventCallback } from "@/lib/hooks/useEventCallbck/useEventCallback";



export default function MetricsSelectSource({ history, location }: RouteComponentProps) {
	const dispatch = useAppDispatch();
	const admins = useAppSelector(selectAdminNprofileViews);
	const selectedId = useAppSelector(selectSelectedMetricsAdminSourceId);

	const [pendingId, setPendingId] = useState<string>("");
	const [committing, setCommitting] = useState(false);

	const [presentLoading, dismissLoading] = useIonLoading();
	const [presentAlert] = useIonAlert();



	const pending = useMemo(
		() => (pendingId ? admins.find((a) => a.sourceId === pendingId) : undefined),
		[admins, pendingId]
	);


	const from = (location.state as any)?.from;
	const returnTo =
		from?.pathname || "/metrics";




	useIonViewWillEnter(() => {
		// If we already have a selection, show it in the select UI
		if (selectedId) {
			const sel = admins.find((a) => a.sourceId === selectedId);
			if (!sel) {
				dispatch(runtimeActions.clearSelectedMetricsAdminSourceId());

				setCommitting(false);
				return;
			}

			setPendingId(sel.sourceId);

			if (sel.beaconStale === "stale") {

				dispatch(runtimeActions.clearSelectedMetricsAdminSourceId());
				setCommitting(false);
				return;
			}

			// fresh or warmingUp => let commit effect handle redirect/wait
			setCommitting(true);
			return;
		}

		// No selectedId: auto-pick if exactly one admin source
		if (admins.length === 1) {
			const only = admins[0];
			setPendingId(only.sourceId);

			// auto-continue if not stale (fresh or warmingUp)
			if (only.beaconStale !== "stale") setCommitting(true);
		}
	});




	const canContinue = !!pending && !committing && pending.beaconStale !== "stale";

	const onContinue = () => {
		if (!pending) return;
		if (pending.beaconStale === "stale") return;
		setCommitting(true);
	};

	const loadingShownRef = useRef(false);

	const checkReady = useEventCallback(async (alive: boolean) => {
		if (!committing) return;
		if (!pending) return;


		if (pending.beaconStale === "warmingUp") {
			if (!loadingShownRef.current) {
				loadingShownRef.current = true;
				await presentLoading({ message: "Reconnecting…", backdropDismiss: false });
			}
			return; // wait for beaconStale to change -> effect reruns
		}


		if (loadingShownRef.current) {
			await dismissLoading();
			loadingShownRef.current = false;
		}

		if (!alive) return;


		if (pending.beaconStale === "stale") {
			setCommitting(false);

			if (selectedId === pending.sourceId) {
				dispatch(runtimeActions.clearSelectedMetricsAdminSourceId());
			}

			await presentAlert({
				header: "Source unreachable",
				message: "That admin source looks down right now. Pick a different one.",
				buttons: ["OK"],
			});
			return;
		}


		dispatch(runtimeActions.setSelectedMetricsAdminSourceId({ sourceId: pending.sourceId }));
		setCommitting(false);
		history.replace(returnTo);
	});


	useEffect(() => {
		console.log("something triggered me", committing, pending?.beaconStale)
		let alive = true;

		checkReady(alive);

		return () => {
			alive = false;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [committing, pending?.beaconStale]);

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<BackToolbar title="Select Admin Source" />
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="flex w-full sm:w-2/3 flex-col mx-auto justify-center items-stretch gap-4">
					<CustomSelect<NprofileView>
						items={admins}
						selectedItem={pending}
						onSelect={(v) => {
							setPendingId(v.sourceId);
							setCommitting(false);
							void dismissLoading();
						}}
						getIndex={(s) => s.sourceId}
						title="Select Source"
						subTitle="Pick the admin source to use for metrics"
						placeholder="Choose your admin source"
						renderItem={(s) => <SourceSelectOption source={s} />}
						renderSelected={(s) => <SelectedSource source={s} />}
					/>

					<IonButton expand="block" disabled={!canContinue} onClick={onContinue}>
						Continue
					</IonButton>


					{pending?.beaconStale === "stale" && (
						<div className="text-sm opacity-70">
							This source is currently unreachable.
						</div>
					)}
				</div>
			</IonContent>
		</IonPage>
	);
}
