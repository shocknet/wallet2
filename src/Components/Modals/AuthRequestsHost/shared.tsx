import {
	IonButton,
	IonContent,
	IonFooter,
	IonIcon,
	IonToolbar,
} from "@ionic/react";
import { arrowBackOutline, banOutline } from "ionicons/icons";


export function BanPrompt({
	busy,
	onBan,
	onDenyOnly,
	onBack,
}: {
	busy: boolean;
	onBan: () => void;
	onDenyOnly: () => void;
	onBack: () => void;
}) {

	return (
		<>
			<IonContent>
				<div className="flex min-h-full flex-col">
					<div className="shrink-0 self-start">
						<IonButton className="text-secondary" fill="clear" shape="round" onClick={onBack}>
							<IonIcon icon={arrowBackOutline} slot="icon-only" />
						</IonButton>
					</div>
					<div className="flex flex-1 flex-col items-center justify-center ion-padding">
						<p className="text-center text-base leading-relaxed text-secondary">
							Deny this request and ban this key from issuing future requests?
						</p>
					</div>
				</div>
			</IonContent>
			<IonFooter>
				<IonToolbar>
					<div className="grid grid-cols-2 gap-3 px-3 pb-3 pt-2">
						<IonButton
							expand="block"
							color="danger"
							disabled={busy}
							onClick={onBan}
						>
							<IonIcon icon={banOutline} slot="start" />
							Ban
						</IonButton>
						<IonButton
							expand="block"
							fill="outline"
							disabled={busy}
							onClick={onDenyOnly}
						>
							Just deny
						</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>
		</>
	)

}
