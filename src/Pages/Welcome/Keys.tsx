import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
	IonInput, IonList, IonButton, IonNote, IonTextarea, IonToggle
} from "@ionic/react";
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { getPublicKey, nip19 } from "nostr-tools"; // optional if you want to show npub
import { generateNewKeyPair } from "@/Api/helpers";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";


export default function KeysIdentity() {
	const [label, setLabel] = useState("");
	const [privkey, setPrivkey] = useState("");   // hex or nsec
	const [relays, setRelays] = useState<string>("wss://relay.damus.io\nwss://relay.snort.social");
	const [isImport, setIsImport] = useState(false);
	const dispatch = useDispatch();
	const history = useHistory();

	const parsedPriv = useMemo(() => {
		try {
			if (!privkey) return null;
			if (privkey.startsWith("nsec")) {
				const { data } = nip19.decode(privkey);
				return typeof data === "string" ? data : null;
			}
			return privkey.match(/^[0-9a-f]{64}$/i) ? privkey : null;
		} catch { return null; }
	}, [privkey]);

	const pubkey = useMemo(() => parsedPriv ? /* getPublicKey(parsedPriv) */ null : null, [parsedPriv]);
	const npub = useMemo(() => pubkey ? nip19.npubEncode(pubkey) : null, [pubkey]);

	const canCreate = !!label && (!!pubkey || !isImport);

	const handleGenerate = async () => {
		// stub: generate hex privkey
		const { privateKey: privateKeyHex, publicKey: publicKeyHex } = generateNewKeyPair();
		setPrivkey(privateKeyHex);
		// Optionally auto-fill label if empty
		if (!label) setLabel("My Keys");
	}

	function normalizeRelayList(s: string) {
		return s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
	}

	function onSubmit() {
		let _priv = parsedPriv;
		if (!_priv) {
			// must generate first if import is off
			return;
		}
		const _pub = pubkey!;
		const _relays = normalizeRelayList(relays);
		dispatch(identitiesRegistryActions.createKeysIdentity({ label: label.trim(), privkey: _priv, pubkey: _pub, relays: _relays }));
		// attach scoped reducers + go home
		/*     attachScopedReducers(_pub, dispatch); */
		history.replace("/home");
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Local Keys</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList lines="full">
					<IonItem>
						<IonLabel position="stacked">Label</IonLabel>
						<IonInput value={label} onIonChange={e => setLabel(e.detail.value ?? "")} />
					</IonItem>

					<IonItem>
						<IonLabel>Import existing</IonLabel>
						<IonToggle checked={isImport} onIonChange={(e) => setIsImport(e.detail.checked)} />
					</IonItem>

					{isImport ? (
						<IonItem>
							<IonLabel position="stacked">Private Key (hex or nsec)</IonLabel>
							<IonInput value={privkey} onIonChange={e => setPrivkey(e.detail.value ?? "")} />
						</IonItem>
					) : (
						<>
							<IonButton expand="block" onClick={handleGenerate}>Generate Keypair</IonButton>
							<IonNote className="ion-padding-start" color="medium">
								We’ll create a new private key on this device. Back it up!
							</IonNote>
						</>
					)}

					<IonItem>
						<IonLabel position="stacked">Relays (one per line)</IonLabel>
						<IonTextarea value={relays} onIonChange={e => setRelays(e.detail.value ?? "")} autoGrow />
					</IonItem>

					{pubkey && (
						<IonItem>
							<IonLabel>
								<div><strong>npub:</strong> {npub}</div>
							</IonLabel>
						</IonItem>
					)}
				</IonList>

				<IonButton expand="block" disabled={!canCreate} onClick={onSubmit}>
					Create Identity
				</IonButton>

				<IonNote className="ion-padding-top" color="warning">
					Keep your private key secret. We store it locally. Consider enabling OS secure storage later.
				</IonNote>
			</IonContent>
		</IonPage>
	);
}
