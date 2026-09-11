import type { Dismiss, OverlayChoice } from "@/overlay";
import type { BeaconDiscovery } from "@/Hooks/useBeaconDiscovery";
import type { ParsedNprofileInput } from "@/lib/types/parse";

export type SourceIntegrationData = {
	token: string;
	lnAddress: string;
};



export type AddSourceBeacon = BeaconDiscovery;

export type AddSourceCaseProps = {
	parsed: ParsedNprofileInput;
	dismiss: Dismiss<OverlayChoice>;
};
