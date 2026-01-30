export type PushActionType = "payment-received";

export type PaymentReceivedIntentData = {
	action_type: "payment-received";
	notif_op_id: string;
};

export type PushActionData = PaymentReceivedIntentData;

export type PushClickIntent = {
	type: "push_click";
	platform: "web" | "ios" | "android";
	identityHint?: string;
	actionData?: PushActionData;
};

type RawIntentPayload = Record<string, unknown> | null | undefined;

const isNonEmptyString = (v: unknown): v is string =>
	typeof v === "string" && v.trim().length > 0;

const normalizeActionPayload = (payload: RawIntentPayload) => {
	if (!payload || typeof payload !== "object") return {};
	const data = payload as Record<string, unknown>;
	if (data.actionData && typeof data.actionData === "object") {
		return data.actionData as Record<string, unknown>;
	}
	return data;
};

export function parsePushIntentFromPayload(
	payload: RawIntentPayload,
	platform: PushClickIntent["platform"]
): PushClickIntent | null {
	if (!payload || typeof payload !== "object") return null;
	const data = payload as Record<string, unknown>;
	const actionPayload = normalizeActionPayload(payload);

	const identityHint = isNonEmptyString(data.identity_hint) ? data.identity_hint : undefined;
	const actionType = isNonEmptyString(actionPayload.action_type)
		? (actionPayload.action_type as string)
		: undefined;

	let actionData: PushActionData | undefined;
	if (actionType) {
		if (actionType === "payment-received") {
			const notifOpId = isNonEmptyString(actionPayload.notif_op_id)
				? (actionPayload.notif_op_id as string)
				: undefined;
			if (!notifOpId) return null;
			actionData = { action_type: "payment-received", notif_op_id: notifOpId };
		} else {
			return null;
		}
	}

	if (!identityHint && !actionData) return null;

	return {
		type: "push_click",
		platform,
		identityHint,
		actionData
	};
}

export function hasPushParams(url: URL): boolean {
	return url.searchParams.get("push") === "1";
}

export function parsePushIntentFromUrl(url: URL): PushClickIntent | null {
	if (!hasPushParams(url)) return null;
	const payload = {
		identity_hint: url.searchParams.get("identity_hint") ?? undefined,
		action_type: url.searchParams.get("action_type") ?? undefined,
		notif_op_id: url.searchParams.get("notif_op_id") ?? undefined,
	};
	return parsePushIntentFromPayload(payload, "web");
}

let pending: PushClickIntent | null = null;
let ready = false;
const listeners = new Set<(i: PushClickIntent) => void>();

const SS_KEY = "PUSH_CLICK_INTENT";

export function setIntent(i: PushClickIntent) {
	pending = i;
	try { sessionStorage.setItem(SS_KEY, JSON.stringify(i)); } catch {/*  */ }
	if (ready) listeners.forEach(fn => fn(i));
}

export function getIntent(): PushClickIntent | null {
	if (pending) return pending;
	try {
		const s = sessionStorage.getItem(SS_KEY);
		if (!s) return null;
		pending = JSON.parse(s);
		return pending;
	} catch {
		return null;
	}
}

export function clearIntent() {
	pending = null;
	try { sessionStorage.removeItem(SS_KEY); } catch {/*  */ }
}

export function markReady() {
	ready = true;
	const i = getIntent();
	if (i) listeners.forEach(fn => fn(i));
}

export function onIntent(fn: (i: PushClickIntent) => void) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn)
	}
}
