import type { History, Location } from "history";
import type {
	ParsedLnurlWithdrawInput,
	ParsedNprofileInput,
} from "@/lib/types/parse";

export type SourcesPageNavState = {
	parsedLnurlW?: ParsedLnurlWithdrawInput;
	parsedNprofile?: ParsedNprofileInput;
	from?: Location;
};

export function navToSources(
	history: History,
	state: SourcesPageNavState,
) {
	history.push({ pathname: "/sources", state });
}
