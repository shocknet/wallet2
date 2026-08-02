import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonNavLink,
	IonToolbar,
} from "@ionic/react";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import { ChooseMethod } from "@/Components/common/identityCreate/ChooseMethod";
import { useAppSelector } from "@/State/store/hooks";
import { identitiesSelectors } from "@/State/identitiesRegistry/slice";
import { IdentitiesListPage } from "../IdentitiesListPage";


export function CreateMethodPage() {
	const identitiesCount = useAppSelector(identitiesSelectors.selectTotal);
	const canGoToIdentities = identitiesCount > 0;

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					{canGoToIdentities ? (
						<IonButtons slot="end">
							<IonNavLink
								routerDirection="root"
								component={() => <IdentitiesListPage />}
							>
								<IonButton fill="clear" color="light">
									My profiles
								</IonButton>
							</IonNavLink>
						</IonButtons>
					) : null}
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<ChooseMethod />
			</IonContent>
			<IonFooter className="ion-no-border">
				<DisclaimerFooter />
			</IonFooter>
		</>
	);
}
