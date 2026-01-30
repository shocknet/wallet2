import { useEffect } from "react";
import { useIonRouter } from "@ionic/react";
import { useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentityId } from "@/State/identitiesRegistry/slice";

const KEY = "PENDING_PUSH_NAV";

export type PendingNav = {
	path: string;
	state?: any;
	identityId?: string | null;
	ts: number;
};

export function setPendingNav(args: { path: string; state?: any; identityId?: string | null }) {
	const v: PendingNav = { ...args, ts: Date.now() };
	sessionStorage.setItem(KEY, JSON.stringify(v));
}

export function getPendingNav(): PendingNav | null {
	const s = sessionStorage.getItem(KEY);
	if (!s) return null;
	try {
		return JSON.parse(s);
	} catch {
		return null;
	}
}

export function clearPendingNav() {
	sessionStorage.removeItem(KEY);
}

export function ConsumePendingNav() {
	const ionRouter = useIonRouter();
	const activeIdentityId = useAppSelector(selectActiveIdentityId);

	useEffect(() => {
		const nav = getPendingNav();
		if (!nav) return;
		if (nav.identityId && nav.identityId !== activeIdentityId) return;


		clearPendingNav();
		ionRouter.push(nav.path, "root", "replace", nav.state);
	}, [ionRouter, activeIdentityId]);

	return null;
}
