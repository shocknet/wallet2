import type { SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/backups/sources/schema";

export function sourceDisplayName(source: SourceView): string {
	if (source.type === SourceType.NPROFILE_SOURCE) {
		return source.beaconName || source.label || "Pub source";
	}
	return source.label || source.sourceId;
}
