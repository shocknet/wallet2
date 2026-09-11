import { useEditSourceModal } from "@/Components/Modals/Sources/EditSourceModal";
import { useAddSourceModal } from "@/Pages/Sources/AddSourceModal";
import SourceCard from "@/Components/SourceCard";
import { selectSourceViews, type SourceView } from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import {
	IonContent,
	IonFab,
	IonFabButton,
	IonHeader,
	IonIcon,
	IonList,
	IonPage,
} from "@ionic/react";
import { add } from "ionicons/icons";
import { useCallback, useMemo } from "react";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import RootPageToolbar from "@/Layout2/RootPageToolbar";
import { useToast } from "@/lib/contexts/useToast";


const SourcesPage = () => {
	const sources = useAppSelector(selectSourceViews);
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const askAddSource = useAddSourceModal();
	const editSource = useEditSourceModal();
	const { showToast } = useToast();

	const handleEditSource = useCallback(async (s: SourceView) => {
		const result = await editSource(s);
		if (result.role === "change") {
			showToast({ color: "success", message: "Changes saved" });
		} else if (result.role === "delete") {
			showToast({ color: "success", message: "Source deleted successfully" });
		}
	}, [editSource, showToast]);

	const favoriteFirstSortedSources = useMemo(() => {
		if (favoriteSourceId == null) return sources;

		const i = sources.findIndex(s => s.sourceId === favoriteSourceId);
		if (i <= 0) return sources;

		const copy = [...sources];
		const [fav] = copy.splice(i, 1);
		copy.unshift(fav);
		return copy;
	}, [sources, favoriteSourceId])

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<RootPageToolbar title="Node Connections" />
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList lines="none" className="mt-6">
					{
						favoriteFirstSortedSources.map(s => (
							<SourceCard key={s.sourceId} source={s} onClick={() => void handleEditSource(s)} />
						))
					}
				</IonList>
				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton color="primary" onClick={() => void askAddSource({})}>
						<IonIcon icon={add}></IonIcon>
					</IonFabButton>
				</IonFab>
			</IonContent>
		</IonPage>
	)
}

export default SourcesPage;
export { navToSources } from "./nav";
export type { SourcesPageNavState } from "./nav";
