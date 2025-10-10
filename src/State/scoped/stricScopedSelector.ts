import type { RootState } from "@/State/store/store";

// Throws when used when no identity is loaded.
// Clear cut boundry that should only be used on identity protected routes
// i.e. routes only accessible for a mounted identity
export function selectScopedStrict(s: RootState) {
	const v = s.scoped;
	if (!v) throw new Error("Scoped state not mounted (no active identity)");
	return v;
}
