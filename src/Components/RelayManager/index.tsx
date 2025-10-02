import React from "react";
import {
	IonItem, IonLabel, IonButton, IonIcon, IonInput, IonText, IonNote,
} from "@ionic/react";
import { trashOutline, addOutline, closeOutline } from "ionicons/icons";
import CardishList from "../CardishList";
import { z } from "zod";
import { utils } from "nostr-tools";




type RelayManagerProps = {
	relays: string[];
	setRelays: React.Dispatch<React.SetStateAction<string[]>>;
};


const RelayUrlSchema = z.url({ protocol: /^wss?$/ });


export const RelayManager: React.FC<RelayManagerProps> = ({ relays, setRelays }) => {
	const [adding, setAdding] = React.useState(false);
	const [newRelay, setNewRelay] = React.useState("");
	const [err, setErr] = React.useState<string | null>(null);

	const urlSet = React.useMemo(() => new Set(relays), [relays]);

	const onAdd = async (raw: string) => {
		let normalized = "";
		try {
			RelayUrlSchema.parse(raw);
			normalized = utils.normalizeURL(raw)
		} catch {
			console.log("come here maybe?")
			setErr("Invalid relay URL");
			return;
		}

		if (urlSet.has(normalized)) {
			setErr("Relay already exists");
			return;
		}


		setRelays(prev => [...prev, normalized])
		setErr(null);
	};

	const onRemove = (url: string) => {
		setRelays(prev => prev.filter(r => r !== url));
	};

	const submitAdd = () => {
		onAdd(newRelay);
		if (!err) {
			setNewRelay("");
			setAdding(false);
		}
	};

	const cancelAdd = () => {
		setErr(null);
		setNewRelay("");
		setAdding(false);
	};

	return (
		<CardishList listHeader="Relays">
			{!adding ? (
				<IonItem detail={false}>
					<IonLabel>
						<IonButton
							fill="clear"
							onClick={() => setAdding(true)}
							aria-label="Add relay"
						>
							<IonIcon slot="start" icon={addOutline} />
							<IonText
								className="text-medium text-md"
								style={{ textDecoration: "underline", color: "var(--ion-color-primary)" }}
							>
								Add relay
							</IonText>
						</IonButton>
					</IonLabel>
				</IonItem>
			) : (
				<IonItem>
					<IonInput
						placeholder="wss://relay.example.com"
						fill="outline"
						inputmode="url"
						value={newRelay}
						onIonChange={(e) => setNewRelay(e.detail.value ?? "")}
						onKeyDown={(e) => { if ((e as any).key === "Enter") submitAdd(); }}
					/>
					<IonButton slot="end" size="small" onClick={submitAdd} aria-label="Add">
						<IonIcon icon={addOutline} />
					</IonButton>
					<IonButton slot="end" size="small" fill="clear" onClick={cancelAdd} aria-label="Cancel">
						<IonIcon icon={closeOutline} />
					</IonButton>
				</IonItem>
			)}

			{(adding && err) && (
				<IonItem lines="none">
					<IonNote color="danger">{err}</IonNote>
				</IonItem>
			)}

			{/* Existing relays */}
			{relays.length === 0 && !adding && (
				<IonItem>
					<IonText className="text-medium text-low">No relays yet</IonText>
				</IonItem>
			)}

			{relays.map(url => (
				<IonItem key={url}>
					<IonLabel>
						<IonText
							className="text-medium code-string"
							style={{ textDecoration: "underline", color: "var(--ion-color-primary)" }}
							title={url}
						>
							{url}
						</IonText>
					</IonLabel>
					<div slot="end" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
						<IonButton
							fill="clear"
							color="light"
							onClick={() => onRemove(url)}
							aria-label={`Remove ${url}`}
						>
							<IonIcon icon={trashOutline} />
						</IonButton>
					</div>
				</IonItem>
			))}
		</CardishList>
	);
};
