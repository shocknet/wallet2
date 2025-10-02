import { RelayManager } from "@/Components/RelayManager";
import { LnAddrView, LnurlPayView, NprofileView, SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
import {
	IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
	IonContent, IonList, IonItem, IonLabel, IonInput, IonNote, IonBadge
} from "@ionic/react";
import { closeOutline, trashOutline, addOutline, saveOutline, linkOutline } from "ionicons/icons";
import React from "react";

interface EditSourceModalProps {
	open: boolean;
	source: SourceView | null;
	onClose: () => void;
	onSave: (next: Partial<NprofileView | LnAddrView | LnurlPayView>) => void;
	onDelete: (id: string) => void;
}
export function EditSourceModal({ open, onClose, source, onSave, onDelete }: EditSourceModalProps) {



	return (
		<IonModal isOpen={open} onDidDismiss={onClose}>
			{source ? (
				<Inner source={source} onClose={onClose} onSave={onSave} onDelete={onDelete} />
			) : null}
		</IonModal>
	);
}

const Inner = ({
	source,
	onClose,
	onSave,
	onDelete,
}: {
	source: SourceView;
	onClose: () => void;
	onSave: (next: Partial<NprofileView | LnAddrView | LnurlPayView>) => void;
	onDelete: (id: string) => void;
}) => {

	const [label, setLabel] = React.useState(source.label);
	const [bridgeUrl, setBridgeUrl] = React.useState<string>("");
	const [relays, setRelays] = React.useState<string[]>(
		source.type === SourceType.NPROFILE_SOURCE ? source.relays : []
	);
	const [newRelay, setNewRelay] = React.useState("");

	const save = () => {
		if (source.type === SourceType.NPROFILE_SOURCE) {
			onSave({ label, ...(bridgeUrl ? { bridge_url: bridgeUrl } : {}), relays });
		} else {
			onSave({ label });
		}
		onClose();
	};

	const addRelay = () => {
		const url = newRelay.trim();
		if (!url) return;
		setRelays((r) => [...r, url]);
		setNewRelay("");
	};

	const removeRelay = (url: string) => setRelays((r) => r.filter((x) => x !== url));

	return (
		<>
			<IonHeader>
				<IonToolbar color="secondary">
					<IonTitle>Edit Source</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onClose}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<IonList lines="full">
					<IonItem>
						<IonLabel position="stacked">Label</IonLabel>
						<IonInput value={label} onIonChange={(e) => setLabel(e.detail.value ?? "")} />
					</IonItem>

					{source.type === SourceType.NPROFILE_SOURCE && (
						<>
							<IonItem>
								<IonLabel position="stacked">Bridge URL</IonLabel>
								<IonInput
									inputmode="url"
									placeholder="https://…"
									value={bridgeUrl}
									onIonChange={(e) => setBridgeUrl(e.detail.value ?? "")}
								/>
							</IonItem>
							{/* <RelayManager
								stale={!!source.beaconStale}
								relays={source.relays.map(url => ({ url, present: true }))}
								onRemove={(url) => { }}
								onAdd={(url) => { }}

							/> */}
						</>
					)}

					<IonItem lines="none" className="ion-margin-top">
						<IonButtons slot="start">
							<IonButton color="danger" onClick={() => onDelete(source.sourceId)}>
								<IonIcon slot="start" icon={trashOutline} />
								Delete
							</IonButton>
						</IonButtons>
						<IonButtons slot="end">
							<IonButton color="primary" onClick={save}>
								<IonIcon slot="start" icon={saveOutline} />
								Save
							</IonButton>
						</IonButtons>
					</IonItem>
				</IonList>
			</IonContent>
		</>

	)
}
