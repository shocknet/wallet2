import {
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonNavLink,
	IonText,
} from "@ionic/react";
import { cloudOutline, keyOutline } from "ionicons/icons";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { CreateKeysPage } from "@/shell/screens/identityGate/create/CreateKeysPage";
import { CreateSanctumPage } from "@/shell/screens/identityGate/create/CreateSanctumPage";

export function ChooseMethod({
	tagline = "Set up your profile",
}: {
	tagline?: string;
}) {
	return (
		<div className="min-h-full flex flex-col justify-center items-center">
			<ShockwalletHero size="lg" tagline={tagline} />
			<IonCard className="w-full max-w-md rounded-xl mt-7">
				<IonCardHeader>
					<IonCardTitle>
						<div className="text-lg font-medium leading-snug tracking-wide text-primary">
							Select a method for device sync, backups and user settings
						</div>
					</IonCardTitle>
				</IonCardHeader>

				<IonCardContent>
					<IonList className="round" lines="none">
						<IonNavLink
							routerDirection="forward"
							component={() => <CreateSanctumPage />}
						>
							<IonItem detail button>
								<IonIcon
									slot="start"
									icon={cloudOutline}
									size="large"
									className="text-secondary"
								/>
								<IonLabel>
									<h2 className="text-base font-medium leading-snug text-primary">
										Log-In or Sign-Up with Email
									</h2>
									<IonText className="block text-sm leading-snug text-muted">
										Use the Nostr network via a cloud based policy engine.
									</IonText>
								</IonLabel>
							</IonItem>
						</IonNavLink>

						<IonNavLink
							routerDirection="forward"
							component={() => <CreateKeysPage />}
						>
							<IonItem detail button>
								<IonIcon
									slot="start"
									icon={keyOutline}
									size="large"
									className="text-secondary"
								/>
								<IonLabel>
									<h2 className="text-base font-medium leading-snug text-primary">
										Nostr Keys
									</h2>
									<IonText className="block text-sm leading-snug text-muted">
										Use your existing Nostr key or generate a new one.
									</IonText>
									<IonText className="block text-sm leading-snug text-muted mt-2">
										Includes a file based backup and NIP-07 extensions.
									</IonText>
								</IonLabel>
							</IonItem>
						</IonNavLink>
					</IonList>
				</IonCardContent>
			</IonCard>
		</div>
	);
}
