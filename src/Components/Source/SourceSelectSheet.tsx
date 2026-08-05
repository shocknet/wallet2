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
import { SourceItemView } from "@/Components/Source/SourceItemView";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import {
	selectNprofileViews,
	type NprofileView,
} from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";

export type SourceSelectSheetProps = {
	isOpen: boolean;
	onDidDismiss: () => void;
	selectedSourceId?: string | null;
	onSelect: (source: NprofileView) => void;
	// Override list; defaults to favorite-first nprofile sources
	sources?: NprofileView[];
	title?: string;
	emptyMessage?: string;
};

function favoriteFirst(
	sources: NprofileView[],
	favoriteSourceId: string | null | undefined,
): NprofileView[] {
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
	sources: sourcesProp,
	title = "Select source",
	emptyMessage = "No Pub sources to show.",
}: SourceSelectSheetProps) {
	const nprofiles = useAppSelector(selectNprofileViews);
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);

	const sources = useMemo(
		() => favoriteFirst(sourcesProp ?? nprofiles, favoriteSourceId),
		[sourcesProp, nprofiles, favoriteSourceId],
	);

	function handleSelect(source: NprofileView) {
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
				{sources.length === 0 ? (
					<p className="m-0 mt-8 px-4 text-center text-sm leading-6 text-muted">
						{emptyMessage}
					</p>
				) : (
					<IonList lines="full" className="bg-transparent pb-6">
						{sources.map((source) => (
							<SourceItemView
								key={source.sourceId}
								source={source}
								selected={selectedSourceId === source.sourceId}
								onClick={() => handleSelect(source)}
							/>
						))}
					</IonList>
				)}
			</IonContent>
		</IonModal>
	);
}
