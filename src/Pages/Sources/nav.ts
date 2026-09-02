import type { History, Location } from "history";
import type { ParsedNprofileInput } from "@/lib/types/parse";

export type SourcesPageNavState = {
	parsedNprofile?: ParsedNprofileInput;
	from?: Location;
};

export function navToSources(
	history: History,
	state: SourcesPageNavState,
) {
	history.push({ pathname: "/sources", state });
}
