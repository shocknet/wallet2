import { selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
import { selectAdminNprofileViews, selectHealthyNprofileViews, selectNprofileViews, selectSourceViews } from "@/State/scoped/backups/sources/selectors";
import type { Guard } from "./GuardedRoute";
import store from "@/State/store/store";

export const loadedIdentityGuard: Guard = () => {
	const boot = store.getState().appState.bootstrapped;
	const id = selectActiveIdentityId(store.getState());
	const ready = boot && !!id;
	return {
		allow: ready,
		redirectTo: ready ? undefined : { pathname: "/identity/create" },
		keySuffix: id ?? "anon",
	};
};

export const atLeastOneNprofileSource: Guard = ({ props }) => {
	const ids = selectNprofileViews(store.getState());
	const ok = ids.length > 0;
	return {
		allow: ok,
		redirectTo: ok ? undefined : {
			pathname: "/home",
			state: { from: props.location, reason: "You don't have any nprofile sources. Add one first" },
		},
		keySuffix: `sources:${ids.length}`,
	};
}

export const atLeastOneSource: Guard = ({ props }) => {
	const ids = selectSourceViews(store.getState());
	const ok = ids.length > 0;
	return {
		allow: ok,
		redirectTo: ok ? undefined : {
			pathname: "/home",
			state: { from: props.location, reason: "You don't have any sources. Add one first" },
		},
		keySuffix: `sources:${ids.length}`,
	};
}

export const atLeastOneHealthyNprofileSourceGuard: Guard = ({ props }) => {
	const ids = selectHealthyNprofileViews(store.getState());
	const ok = ids.length > 0;
	return {
		allow: ok,
		redirectTo: ok ? undefined : {
			pathname: "/home",
			state: { from: props.location, reason: "You don't have any nprofile sources. Add one first" },
		},
		keySuffix: `sources:${ids.length}`,
	};
};

export const atLeastOneAdminNprofileSourceGuard: Guard = ({ props }) => {
	const ids = selectAdminNprofileViews(store.getState());
	const ok = ids.length > 0;
	return {
		allow: ok,
		redirectTo: ok ? undefined : {
			pathname: "/home",
			state: { from: props.location, reason: "You don't have any admin sources to access metrics with" },
		},
		keySuffix: `sources:${ids.length}`,
	};
};



