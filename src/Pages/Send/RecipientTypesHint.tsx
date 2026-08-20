import {
	IonCard,
	IonCardContent,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonNote,
	IonText,
} from "@ionic/react";
import {
	atCircleOutline,
	flash,
	globeOutline,
} from "ionicons/icons";

const RECIPIENT_TYPES = [
	{
		icon: flash,
		label: "Lightning Invoice",
		example: "lnbc20m1pvjluezpp5qqqsyq…",
	},
	{
		icon: globeOutline,
		label: "LNURL",
		example: "LNURL1dp68gurn8ghj7em9w…",
	},
	{
		icon: atCircleOutline,
		label: "Lightning Address",
		example: "someone@somesite.com",
	},
	{
		icon: "nostr",
		label: "Noffer string",
		example: "noffer1qvqsyqjqvgunwc3j…",
	},
] as const;

export function RecipientTypesHint() {
	return (
		<div className="flex flex-col gap-2">
			<IonText className="px-1 text-sm text-muted">You can send to</IonText>
			<IonCard className="m-0 rounded-lg [--background:var(--app-surface)] [--ion-item-background:var(--app-surface)]">
				<IonCardContent className="ion-no-padding">
					<IonList className="m-0 bg-transparent [--background:transparent]">
						{RECIPIENT_TYPES.map((item, index) => (
							<IonItem
								key={item.label}
								lines={index === RECIPIENT_TYPES.length - 1 ? "none" : undefined}
							>
								<IonIcon
									slot="start"
									icon={item.icon}
									color="warning"
									aria-hidden
								/>
								<IonLabel>
									{item.label}
									<IonNote className="mt-0.5 block truncate font-mono text-muted">
										{item.example}
									</IonNote>
								</IonLabel>
							</IonItem>
						))}
					</IonList>
				</IonCardContent>
			</IonCard>
		</div>
	);
}
