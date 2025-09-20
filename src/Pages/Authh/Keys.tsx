import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
	IonInput, IonList, IonButton, IonNote, IonTextarea, IonToggle
} from "@ionic/react";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { getPublicKey, nip19 } from "nostr-tools";


import { generateNewKeyPair } from "@/Api/helpers";
import { hexToBytes } from "@noble/hashes/utils";

import { identitySwitchRequested } from "@/State/identitiesRegistry/middleware/actions";
import { utils } from "nostr-tools";


export default function KeysIdentity() {
	const [label, setLabel] = useState("");
	const [_privkey, setPrivkey] = useState("");
	const [_relays, setRelays] = useState<string>("wss://strfry.shock.network");
	const [isImport, setIsImport] = useState(false);
	const dispatch = useDispatch();

	const parsedPriv = useMemo(() => {
		try {
			if (!_privkey) return null;
			if (_privkey.startsWith("nsec")) {
				const result = nip19.decode(_privkey);
				return result.type === "nsec" ? getPublicKey(result.data) : null;
			}
			return _privkey.match(/^[0-9a-f]{64}$/i) ? _privkey : null;
		} catch { return null; }
	}, [_privkey]);



	const relays = useMemo(() => {
		try {
			return _relays.split(" ").map(utils.normalizeURL)
		} catch {
			return []
		}
	}, [_relays])

	const canCreate = !!label && (!!parsedPriv || !isImport);

	const handleGenerate = async () => {
		// stub: generate hex privkey
		const { privateKey } = generateNewKeyPair();
		setPrivkey(privateKey);

		if (!label) setLabel("My identity");
	}



	function onSubmit() {
		if (!parsedPriv || relays.length === 0) return;
		const pubkey = getPublicKey(hexToBytes(parsedPriv))

		//dispatch(identitiesRegistryActions.createKeysIdentity({ label: label.trim(), privkey: parsedPriv, pubkey, relays }));
		dispatch(identitySwitchRequested({ pubkey: pubkey }));
	}

	return (
		<IonPage className="ion-page-width">
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
							<IonInput value={_privkey} onIonChange={e => setPrivkey(e.detail.value ?? "")} />
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
						<IonLabel position="stacked">Relays (space separated)</IonLabel>
						<IonTextarea value={_relays} onIonChange={e => setRelays(e.detail.value?.trim() ?? "")} autoGrow />
					</IonItem>


				</IonList>

				<IonButton expand="block" disabled={!canCreate} onClick={onSubmit}>
					Create Identity
				</IonButton>

			</IonContent>
		</IonPage>
	);
}
