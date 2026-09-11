import type { History } from "history";

export type HomePageNavState = {
	notif_op_id?: string;
	sourceId?: string;
};

export function navToHome(
	history: History,
	state: HomePageNavState,
) {
	history.push({ pathname: "/home", state });
}
