import {
	IonButton,
	IonContent,
	IonFooter,
	IonList,
	IonNavLink,
	IonToolbar,
} from "@ionic/react";
import { peopleOutline } from "ionicons/icons";
import { useAppSelector } from "@/State/store/hooks";
import { identitiesSelectors } from "@/State/identitiesRegistry/slice";
import { useInactiveProfileModal } from "@/Components/User/InactiveProfileSheet";
import { InactiveProfileCard } from "@/Components/User/InactiveProfileCard";
import { ScreenIntro } from "@/Components/common/ui/ScreenIntro";
import { CreateMethodPage } from "./create/CreateMethodPage";

export function IdentitiesListPage() {
	const identities = useAppSelector(identitiesSelectors.selectAll);
	const askInactiveProfile = useInactiveProfileModal();

	return (
		<>
			<IonContent className="ion-padding ion-content-no-header">
				<div className="min-h-full flex flex-col justify-center items-center">
					<div className="w-full max-w-md mx-auto">
						<ScreenIntro
							icon={peopleOutline}
							title="Choose a profile"
							description="Select a profile on this device to continue."
						/>

						<IonList lines="none" className="bg-transparent">
							{identities.map((identity) => (
								<InactiveProfileCard
									key={identity.pubkey}
									identity={identity}
									onClick={() => askInactiveProfile({ identity })}
								/>
							))}
						</IonList>
					</div>
				</div>
			</IonContent>

			<IonFooter className="ion-no-border">
				<IonToolbar>
					<div className="w-full max-w-xl mx-auto px-6">
						<IonNavLink
							routerDirection="root"
							component={() => <CreateMethodPage />}
						>
							<IonButton
								expand="block"
								size="large"
								color="secondary"
								className="[--border-radius:12px]"
							>
								Add New Profile
							</IonButton>
						</IonNavLink>
					</div>
				</IonToolbar>
			</IonFooter>
		</>
	);
}
