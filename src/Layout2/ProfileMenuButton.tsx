import { IonMenuButton } from "@ionic/react";
import { useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { ProfilePicture } from "@/Components/User/ProfilePicture";

export function ProfileMenuButton() {
	const activeIdentity = useAppSelector(selectActiveIdentity)!;

	return (
		<IonMenuButton
			autoHide={false}
			className="
				m-0 h-11 w-11
				[--padding-start:0] [--padding-end:0]
				[--padding-top:0] [--padding-bottom:0]
			"
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
