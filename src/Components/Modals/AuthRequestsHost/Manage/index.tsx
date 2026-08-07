import { IonHeader, IonTitle, IonToolbar } from "@ionic/react";
import { ManageAuthRequestView } from "./ManageAuthRequestView";
import type { ManageAuthProps } from "./useManageActions";

function ManageAuthRequest(props: ManageAuthProps) {
	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Incoming Manage Request</IonTitle>
				</IonToolbar>
			</IonHeader>
			<ManageAuthRequestView {...props} />
		</>
	);
}

export default ManageAuthRequest;
