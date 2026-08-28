import { type ModalDismiss, useAskModal } from "@/Components/Modals/hooks/useAskModal";
import { InputNprofileCase } from "./InputNprofile";
import type { ParsedNprofileInput } from "@/lib/types/parse";
import { AddNprofileCase } from "./AddCases/AddNprofileCase";
import { ConnectAsAdminCase } from "./AddCases/ConnectAsAdminCase";
import { JoinNodeInviteCase } from "./AddCases/JoinNodeInviteCase";
import { LinkExistingAccountCase } from "./AddCases/LinkAccountCase";
import type { SourceIntegrationData } from "./types";
import { IonHeader, IonText, IonTitle, IonToolbar } from "@ionic/react";
import { ReactNode } from "react";


export type AddSourceModalOptions = {
	integrationData?: SourceIntegrationData;
	invitationToken?: string;
	initialNprofile?: ParsedNprofileInput | null;
};

type AddSourceModalProps = AddSourceModalOptions & {
	dismiss: ModalDismiss<true>;
};

function AddSourceModal({
	dismiss,
	integrationData,
	invitationToken,
	initialNprofile,
}: AddSourceModalProps) {


	if (initialNprofile) {
		return (
			<LockedNprofile
				parsed={initialNprofile}
				integrationData={integrationData}
				invitationToken={invitationToken}
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
	dismiss,
}: {
	parsed: ParsedNprofileInput;
	integrationData?: SourceIntegrationData;
	invitationToken?: string;
	dismiss: ModalDismiss<true>;
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
	if (invitationToken) {
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
	return <Wrapper title="Add source">
		<AddNprofileCase parsed={parsed} dismiss={dismiss} />
	</Wrapper>;
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



export function useAskAddSource() {
	return useAskModal<AddSourceModalOptions, true>(
		AddSourceModal,
		"dialog-modal wallet-modal",
	);
}




