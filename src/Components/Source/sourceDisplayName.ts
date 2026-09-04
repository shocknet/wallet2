import type { SourceView } from "@/State/scoped/backups/sources/selectors";

export function sourceDisplayName(source: SourceView): string {
	return source.label?.trim() || source.beaconName?.trim() || "Anonymous";
}
