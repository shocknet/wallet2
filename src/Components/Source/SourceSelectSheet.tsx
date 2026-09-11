import { useCallback, useMemo } from "react";
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonList,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import {
	SourceItemView,
	type SourceItemViewProps,
} from "@/Components/Source/SourceItemView";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import { SourceView } from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import {
	usePromiseModal,
	useOverlayCoordinator,
	type Dismiss,
	type OverlayChoice,
	type OverlayOptions,
} from "@/overlay";

type ItemDisplayProps = Pick<
	SourceItemViewProps,
	"showFavorite" | "showBalance" | "showBeacon"
>;

export type SourceSelectOptions = {
	selectedSourceId?: string | null;
	sources: SourceView[];
	title?: string;
	emptyMessage?: string;
} & ItemDisplayProps;

type SourceSelectProps = SourceSelectOptions & {
	dismiss: Dismiss<OverlayChoice<SourceView>>;
};

function favoriteFirst(
	sources: SourceView[],
	favoriteSourceId: string | null | undefined,
): SourceView[] {
	if (favoriteSourceId == null) return sources;
	const i = sources.findIndex((s) => s.sourceId === favoriteSourceId);
	if (i <= 0) return sources;
	const copy = [...sources];
	const [fav] = copy.splice(i, 1);
	copy.unshift(fav);
	return copy;
}

function SourceSelectSheet({
	selectedSourceId = null,
	sources,
	title = "Select source",
	emptyMessage = "No sources to show.",
	showFavorite,
	showBalance,
	showBeacon,
	dismiss,
}: SourceSelectProps) {
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);

	const orderedSources = useMemo(
		() => favoriteFirst(sources, favoriteSourceId),
		[sources, favoriteSourceId],
	);

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>{title}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => dismiss({ role: "cancel" })}>
							<IonIcon icon={closeOutline} slot="icon-only" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				{orderedSources.length === 0 ? (
					<p className="m-0 mt-8 px-4 text-center text-sm leading-6 text-muted">
						{emptyMessage}
					</p>
				) : (
					<IonList lines="full" className="bg-transparent pb-6">
						{orderedSources.map((source) => (
							<SourceItemView
								key={source.sourceId}
								source={source}
								selected={selectedSourceId === source.sourceId}
								onClick={() => dismiss({ role: "confirm", data: source })}
								showFavorite={showFavorite}
								showBalance={showBalance}
								showBeacon={showBeacon}
							/>
						))}
					</IonList>
				)}
			</IonContent>
		</>
	);
}

const sourceSelectOverlay: OverlayOptions = {
	cssClass: "app-sheet-modal",
	initialBreakpoint: 0.92,
	breakpoints: [0, 0.92, 1],
	expandToScroll: false,
	handle: true,
};

export function useSourceSelectModal() {
	const { present } = useOverlayCoordinator();
	return useCallback((options: SourceSelectOptions) => {
		return present<OverlayChoice<SourceView>>(
			(dismiss) => <SourceSelectSheet {...options} dismiss={dismiss} />,
			sourceSelectOverlay,
		);
	}, [present]);
}

export function useNestedSourceSelectModal() {
	return usePromiseModal<SourceSelectOptions, OverlayChoice<SourceView>>(
		SourceSelectSheet,
		sourceSelectOverlay,
	);
}
