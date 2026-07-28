import { ShellFailureLayout } from "./ShellFailureLayout";
import { useAppDispatch } from "@/State/store/hooks";
import { cancelIdentityUnlock } from "../coordinator";
import { truncateTextMiddle } from "@/lib/format";

export function IdentityLoadFailedScreen({
	identityId,
	message,
}: {
	identityId: string;
	message: string;
}) {
	const dispatch = useAppDispatch();

	return (
		<ShellFailureLayout
			title="Couldn't load profile"
			message={message}
			detail="Choose another profile to continue."
			meta={
				<p className="font-mono text-xs text-faint">
					{truncateTextMiddle(identityId, 10, 10, "…")}
				</p>
			}
			actions={[
				{
					key: "choose-another",
					label: "Choose another profile",
					primary: true,
					onClick: () => {
						dispatch(cancelIdentityUnlock());
					},
				},
			]}
		/>
	);
}
