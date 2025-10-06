import AddSourceNavModal from "@/Components/Modals/Sources/AddSourceModal";
import { EditSourceModal } from "@/Components/Modals/Sources/EditSourceModal";
import SourceCard from "@/Components/SourceCard";
import BackToolbar from "@/Layout2/BackToolbar";
import { selectSourceViews } from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import {
	IonButton,
	IonContent,
	IonHeader,
	IonIcon,
	IonList,
	IonPage,
	IonTitle,
	IonToolbar
} from "@ionic/react";
import { addOutline } from "ionicons/icons";
import { useCallback, useMemo, useState } from "react";
import { RouteComponentProps } from "react-router-dom";

const SourcesPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const sources = useAppSelector(selectSourceViews);

	const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

	const selectedSource = useMemo(() => {
		return sources.find(s => s.sourceId === selectedSourceId) ?? null
	}, [selectedSourceId, sources])


	const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);

	const onAddClose = useCallback(() => {
		setIsAddSourceOpen(false)
	}, []);


	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<BackToolbar title="" />
				{/* <IonToolbar>
						<IonTitle className="android-centered-title">User Profile</IonTitle>
						<IonButtons slot="end">
							<IonBadge color={isDirty ? "warning" : "success"} style={{ marginLeft: 8 }}>
								<IonIcon icon={isDirty ? cloudUploadOutline : checkmarkCircle} className="ion-margin-end" />
								{isDirty ? "pending publish…" : "synced"}
							</IonBadge>
						</IonButtons>
					</IonToolbar> */}
				<IonToolbar className="big-toolbar">
					<IonTitle className="android-centered-title">Attached Nodes</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<EditSourceModal
					source={selectedSource}
					onClose={() => setSelectedSourceId(null)}
					onDelete={() => console.log("delete here")}
					onSave={() => console.log("onSave")}
					open={!!selectedSource}
				/>
				<AddSourceNavModal open={isAddSourceOpen} onClose={onAddClose} />
				<IonList lines="none">
					{
						sources.map(s => <SourceCard key={s.sourceId} source={s} onClick={() => setSelectedSourceId(s.sourceId)} />)
					}
				</IonList>
				<IonButton onClick={() => setIsAddSourceOpen(true)}>
					<IonIcon slot="start" icon={addOutline} />
					Add a new source
				</IonButton>
			</IonContent>
		</IonPage>
	)
}

export default SourcesPage;
