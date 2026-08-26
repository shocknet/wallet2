import type { ModalDismiss } from "@/Components/Modals/hooks/useAskModal";
import type { BeaconDiscovery } from "@/Hooks/useBeaconDiscovery";
import type { ParsedNprofileInput } from "@/lib/types/parse";

export type SourceIntegrationData = {
	token: string;
	lnAddress: string;
};



export type AddSourceBeacon = BeaconDiscovery;

export type AddSourceCaseProps = {
	parsed: ParsedNprofileInput;
	dismiss: ModalDismiss<true>;
};
