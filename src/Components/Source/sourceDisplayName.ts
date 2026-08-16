import type { SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/backups/sources/schema";

export function sourceDisplayName(source: SourceView): string {
	if (source.type === SourceType.NPROFILE_SOURCE) {
		return source.beaconName || source.label || "Anonymous";
	}
	return source.label || source.sourceId;
}

export function sourceTypeLabel(source: SourceView): string {
	switch (source.type) {
		case SourceType.NPROFILE_SOURCE:
			return "Pub";
		case SourceType.LIGHTNING_ADDRESS_SOURCE:
			return "Lightning address";
	}
}
