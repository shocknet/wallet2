import { createEntityAdapter, EntityState } from "@reduxjs/toolkit";
import { SourceDocV0 } from "./schema";
import { SourceMetadata } from "./metadata/types";
import { HistoryCursor, OpKey, SourceOperation } from "./history/types";

export { BEACON_STALE_OLDER_THAN } from "@/State/scoped/beacons/state";

export interface SourceDocEntity {
	base?: SourceDocV0;
	draft: SourceDocV0;
	lastPublishedAt?: number;
	dirty: boolean;
}

export const docsAdapter = createEntityAdapter<SourceDocEntity, string>({
	selectId: (s) => s.draft.source_id,
	sortComparer: (a, b) => b.draft.created_at - a.draft.created_at
})

export type SourceDocsState = EntityState<SourceDocEntity, string>;

export const metadataAdapter = createEntityAdapter<SourceMetadata, string>({
	selectId: (m) => m.id,
});

export type SourcesMetadataState = EntityState<SourceMetadata, string>;

export type SourceHistoryIndex = {
	ids: OpKey[];
	cursor: HistoryCursor;
};

export type HistoryState = {
	ops: EntityState<SourceOperation, OpKey>;
	bySource: Record<string, SourceHistoryIndex>;
	newPaymentsCount: number;
};

export const opsAdapter = createEntityAdapter<SourceOperation, OpKey>({
	selectId: (op) => op.opKey,
	sortComparer: (a, b) => b.paidAtUnix - a.paidAtUnix,
});

export interface SourcesState {
	docs: SourceDocsState;
	metadata: SourcesMetadataState;
	history: HistoryState;
}

export const getIntialState = (): SourcesState => ({
	docs: docsAdapter.getInitialState(),
	metadata: metadataAdapter.getInitialState(),
	history: {
		ops: opsAdapter.getInitialState(),
		bySource: {},
		newPaymentsCount: 0
	},
});
