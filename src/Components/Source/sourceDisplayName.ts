import { SourceType } from "@/State/scoped/common";
import type { SourceView } from "@/State/scoped/backups/sources/selectors";

export function sourceDisplayName(source: SourceView): string {
	const beaconName =
		source.type === SourceType.NPROFILE_SOURCE ? source.beaconName : undefined;
	return source.label?.trim() || beaconName?.trim() || "Anonymous";
}
