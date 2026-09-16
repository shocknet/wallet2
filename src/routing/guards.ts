import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { selectAdminRpcSources, selectSourceViews } from "@/State/scoped/backups/sources/selectors";
import type { Guard } from "./GuardedRoute";
import store from "@/State/store/store";
import type { HomePageNavState } from "@/Pages/Home/nav";

export const loadedIdentityGuard: Guard = () => {
	const boot = store.getState().appState.bootstrapped;
	const id = selectActiveIdentity(store.getState())?.pubkey ?? null;
	const ready = boot && !!id;
	return {
		allow: ready,
		redirectTo: ready ? undefined : { pathname: "/identity/create" },
		keySuffix: id ?? "anon",
	};
};

export const atLeastOneSource: Guard = ({ props }) => {
	const ids = selectSourceViews(store.getState());
	const ok = ids.length > 0;
	return {
		allow: ok,
		redirectTo: ok ? undefined : {
			pathname: "/home",
			state: {
				from: props.location,
				reason: "You don't have any sources. Add one first",
			} satisfies HomePageNavState,
		},
		keySuffix: `sources:${ids.length}`,
	};
}

export const atLeastOneAdminSourceGuard: Guard = ({ props }) => {
	const ids = selectAdminRpcSources(store.getState());
	const ok = ids.length > 0;
	return {
		allow: ok,
		redirectTo: ok ? undefined : {
			pathname: "/home",
			state: {
				from: props.location,
				reason: "You are not an administrator of any connected nodes.",
			} satisfies HomePageNavState,
		},
		keySuffix: `sources:${ids.length}`,
	};
};
