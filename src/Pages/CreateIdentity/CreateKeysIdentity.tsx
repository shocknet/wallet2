import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
	IonInput, IonList, IonButton, IonNote, IonTextarea, IonToggle,
	useIonRouter
} from "@ionic/react";
import { useMemo, useState } from "react";
import { getPublicKey, nip19 } from "nostr-tools";
import { generateNewKeyPair } from "@/Api/helpers";
import { hexToBytes } from "@noble/hashes/utils";
import { utils } from "nostr-tools";
import { getLocalKeysIdentityApi } from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { IdentityKeys, IdentityType } from "@/State/identitiesRegistry/types";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { useAppDispatch } from "@/State/store/hooks";
import { useToast } from "@/lib/contexts/useToast";
import { RouteComponentProps } from "react-router";
import { NOSTR_PRIVATE_KEY_STORAGE_KEY } from "@/constants";


const CreateKeysIdentityPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const [label, setLabel] = useState("");
	const [_privkey, setPrivkey] = useState("");
	const [_relays, setRelays] = useState<string>("wss://strfry.shock.network");
	const [isImport, setIsImport] = useState(false);
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const router = useIonRouter();

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

	const onSubmit = async () => {
		if (!parsedPriv || relays.length === 0) return;
		try {
			const pubkey = getPublicKey(hexToBytes(parsedPriv))
			await getLocalKeysIdentityApi({ publicKey: pubkey, privateKey: parsedPriv }, ["wss://strfry.shock.network"]);


			const identity: IdentityKeys = {
				type: IdentityType.LOCAL_KEY,
				privkey: parsedPriv,
				pubkey: pubkey,
				relays,
				label: "New Sanctum Identity",
				createdAt: Date.now()
			}
			await dispatch(createIdentity(identity));
			localStorage.setItem(NOSTR_PRIVATE_KEY_STORAGE_KEY, "true");
		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.messge || "An error occured when creating identity"
			});
			return;
		}

		router.push("/identity/overview", "root", "replace");
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

export default CreateKeysIdentityPage;
