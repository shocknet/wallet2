import {
	IonNav,
	IonPage,
} from "@ionic/react";
import { CreateMethodPage } from "./create/CreateMethodPage";
import { IdentitiesListPage } from "./IdentitiesListPage";
import { useMemo } from "react";

export function IdentityGate({
	initialView,
}: {
	initialView: "create" | "select";
}) {

	const root = useMemo(() => {
		return initialView === "create"
			? () => <CreateMethodPage />
			: () => <IdentitiesListPage />
	}, [initialView]);

	return (
		<IonPage className="ion-page-width">
			<IonNav
				root={root}
			/>
		</IonPage>
	);
}
