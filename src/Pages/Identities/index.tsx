// Pages/Identities.tsx
import { useState } from "react";
import {
	IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
	IonList, IonItem, IonLabel, IonButton, IonInput
} from "@ionic/react";

import { identitiesSelectors, identitiesRegistryActions, selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
/* import { switchIdentity } from "@/State/identitiesRegistry/switchIdentity"; */
import { RouteComponentProps, useHistory } from "react-router";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { generateNewKeyPair } from "@/Api/helpers";
import { identitySwitchRequested } from "@/State/identitiesRegistry/middleware/actions";

const IdentitiesPage: React.FC<RouteComponentProps> = ({ history }: RouteComponentProps) => {
	const dispatch = useAppDispatch();
	const all = useAppSelector(identitiesSelectors.selectAll);
	const active = useAppSelector(selectActiveIdentityId);

	// demo: add local-keys identity (replace with your UI/flows)
	const [label, setLabel] = useState("");
	const [priv, setPriv] = useState("");
	const [pub, setPub] = useState("");
	const [relays, setRelays] = useState("wss://relay.example");

	const generateKeys = () => {
		const keys = generateNewKeyPair();
		setPub(keys.publicKey)
		setPriv(keys.privateKey);
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Identities</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<IonButton onClick={generateKeys}>here</IonButton>
				<IonButton routerLink="/app/">home</IonButton>
				<IonList>
					{all.map(id => (
						<IonItem key={id.pubkey} button detail={false}>
							<IonLabel>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<div>
										<strong>{id.label}</strong>
										<div style={{ opacity: .7, fontSize: 12 }}>{id.type}</div>
										<div style={{ opacity: .7, fontSize: 12 }}>{id.pubkey.slice(0, 10)}…</div>
									</div>
									<div>
										{active === id.pubkey ? (
											<IonButton disabled color="success">Active</IonButton>
										) : (
											<IonButton
												onClick={() => dispatch(identitySwitchRequested({ pubkey: id.pubkey }))}
											>
												Use
											</IonButton>
										)}
										<IonButton
											color="danger"
											fill="outline"
											onClick={() => dispatch(identitiesRegistryActions.removeIdentity({ pubkey: id.pubkey }))}
											disabled={active === id.pubkey}
										>
											Delete
										</IonButton>
									</div>
								</div>
							</IonLabel>
						</IonItem>
					))}
				</IonList>

				{/* Simple create (local keys) demo */}
				<div style={{ padding: 16 }}>
					<h3>Create Local Keys Identity</h3>
					<IonInput placeholder="Label" value={label} onIonChange={e => setLabel(String(e.detail.value || ""))} />
					<IonInput placeholder="Privkey (hex)" value={priv} onIonChange={e => setPriv(String(e.detail.value || ""))} />
					<IonInput placeholder="Pubkey (hex)" value={pub} onIonChange={e => setPub(String(e.detail.value || ""))} />
					<IonInput placeholder="Relays (comma)" value={relays} onIonChange={e => setRelays(String(e.detail.value || ""))} />
					<IonButton
						expand="block"
						onClick={() => {
							console.log("clicked")
							const relayList = relays.split(",").map(s => s.trim()).filter(Boolean);
							if (!label || !priv || !pub || relayList.length === 0) return;
							console.log("clicked2")
							dispatch(identitiesRegistryActions.createKeysIdentity({
								label, privkey: priv, pubkey: pub, relays: relayList
							}));
							// After creation, thunk switch uses setActiveIdentity, but createKeysIdentity already sets it
							dispatch(identitySwitchRequested({ pubkey: pub }));
						}}
					>
						Create & Use
					</IonButton>
				</div>
			</IonContent>
		</IonPage>
	);
}

export default IdentitiesPage
