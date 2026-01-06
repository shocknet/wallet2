import { createEntityAdapter, EntityState } from "@reduxjs/toolkit";
import { SourceDocV0 } from "./schema";
import { SourceMetadata } from "./metadata/types";
import { HistoryCursor, OpKey, SourceOperation } from "./history/types";

export const BEACON_STALE_OLDER_THAN = 3 * 60 * 1000;
export const BEACON_SEMI_STALE_OLDER_THAN = 1 * 60 * 1000;


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

export interface SourcesMetadataState extends EntityState<SourceMetadata, string> {
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
	selectId: (op) => op.opKey,
	sortComparer: (a, b) => b.paidAtUnix - a.paidAtUnix,
});

export type BeaconProbeStatus = "idle" | "probing" | "done";

export type BeaconProbeState = {
	sourceId: string;
	epoch: number;
	status: BeaconProbeStatus;
};

export const beaconProbeAdapter = createEntityAdapter<BeaconProbeState, string>({
	selectId: (b) => b.sourceId
})

export type SourcesBeaconProbe = EntityState<BeaconProbeState, string>;



export interface SourcesState {
	docs: SourceDocsState;
	metadata: SourcesMetadataState;
	history: HistoryState;
	beaconProbe: SourcesBeaconProbe;
}

export const getIntialState = (): SourcesState => ({
	docs: docsAdapter.getInitialState(),

	// metadata and history are only for nprofile sources, as lightning address sources have no use for either
	metadata: metadataAdapter.getInitialState({
		beaconStaleMs: BEACON_STALE_OLDER_THAN,
	}),
	history: {
		ops: opsAdapter.getInitialState(),
		bySource: {},
		newPaymentsCount: 0
	},
	beaconProbe: beaconProbeAdapter.getInitialState()
});


