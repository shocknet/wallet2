import { MetaForNprofile } from "./scoped/backups/sources/metadata/types";
import { NprofileSourceDocV0, SourceDocV0 } from "./scoped/backups/sources/schema";
import { BEACON_STALE_OLDER_THAN } from "./scoped/backups/sources/state";
import { SourceType } from "./scoped/common";

export const isNprofileSource = (doc?: SourceDocV0): doc is NprofileSourceDocV0 => !!doc && doc.type === SourceType.NPROFILE_SOURCE;

export const isSourceDeleted = (doc: SourceDocV0) => doc.deleted.value;

export const isSourceStale = (meta: MetaForNprofile) => Date.now() - meta.lastSeenAtMs > BEACON_STALE_OLDER_THAN;
