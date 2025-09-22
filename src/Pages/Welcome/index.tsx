import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
	IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonIcon, IonButton,
	IonGrid,
	IonRow,
	IonCol,
	IonImg
} from "@ionic/react";
import { keyOutline, extensionPuzzleOutline, cloudOutline } from "ionicons/icons";
import { isPlatform } from "@ionic/react";
import { useHistory } from "react-router";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";


export default function Welcome() {
	const history = useHistory();
	const hasNip07 = typeof (window as any).nostr !== "undefined";
	const isNative = isPlatform("ios") || isPlatform("android");

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Set up your identity</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">

				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Choose how to sign</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonList lines="full">
							<IonItem button detail onClick={() => history.push("/welcome/keys")}>
								<IonIcon slot="start" icon={keyOutline} />
								<IonLabel>
									<h2>Local Keys (recommended)</h2>
									<p>Keys stored locally, best portability. (Back up required)</p>
								</IonLabel>
							</IonItem>

							{/* Hide NIP-07 on native if you want */}
							{(!isNative && hasNip07) && (
								<IonItem button detail onClick={() => history.push("/welcome/nip07")}>
									<IonIcon slot="start" icon={extensionPuzzleOutline} />
									<IonLabel>
										<h2>NIP-07 Extension</h2>
										<p>Use an installed browser extension to sign</p>
									</IonLabel>
								</IonItem>
							)}

							<IonItem button detail onClick={() => history.push("/welcome/sanctum")}>
								<IonIcon slot="start" icon={cloudOutline} />
								<IonLabel>
									<h2>Sanctum (remote signer)</h2>
									<p>Sign via a remote service using a token</p>
								</IonLabel>
							</IonItem>
						</IonList>
						{!hasNip07 && !isNative && (
							<div className="ion-padding-top">
								<small>NIP-07 not detected. Install a Nostr extension to enable that option.</small>
							</div>
						)}
					</IonCardContent>
				</IonCard>
			</IonContent>
		</IonPage>
	);
}
