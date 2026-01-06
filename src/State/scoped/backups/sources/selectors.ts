import { createSelector } from "@reduxjs/toolkit";
import { beaconProbeSelectors, docsSelectors, metadataSelectors } from "./slice";
import { SourceType } from "../../common";
import { NostrKeyPair } from "@/lib/regex";
import { Satoshi } from "@/lib/types/units";
import { LightningAddressSourceDocV0, NprofileSourceDocV0, SourceDocV0 } from "./schema";
import { SourceMetadata } from "./metadata/types";
import { selectFavoriteSourceId } from "../identity/slice";
import { RootState } from "@/State/store/store";
import { BEACON_STALE_OLDER_THAN, BeaconProbeState, BeaconProbeStatus } from "./state";
import { selectNowMs } from "@/State/runtime/slice";

export const selectLiveSourceIds = createSelector(
	[docsSelectors.selectAll],
	(entities) => entities
		.map(e => e.draft)
		.filter(d => !(d.deleted?.value))
		.map(d => d.source_id)
);


export const selectLiveSourceEntities = createSelector(
	[docsSelectors.selectAll],
	(entities) => entities.filter(e => !isDeleted(e.draft))
);




export type SourceViewBase = {
	sourceId: string;
	type: SourceType;
	label: string | null;
};

export type NprofileView = SourceViewBase & {
	type: SourceType.NPROFILE_SOURCE;
	relays: string[];
	beaconStale: BeaconHealth;
	beaconLastSeenAtMs: number
	beaconName?: string;
	balanceSats: Satoshi;
	maxWithdrawableSats: Satoshi;
	lpk: string;
	keys: NostrKeyPair;
	bridgeUrl: string | null;
	isNDebitDiscoverable: boolean;
	adminToken: string | null;
	vanityName?: string;
	ndebit?: string;
};

export type BeaconHealth = "warmingUp" | "stale" | "fresh";

const computeBeaconHealth = (args: {
	nowMs: number;
	lastSeenAtMs: number;
	probe?: { status: BeaconProbeStatus };
}): BeaconHealth => {
	const { nowMs, lastSeenAtMs, probe } = args;

	// Fresh always wins
	if (nowMs - lastSeenAtMs <= BEACON_STALE_OLDER_THAN) return "fresh";

	// If stale-ish but actively probing: warming up
	if (!probe || probe.status === "probing") return "warmingUp";

	return "stale";
}
const createNprofileView = (d: NprofileSourceDocV0, m: SourceMetadata, probe: BeaconProbeState | undefined, nowMs: number): NprofileView => {
	if (!m) {
		throw new Error("No metadata for nprofile source. Something went wrong");
	}
	const base: SourceViewBase = {
		sourceId: d.source_id,
		type: d.type,
		label: d.label.value,
	};

	const relays = presentRelayUrls(d.relays);


	return {
		...base,
		type: SourceType.NPROFILE_SOURCE,
		lpk: d.lpk,
		keys: d.keys,
		relays,
		balanceSats: m.balance,
		maxWithdrawableSats: m.maxWithdrable,
		isNDebitDiscoverable: d.is_ndebit_discoverable.value,
		ndebit: m.ndebit,
		vanityName: m.vanityName,
		bridgeUrl: d.bridgeUrl.value,
		beaconStale: computeBeaconHealth({
			nowMs,
			lastSeenAtMs: m.lastSeenAtMs,
			probe,
		}),
		beaconLastSeenAtMs: m.lastSeenAtMs,
		beaconName: m.beaconName,
		adminToken: d.admin_token.value
	};
}

const createLightningAddressView = (d: LightningAddressSourceDocV0): LnAddrView => {
	return {
		sourceId: d.source_id,
		type: d.type,
		label: d.label.value,
	};
}

export type LnAddrView = SourceViewBase & { type: SourceType.LIGHTNING_ADDRESS_SOURCE };


export type SourceView = NprofileView | LnAddrView;

const presentRelayUrls = (relays?: Record<string, { present: boolean }>) =>
	relays ? Object.keys(relays).filter(u => relays[u]?.present) : [];

const isDeleted = (d: SourceDocV0) => Boolean(d.deleted.value);



export const selectSourceViews = createSelector(
	[
		docsSelectors.selectAll,
		metadataSelectors.selectEntities,
		beaconProbeSelectors.selectEntities,
		selectNowMs
	],
	(sourceEntities, metaEntities, beaconProbeEntities, nowMs): SourceView[] => {
		const out: SourceView[] = [];
		for (const source of sourceEntities) {

			const d = source.draft;
			if (d.deleted.value) continue;

			let view;
			if (d.type === SourceType.NPROFILE_SOURCE) {
				view = createNprofileView(d, metaEntities[d.source_id], beaconProbeEntities[d.source_id], nowMs)
			} else {
				view = createLightningAddressView(d)
			}
			out.push(view);
		}
		return out;
	}
);

export const selectSourceViewById = createSelector(
	[
		docsSelectors.selectEntities,
		metadataSelectors.selectEntities,
		beaconProbeSelectors.selectEntities,
		selectNowMs,
		(_state: RootState, sourceId: string) => sourceId
	],
	(sourceEntities, metaEntities, beaconProbeEntities, nowMs, sourceId) => {

		const e = sourceEntities[sourceId];
		if (!e || e.draft.deleted.value) return null;

		const d = e.draft;
		if (d.type === SourceType.NPROFILE_SOURCE) {
			return createNprofileView(d, metaEntities[d.source_id], beaconProbeEntities[d.source_id], nowMs);
		} else {
			return createLightningAddressView(d);
		}
	}
)

export const selectNprofileViews = createSelector(
	[selectSourceViews],
	(views) => views.filter(v => v.type === SourceType.NPROFILE_SOURCE)
);

export const selectNprofileViewsByLpk = createSelector(
	[
		selectNprofileViews,
		(_state: RootState, lpk: string) => lpk
	],
	(views, lpk) => views.filter(v => v.lpk === lpk)
);

export const makeSelectNprofileViewsByLpk = () => {
	const selectNprofileViewsByLpk = createSelector(
		[
			selectNprofileViews,
			(_state: RootState, lpk: string) => lpk
		],
		(views, lpk) => views.filter(v => v.lpk === lpk)
	);
	return selectNprofileViewsByLpk
}



export const selectHealthyNprofileViews = createSelector(
	[selectNprofileViews],
	(views) => views.filter(v => v.beaconStale === "fresh")
);

export const selectAdminNprofileViews = createSelector(
	[selectNprofileViews],
	(views) => views.filter(v => !!v.adminToken)
);

export const selectInitialAdminNprofileView = createSelector(
	[selectAdminNprofileViews],
	(views) => views[0]
)

export const selectHealthyAdminNprofileViews = createSelector(
	[selectHealthyNprofileViews],
	(views) => views.filter(v => !!v.adminToken)
);


export const selectFavoriteSourceView = createSelector(
	[
		selectFavoriteSourceId,
		docsSelectors.selectEntities,
		metadataSelectors.selectEntities,
		beaconProbeSelectors.selectEntities,
		selectNowMs
	],
	(favId, sourceEntities, metaEntities, beaconProbeEntities, nowMs): SourceView | null => {
		if (!favId) return null;
		const e = sourceEntities[favId];
		if (!e || e.draft.deleted.value) return null;

		const d = e.draft;
		if (d.type === SourceType.NPROFILE_SOURCE) {
			return createNprofileView(d, metaEntities[d.source_id], beaconProbeEntities[d.source_id], nowMs)
		} else {
			return createLightningAddressView(d);
		}
	}
);


export const selectTotalBalance = createSelector(
	[metadataSelectors.selectAll, selectLiveSourceIds],
	(allMeta, liveIds) => {
		let total = 0;
		for (const meta of allMeta) {

			if (!liveIds.includes(meta.id)) continue; // ensure source is actually live (i.e. not marked deleted and awaiting publisher to actually delete)
			total += meta.balance;
		}
		return total as Satoshi;
	}
);



