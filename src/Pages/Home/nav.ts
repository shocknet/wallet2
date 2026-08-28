import type { History, Location } from "history";

export type HomePageNavState = {
	reason?: string;
	from?: Location;
	notif_op_id?: string;
	sourceId?: string;
};

export function navToHome(
	history: History,
	state: HomePageNavState,
) {
	history.push({ pathname: "/home", state });
}
