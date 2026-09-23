import type { SourceView } from "@/State/scoped/backups/sources/selectors";

export function sourceDisplayName(source: SourceView): string {
	return source.label?.trim() || source.beaconName?.trim() || "Anonymous";
}

export function sourceNodeDisplayName(source: SourceView): string {
	return source.beaconName?.trim() || sourceDisplayName(source);
}
