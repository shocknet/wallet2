import { createSelector } from "@reduxjs/toolkit";
import { docsSelectors, metadataSelectors } from "./slice";
import { SourceType } from "../../common";
import { NostrKeyPair } from "@/lib/regex";
import { Satoshi } from "@/lib/types/units";
import { LightningAddressSourceDocV0, NprofileSourceDocV0, SourceDocV0 } from "./schema";
import { SourceMetadata } from "./metadata/types";
import { selectFavoriteSourceId } from "../identity/slice";
import { RootState } from "@/State/store/store";

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


export const selectSourceMetadata = createSelector(
	[docsSelectors.selectEntities, metadataSelectors.selectEntities],
	(sourceEntities, metaEntities): SourceView[] => {
		const out: SourceView[] = [];
		for (const id in sourceEntities) {
			const e = sourceEntities[id];
			if (!e) continue;
			const d = e.draft;
			if (isDeleted(d)) continue;
			out.push(createSourceView(d, metaEntities[id]));
		}
		return out;
	}
);


export type SourceViewBase = {
	sourceId: string;
	type: SourceType;
	label: string | null;
};

export type NprofileView = SourceViewBase & {
	type: SourceType.NPROFILE_SOURCE;
	relays: string[];
	beaconStale: boolean;
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


const createNprofileView = (d: NprofileSourceDocV0, m: SourceMetadata): NprofileView => {
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
		beaconStale: m.stale,
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

const isDeleted = (d: SourceDocV0) => Boolean(d.deleted?.value);

const createSourceView = (d: SourceDocV0, m: SourceMetadata): SourceView => {
	if (d.type === SourceType.NPROFILE_SOURCE) {
		return createNprofileView(d, m)
	} else {
		return createLightningAddressView(d);
	}
}


export const selectSourceViews = createSelector(
	[docsSelectors.selectAll, metadataSelectors.selectEntities],
	(sourceEntities, metaEntities): SourceView[] => {
		const out: SourceView[] = [];
		for (const source of sourceEntities) {

			const d = source.draft;
			if (isDeleted(d)) continue;

			const view = createSourceView(d, metaEntities[d.source_id])
			out.push(view);
		}
		return out;
	}
);

export const selectSourceViewById = createSelector(
	[
		docsSelectors.selectEntities,
		metadataSelectors.selectEntities,
		(_state: RootState, sourceId: string) => sourceId
	],
	(sourceEntities, metaEntities, sourceId) => {

		const e = sourceEntities[sourceId];
		if (!e || isDeleted(e.draft)) return null;
		return createSourceView(e.draft, metaEntities[sourceId]);
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



export const selectHealthyNprofileViews = createSelector(
	[selectNprofileViews],
	(views) => views.filter(v => !v.beaconStale)
);

export const selectHealthyAdminNprofileViews = createSelector(
	[selectHealthyNprofileViews],
	(views) => views.filter(v => !!v.adminToken)
);


export const selectFavoriteSourceView = createSelector(
	[selectFavoriteSourceId, docsSelectors.selectEntities, metadataSelectors.selectEntities],
	(favId, sourceEntities, metaEntities): SourceView | null => {
		if (!favId) return null;
		const e = sourceEntities[favId];
		if (!e || isDeleted(e.draft)) return null;
		return createSourceView(e.draft, metaEntities[favId]);
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



