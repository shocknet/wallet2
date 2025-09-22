import { createEntityAdapter, EntityState } from "@reduxjs/toolkit";
import { SourceDocV0 } from "./schema";
import { SourceMetadata } from "./metadata/types";
import { HistoryCursor, OpKey, SourceOperation } from "./history/types";
import { makeKey } from "./history/helpers";

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

interface SourcesMetadataState extends EntityState<SourceMetadata, string> {
	beaconStaleMs: number;
}




export type SourceHistoryIndex = {
	ids: OpKey[];        // operation keys for this source
	cursor: HistoryCursor;
};

export type HistoryState = {
	ops: EntityState<SourceOperation, OpKey>;
	bySource: Record<string, SourceHistoryIndex>;
	newPaymentsCount: number;
};

export const opsAdapter = createEntityAdapter<SourceOperation, OpKey>({
	selectId: (op) => makeKey(op.sourceId, op.operationId),
	sortComparer: (a, b) => b.paidAtUnix - a.paidAtUnix,
});

export interface SourcesState {
	docs: SourceDocsState;
	metadata: SourcesMetadataState;
	history: HistoryState
}

export const getIntialState = (): SourcesState => ({
	docs: docsAdapter.getInitialState(),
	metadata: metadataAdapter.getInitialState({
		beaconStaleMs: 150_000,
	}),
	history: {
		ops: opsAdapter.getInitialState(),
		bySource: {},
		newPaymentsCount: 0
	}
});

console.log("console here", getIntialState())
