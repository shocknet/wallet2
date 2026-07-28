import { IonMenuButton } from "@ionic/react";
import { useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { ProfilePicture } from "@/Components/User/ProfilePicture";

export function ProfileMenuButton() {
	const activeIdentity = useAppSelector(selectActiveIdentity)!;

	return (
		<IonMenuButton
			autoHide={false}
			aria-label="Open menu"
		>
			<ProfilePicture
				identity={activeIdentity}
				size="sm"
				variant="flat"
				className="size-10"
			/>
		</IonMenuButton>
	);
}
