import { useCallback, useEffect, useMemo, useState } from "react";
import {
	IonContent,
	IonHeader,
	IonIcon,
	IonLabel,
	IonPage,
	IonPopover,
	IonRefresher,
	IonRefresherContent,
	IonSegment,
	IonSegmentButton,
	IonSpinner,
	IonToggle,
	type RefresherEventDetail,
} from "@ionic/react";
import { informationCircleOutline } from "ionicons/icons";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { DebitAuthItem } from "@/Components/Debit/DebitAuthItem";
import { useEditDebitModal } from "@/Components/Modals/EditDebitModal";
import { SourceSelectionView } from "@/Components/Source/SourceSelectionView";
import { SourceReachabilityHint } from "@/Components/Source/SourceReachabilityHint";
import { useSourceSelectModal } from "@/Components/Source/SourceSelectSheet";
import EmptyState from "@/Components/common/ui/EmptyState";
import RootPageToolbar from "@/Layout2/RootPageToolbar";
import { getDeviceId } from "@/constants";
import { truncateTextMiddle } from "@/lib/format";
import { useGetDebitAuthorizationsQuery } from "@/State/api/api";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import {
	type SourceView,
	selectSourceViews,
} from "@/State/scoped/backups/sources/selectors";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";

type LinkedAppsTab = "approved" | "banned";

function pickDefaultLinkedAppsSource(
	sources: SourceView[],
	favoriteSourceId: string | null,
): SourceView {
	const favorite = sources.find((s) => s.sourceId === favoriteSourceId);
	if (favorite) return favorite;
	return sources[0];
}

export default function LinkedApps() {
	const sources = useAppSelector(selectSourceViews);
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const [selectedSourceId, setSelectedSourceId] = useState(
		() => pickDefaultLinkedAppsSource(sources, favoriteSourceId).sourceId,
	);
	const sourceSelect = useSourceSelectModal();

	useEffect(() => {
		if (!sources.some((s) => s.sourceId === selectedSourceId)) {
			setSelectedSourceId(
				pickDefaultLinkedAppsSource(sources, favoriteSourceId).sourceId,
			);
		}
	}, [sources, selectedSourceId, favoriteSourceId]);

	const selectedSource = useMemo(() => {
		return sources.find((s) => s.sourceId === selectedSourceId) ??
			pickDefaultLinkedAppsSource(sources, favoriteSourceId);
	}, [sources, selectedSourceId, favoriteSourceId]);

	const { refetch } = useGetDebitAuthorizationsQuery({
		sourceId: selectedSource.sourceId,
	});

	const handleRefresh = useCallback(
		async (event: CustomEvent<RefresherEventDetail>) => {
			try {
				await refetch();
			} finally {
				event.detail.complete();
			}
		},
		[refetch],
	);

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<RootPageToolbar title="Linked Apps" />
			</IonHeader>
			<IonContent className="ion-padding">
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent />
				</IonRefresher>

				<div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 pb-8 pt-2">
					<SourceSelectionView
						source={selectedSource}
						onClick={() => {
							sourceSelect({
								sources,
								selectedSourceId,
								title: "Select source",
								showBalance: false,
							}).then((result) => {
								if (result.role === "confirm") setSelectedSourceId(result.data.sourceId);
							});
						}}
						showBalance={false}
					/>
					<SourceReachabilityHint source={selectedSource} />
					<NdebitShare source={selectedSource} />
					<section className="flex min-h-[40%] flex-1 flex-col">
						<p className="m-0 mb-3 text-xs font-medium uppercase tracking-wide text-muted">
							Linked apps
						</p>
						<LinkedAppsList source={selectedSource} />
					</section>
				</div>
			</IonContent>
		</IonPage>
	);
}

function NdebitShare({ source }: { source: SourceView }) {
	const dispatch = useAppDispatch();
	const ndebit = source.ndebit?.trim() || "";
	const vanityName = source.vanityName?.trim() || "";
	const discoverInfoId = `ndebit-discover-${source.sourceId}`;

	function setDiscoverable(checked: boolean) {
		dispatch(
			sourcesActions.updateisNDebitDiscoverable({
				sourceId: source.sourceId,
				isNdebitDiscoverable: checked,
				by: getDeviceId(),
			}),
		);
	}

	return (
		<section
			className="
				flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl
				bg-[var(--app-surface)] px-3 py-2 wallet-box-shadow
			"
		>
			<div className="flex min-w-0 flex-1 items-center gap-1">
				{ndebit ? (
					<>
						<span className="min-w-0 flex-1 truncate font-mono text-sm text-primary">
							{truncateTextMiddle(ndebit, 18, 14, "…")}
						</span>
						<CopyMorphButton
							value={ndebit}
							fill="clear"
							size="small"
							shape="round"
							className="m-0 shrink-0"
							aria-label="Copy debit string"
						/>
					</>
				) : (
					<span className="truncate text-sm text-muted">
						Debit string unavailable
					</span>
				)}
			</div>

			{vanityName ? (
				<div className="ml-auto flex shrink-0 items-center gap-1.5">
					<IonToggle
						checked={source.isNDebitDiscoverable}
						onIonChange={(e) => setDiscoverable(e.detail.checked)}
						className="m-0 min-h-0"
						aria-label="Publicly discoverable"
					>
						<span className="whitespace-nowrap text-sm font-medium text-primary">
							Discoverable
						</span>
					</IonToggle>
					<button
						type="button"
						id={discoverInfoId}
						aria-label="About public discoverability"
						className="inline-flex shrink-0 appearance-none border-0 bg-transparent p-0 text-muted"
					>
						<IonIcon
							icon={informationCircleOutline}
							className="text-lg"
							aria-hidden
						/>
					</button>
					<IonPopover
						trigger={discoverInfoId}
						triggerAction="click"
						side="bottom"
						alignment="end"
					>
						<IonContent className="ion-padding">
							<p className="m-0  text-sm leading-snug text-primary">
								When on, apps can find this debit via your Lightning address.
							</p>
							<p className="m-0 text-wrap max-w-[16rem] text-xs leading-snug text-muted">
								{vanityName}
							</p>
						</IonContent>
					</IonPopover>
				</div>
			) : null}
		</section>
	);
}

function LinkedAppsList({ source }: { source: SourceView }) {
	const [tab, setTab] = useState<LinkedAppsTab>("approved");
	const editDebit = useEditDebitModal();
	const {
		data: authorizations = [],
		isLoading,
		isFetching,
		isError,
		error,
	} = useGetDebitAuthorizationsQuery({ sourceId: source.sourceId });

	useEffect(() => {
		setTab("approved");
	}, [source.sourceId]);

	const { approved, banned } = useMemo(() => {
		const next = {
			approved: [] as typeof authorizations,
			banned: [] as typeof authorizations,
		};
		for (const auth of authorizations) {
			if (auth.authorized) next.approved.push(auth);
			else next.banned.push(auth);
		}
		return next;
	}, [authorizations]);

	const showing = tab === "approved" ? approved : banned;

	if (isLoading || (isFetching && authorizations.length === 0)) {
		return (
			<div className="flex flex-1 items-center justify-center py-10">
				<IonSpinner name="crescent" />
			</div>
		);
	}

	if (isError) {
		return (
			<EmptyState
				variant="section"
				title="Couldn't load linked apps"
				description={error?.message ?? "Could not load linked apps"}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<IonSegment
				value={tab}
				onIonChange={(e) => {
					const value = e.detail.value;
					if (value === "approved" || value === "banned") setTab(value);
				}}
				className="
					wallet-box-shadow
					p-1 [--background:var(--app-surface)]
				"
			>
				<IonSegmentButton value="approved">
					<IonLabel>Approved ({approved.length})</IonLabel>
				</IonSegmentButton>
				<IonSegmentButton value="banned">
					<IonLabel>Banned ({banned.length})</IonLabel>
				</IonSegmentButton>
			</IonSegment>

			{showing.length === 0 ? (
				<EmptyState
					variant="section"
					title={
						tab === "approved" ? "No linked apps yet" : "No banned apps"
					}
					description={
						tab === "approved"
							? "Share the debit string above so an app can request spend access."
							: "Apps you ban from debit access will show up here."
					}
				/>
			) : (
				<div className="flex flex-col gap-3">
					{showing.map((auth) => (
						<DebitAuthItem
							key={auth.debit_id}
							authorization={auth}
							relays={source.relays}
							onClick={() => editDebit({ authorization: auth, source })}
						/>
					))}
				</div>
			)}
		</div>
	);
}
