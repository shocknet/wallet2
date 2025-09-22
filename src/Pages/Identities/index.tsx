import {
	IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
	IonList, IonItem, IonLabel, IonButton,
	IonFab,
	IonFabButton,
	IonIcon
} from "@ionic/react";

import { identitiesSelectors, identitiesRegistryActions, selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
/* import { switchIdentity } from "@/State/identitiesRegistry/switchIdentity"; */
import { RouteComponentProps } from "react-router";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";

import { switchIdentity } from "@/State/identitiesRegistry/thunks";
import { toast } from "react-toastify";
import { add } from "ionicons/icons";


const IdentitiesPage: React.FC<RouteComponentProps> = ({ history }: RouteComponentProps) => {
	const dispatch = useAppDispatch();
	const all = useAppSelector(identitiesSelectors.selectAll);
	const active = useAppSelector(selectActiveIdentityId);

	const switchToIdentity = async (pubkey: string) => {
		try {
			await dispatch(switchIdentity(pubkey));
		} catch (err: any) {
			toast.error(err?.message || "Error switching to identity")
		}

		history.push("/identity/overview", { routerDirection: "root" });

	}


	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Identities</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent>
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
												onClick={() => switchToIdentity(id.pubkey)}
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

				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton routerLink="/createidentity">
						<IonIcon icon={add}></IonIcon>
					</IonFabButton>
				</IonFab>

			</IonContent>
		</IonPage>
	);
}

export default IdentitiesPage
