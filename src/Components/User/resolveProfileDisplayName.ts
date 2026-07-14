export function resolveProfileDisplayName(profile?: {
	display_name?: string;
	name?: string;
} | null): string {
	return profile?.display_name || profile?.name || "Anonymous";
}
