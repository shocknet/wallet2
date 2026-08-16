import { useMemo } from "react";
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonList,
	IonModal,
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

type ItemDisplayProps = Pick<
	SourceItemViewProps,
	"showFavorite" | "showBalance" | "showBeacon" | "showSourceType"
>;

export type SourceSelectSheetProps = {
	isOpen: boolean;
	onDidDismiss: () => void;
	selectedSourceId?: string | null;
	onSelect: (source: SourceView) => void;
	sources: SourceView[];
	title?: string;
	emptyMessage?: string;
} & ItemDisplayProps;

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

export function SourceSelectSheet({
	isOpen,
	onDidDismiss,
	selectedSourceId = null,
	onSelect,
	sources,
	title = "Select source",
	emptyMessage = "No sources to show.",
	showFavorite,
	showBalance,
	showBeacon,
	showSourceType,
}: SourceSelectSheetProps) {
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);

	const orderedSources = useMemo(
		() => favoriteFirst(sources, favoriteSourceId),
		[sources, favoriteSourceId],
	);

	function handleSelect(source: SourceView) {
		onSelect(source);
		onDidDismiss();
	}

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onDidDismiss}
			initialBreakpoint={0.92}
			breakpoints={[0, 0.92, 1]}
			expandToScroll={false}
			handle
			className="app-sheet-modal"
		>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>{title}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onDidDismiss}>
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
								onClick={() => handleSelect(source)}
								showFavorite={showFavorite}
								showBalance={showBalance}
								showBeacon={showBeacon}
								showSourceType={showSourceType}
							/>
						))}
					</IonList>
				)}
			</IonContent>
		</IonModal>
	);
}
