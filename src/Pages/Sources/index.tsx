import { EditSourceModal } from "@/Components/Modals/Sources/EditSourceModal";
import { useAskAddSource } from "@/Pages/Sources/AddSourceModal";
import SourceCard from "@/Components/SourceCard";
import { selectSourceViews } from "@/State/scoped/backups/sources/selectors";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import type { SourcesPageNavState } from "./nav";
import { resolveSourcesInbound } from "./inbound";
import { useToast } from "@/lib/contexts/useToast";
import { removeSource } from "@/State/scoped/backups/sources/thunks";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import RootPageToolbar from "@/Layout2/RootPageToolbar";


const SourcesPage = () => {
	const history = useHistory<SourcesPageNavState>();
	const dispatch = useAppDispatch();
	const sources = useAppSelector(selectSourceViews);
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const { showToast } = useToast();
	const askAddSource = useAskAddSource();

	const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

	const selectedSource = useMemo(() => {
		return sources.find(s => s.sourceId === selectedSourceId) ?? null
	}, [selectedSourceId, sources])



	useEffect(() => {
		if (history.location.pathname !== "/sources") return;
		const search = history.location.search;
		const navState = history.location.state;
		const hasInbound =
			Boolean(search) ||
			Boolean(navState?.parsedNprofile);
		if (!hasInbound) return;

		history.replace(history.location.pathname);

		void resolveSourcesInbound(search, navState).then((inbound) => {
			switch (inbound.type) {
				case "add":
					void askAddSource(
						{
							initialNprofile: inbound.intent.nprofile,
							integrationData: inbound.intent.integrationData,
							invitationToken: inbound.intent.invitationToken,
							fromInviteUrl: inbound.intent.fromInviteUrl,
						},
						{ // When opened from a link, don't allow dismissing the modal.
							backdropDismiss: false,
							keyboardClose: false,
							canDismiss: (_, role) => Promise.resolve(role === "confirm" || role === "cancel"),
						}
					);
					return;
				case "invalid-nprofile":
					showToast({ message: inbound.message, color: "danger" });
					return;
				case "none":
					return;
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [history.location.key]);

	const handleDelete = useCallback((sourceId: string) => {
		dispatch(removeSource(sourceId));
	}, [dispatch])

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
				<EditSourceModal
					source={selectedSource}
					onClose={() => setSelectedSourceId(null)}
					onDelete={handleDelete}
					open={!!selectedSource}
				/>
				<IonList lines="none" className="mt-6">
					{
						favoriteFirstSortedSources.map(s => <SourceCard key={s.sourceId} source={s} onClick={() => setSelectedSourceId(s.sourceId)} />)
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
