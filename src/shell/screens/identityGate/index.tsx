import {
	IonNav,
	IonPage,
} from "@ionic/react";
import { CreateMethodPage } from "./create/CreateMethodPage";
import { IdentitiesListPage } from "./IdentitiesListPage";

export function IdentityGate({
	initialView,
}: {
	initialView: "create" | "select";
}) {
	return (
		<IonPage className="ion-page-width">
			<IonNav
				root={
					initialView === "create"
						? () => <CreateMethodPage />
						: () => <IdentitiesListPage />
				}
			/>
		</IonPage>
	);
}
