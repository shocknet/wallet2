import { IonMenuButton } from "@ionic/react";
import { useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { ProfilePicture } from "@/Components/User/ProfilePicture";
import { resolveIdentityRelays } from "@/State/identitiesRegistry/types";

export function ProfileMenuButton() {
	const activeIdentity = useAppSelector(selectActiveIdentity)!;
	const relays = resolveIdentityRelays(activeIdentity);

	return (
		<IonMenuButton
			autoHide={false}
			aria-label="Open menu"
		>
			<ProfilePicture
				pubkey={activeIdentity.pubkey}
				relays={relays}
				size="sm"
				variant="flat"
				className="size-10"
			/>
		</IonMenuButton>
	);
}
