import { useEffect } from "react";
import { useIonRouter } from "@ionic/react";
import { useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
import { useHistory } from "react-router-dom";

const KEY = "PENDING_PUSH_NAV";

export type PendingNav = {
	path: string;
	state?: any;
	identityId?: string | null;
};

export function assertPendingNav(candidate: unknown): asserts candidate is PendingNav {
	if (!candidate || typeof candidate !== "object") {
		throw new Error("Invalid pending nav: expected object");
	}

	const maybePendingNav = candidate as Partial<PendingNav>;
	if (typeof maybePendingNav.path !== "string") {
		throw new Error("Invalid pending nav: path must be a string");
	}

	if (
		maybePendingNav.identityId !== undefined &&
		maybePendingNav.identityId !== null &&
		typeof maybePendingNav.identityId !== "string"
	) {
		throw new Error("Invalid pending nav: identityId must be string, null, or undefined");
	}
}

export function parsePendingNavJsonString(value: string): PendingNav {
	const candidate = JSON.parse(value);
	assertPendingNav(candidate);
	return candidate;
}

export function setPendingNav(args: { path: string; state?: any; identityId?: string | null }) {
	const v: PendingNav = { ...args };
	sessionStorage.setItem(KEY, JSON.stringify(v));
}

export function getPendingNav(): PendingNav | null {
	const s = sessionStorage.getItem(KEY);
	if (!s) return null;
	try {
		return parsePendingNavJsonString(s);
	} catch {
		return null;
	}
}

export function clearPendingNav() {
	sessionStorage.removeItem(KEY);
}

export function ConsumePendingNav() {
	const history = useHistory();
	const activeIdentityId = useAppSelector(selectActiveIdentityId);

	useEffect(() => {
		const nav = getPendingNav();
		if (!nav) return;
		if (nav.identityId && nav.identityId !== activeIdentityId) return;


		clearPendingNav();
		history.replace(nav.path, nav.state);
	}, [history, activeIdentityId]);

	return null;
}
