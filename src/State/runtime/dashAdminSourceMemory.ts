const KEY_PREFIX = "__shockwallet_dash_admin_";

function storageKey(pubkey: string): string {
	return `${KEY_PREFIX}${pubkey}`;
}

export type DashAdminSessionSelection = {
	identityPubkey: string;
	sourceId: string;
};

export function sessionSourceIdForIdentity(
	selection: DashAdminSessionSelection | null,
	identityPubkey: string | null,
): string | null {
	if (!identityPubkey || selection?.identityPubkey !== identityPubkey) return null;
	return selection.sourceId;
}

export function activeAdminSourceId(
	adminIds: string[],
	selectedId: string | null,
	rememberedId: string | null = null,
): string | null {
	if (selectedId && adminIds.includes(selectedId)) return selectedId;
	if (rememberedId && adminIds.includes(rememberedId)) return rememberedId;
	if (adminIds.length === 1) return adminIds[0];
	return null;
}

export function readRememberedDashAdminSource(pubkey: string): string | null {
	try {
		const value = localStorage.getItem(storageKey(pubkey));
		return value ? value : null;
	} catch {
		return null;
	}
}

export function rememberDashAdminSource(pubkey: string, sourceId: string): void {
	try {
		localStorage.setItem(storageKey(pubkey), sourceId);
	} catch {
		// private mode or a full disk
	}
}

export function forgetDashAdminSource(pubkey: string): void {
	try {
		localStorage.removeItem(storageKey(pubkey));
	} catch {
		// private mode or a full disk
	}
}
