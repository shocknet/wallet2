import { useCallback, type ReactNode } from "react";
import { IonHeader, IonText, IonTitle, IonToolbar } from "@ionic/react";
import {
	allowOverlayRoles,
	useOverlayCoordinator,
	type Dismiss,
	type OverlayChoice,
	type OverlayOptions,
} from "@/overlay";
import { InputNprofileCase } from "./InputNprofile";
import type { ParsedNprofileInput } from "@/lib/types/parse";
import { AddNprofileCase } from "./AddCases/AddNprofileCase";
import { ConnectAsAdminCase } from "./AddCases/ConnectAsAdminCase";
import { JoinNodeInviteCase } from "./AddCases/JoinNodeInviteCase";
import { LinkExistingAccountCase } from "./AddCases/LinkAccountCase";
import type { SourceIntegrationData } from "./types";


export type AddSourceModalOptions = {
	integrationData?: SourceIntegrationData;
	invitationToken?: string;
	fromInviteUrl?: boolean;
	initialNprofile?: ParsedNprofileInput | null;
};

type AddSourceModalProps = AddSourceModalOptions & {
	dismiss: Dismiss<OverlayChoice>;
};

function AddSourceModal({
	dismiss,
	integrationData,
	invitationToken,
	fromInviteUrl,
	initialNprofile,
}: AddSourceModalProps) {


	if (initialNprofile) {
		return (
			<LockedNprofile
				parsed={initialNprofile}
				integrationData={integrationData}
				invitationToken={invitationToken}
				fromInviteUrl={fromInviteUrl}
				dismiss={dismiss}
			/>
		);
	}

	return (
		<Wrapper title="Add source">
			<InputNprofileCase dismiss={dismiss} />
		</Wrapper>
	);
}





function LockedNprofile({
	parsed,
	integrationData,
	invitationToken,
	fromInviteUrl,
	dismiss,
}: {
	parsed: ParsedNprofileInput;
	integrationData?: SourceIntegrationData;
	invitationToken?: string;
	fromInviteUrl?: boolean;
	dismiss: Dismiss<OverlayChoice>;
}) {
	if (integrationData) {
		return (
			<Wrapper title="Link existing account">
				<LinkExistingAccountCase
					parsed={parsed}
					dismiss={dismiss}
					integrationData={integrationData}
				/>
			</Wrapper>

		);
	}
	if (parsed.adminEnrollToken) {
		return (
			<Wrapper title="Connect as admin">
				<ConnectAsAdminCase
					parsed={parsed as ParsedNprofileInput & { adminEnrollToken: string }}
					dismiss={dismiss}
				/>
			</Wrapper>
		);
	}
	if (fromInviteUrl) {
		return (
			<Wrapper title="Join node invite">
				<JoinNodeInviteCase
					parsed={parsed}
					dismiss={dismiss}
					inviteToken={invitationToken}
				/>
			</Wrapper>
		);
	}
	return (
		<Wrapper title="Add source">
			<AddNprofileCase parsed={parsed} dismiss={dismiss} />
		</Wrapper>
	);
}



export function Wrapper({ children, title }: { children: ReactNode, title: string }) {
	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonTitle>
						<IonText className="text-primary text-lg font-bold">
							{title}
						</IonText>
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<div className="ion-padding bg-[var(--app-surface)]">
				{children}
			</div>
		</>
	);
}



export function useAddSourceModal() {
	const { present } = useOverlayCoordinator();
	return useCallback((options: AddSourceModalOptions = {}, overlay?: OverlayOptions) => {
		return present<OverlayChoice>(
			(dismiss) => <AddSourceModal {...options} dismiss={dismiss} />,
			{ cssClass: "dialog-modal wallet-modal", ...overlay },
		);
	}, [present]);
}

const lockedAddSourceOverlay: OverlayOptions = {
	backdropDismiss: false,
	keyboardClose: false,
	canDismiss: allowOverlayRoles("confirm", "cancel"),
};

export function useAddSourceIntentModal() {
	const { tryPresent } = useOverlayCoordinator();
	return useCallback((options: AddSourceModalOptions = {}) => {
		return tryPresent<OverlayChoice>(
			(dismiss) => <AddSourceModal {...options} dismiss={dismiss} />,
			{ cssClass: "dialog-modal wallet-modal", ...lockedAddSourceOverlay },
		);
	}, [tryPresent]);
}




