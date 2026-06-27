import { useCallback, useEffect } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { useHistory } from "react-router-dom";

const EVENT_NAME = "identity-activation:pending-nav-changed";
let pendingNavInMemory: PendingNav | null = null;

export type PendingNav = {
	path: string;
	state?: any;
	identityId?: string | null;
};



export function setPendingNav(args: { path: string; state?: any; identityId?: string | null }) {
	const v: PendingNav = { ...args };
	pendingNavInMemory = v;
	emitPendingNavChanged();
}

export function getPendingNav(): PendingNav | null {
	return pendingNavInMemory;
}

export function clearPendingNav() {
	pendingNavInMemory = null;
	emitPendingNavChanged();
}

function emitPendingNavChanged() {
	window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function onPendingNavChanged(listener: () => void) {
	const onCustom = () => listener();

	window.addEventListener(EVENT_NAME, onCustom);
	return () => {
		window.removeEventListener(EVENT_NAME, onCustom);
	};
}

export function ConsumePendingNav() {
	const history = useHistory();
	const activeIdentity = useAppSelector(selectActiveIdentity);

	const tryConsumePendingNav = useCallback(() => {
		const nav = getPendingNav();
		if (!nav) return;
		if (nav.identityId && nav.identityId !== activeIdentity?.pubkey) return;
		clearPendingNav();
		history.replace(nav.path, nav.state);
	}, [activeIdentity?.pubkey, history]);

	useEffect(() => {
		tryConsumePendingNav();
		const off = onPendingNavChanged(tryConsumePendingNav);
		return off;
	}, [tryConsumePendingNav]);

	return null;
}
