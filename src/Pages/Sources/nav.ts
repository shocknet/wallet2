import type { History, Location } from "history";

export type SourcesPageNavState = {
	from?: Location;
};

export function navToSources(
	history: History,
	state?: SourcesPageNavState,
) {
	history.push({ pathname: "/sources", state });
}
