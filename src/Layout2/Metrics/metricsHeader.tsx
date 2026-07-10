import { IonButtons, IonHeader, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import { LIGHTNING_PUB_MARK_HEIGHT, useLightningPubLogo } from "@/Assets/Images/lightning-pub";

const MetricsHeader = ({ children }: { children?: React.ReactNode }) => {
	const router = useIonRouter();
	const logoSrc = useLightningPubLogo("mark");
	const markHeight = LIGHTNING_PUB_MARK_HEIGHT.nav;

	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>
				<IonButtons slot="start">
					<button
						type="button"
						aria-label="Back to home"
						onClick={() => router.push("/home", "back")}
						style={{
							background: "none",
							border: "none",
							padding: "0 8px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
						}}
					>
						<img
							src={logoSrc}
							alt="Lightning.pub"
							style={{ display: "block", height: markHeight, width: "auto" }}
						/>
					</button>
				</IonButtons>
				<IonTitle className="android-centered-title">Metrics</IonTitle>
			</IonToolbar>
			{children}
		</IonHeader>
	);
};

export default MetricsHeader;
