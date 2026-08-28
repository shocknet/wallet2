import type { SourceView } from "@/State/scoped/backups/sources/selectors";

export function sourceDisplayName(source: SourceView): string {
	return source.beaconName || source.label || "Anonymous";
}
