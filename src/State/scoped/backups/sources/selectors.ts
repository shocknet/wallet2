import { createSelector } from "@reduxjs/toolkit";
import { docsSelectors, metadataSelectors } from "./slice";
import { SourceType } from "../../common";
import { NostrKeyPair } from "@/lib/regex";
import { Satoshi } from "@/lib/types/units";
import { SourceDocV0 } from "./schema";
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

export type SourceViewBase = {
	sourceId: string;
	type: SourceType;
	label: string;
};

export type NprofileView = SourceViewBase & {
	type: SourceType.NPROFILE_SOURCE;
	relays: string[];        // only “present: true”
	beaconStale?: boolean;
	balanceSats?: Satoshi;
	maxWithdrawableSats?: Satoshi;
	lpk: string;
	keys: NostrKeyPair
};

export type LnAddrView = SourceViewBase & { type: SourceType.LIGHTNING_ADDRESS_SOURCE };
export type LnurlPayView = SourceViewBase & { type: SourceType.LNURL_P_SOURCE };

export type SourceView = NprofileView | LnAddrView | LnurlPayView;

const presentRelayUrls = (relays?: Record<string, { present: boolean }>) =>
	relays ? Object.keys(relays).filter(u => relays[u]?.present) : [];

const isDeleted = (d: SourceDocV0) => Boolean(d.deleted?.value);

const createSourceView = (d: SourceDocV0, meta?: SourceMetadata): SourceView => {
	const base: SourceViewBase = {
		sourceId: d.source_id,
		type: d.type,
		label: d.label.value,
	};

	switch (d.type) {
		case SourceType.NPROFILE_SOURCE: {
			const relays = presentRelayUrls(d.relays);
			const beaconStale =
				meta?.type === SourceType.NPROFILE_SOURCE && meta?.beacon
					? meta.beacon.stale
					: undefined;
			const balanceSats: Satoshi | undefined =
				meta?.type === SourceType.NPROFILE_SOURCE && meta?.balance
					? meta.balance.amount
					: undefined;

			const maxWithdrawableSats: Satoshi | undefined =
				meta?.type === SourceType.NPROFILE_SOURCE && meta?.balance
					? meta.balance.maxWithdrawable
					: undefined;

			return {
				...base,
				type: SourceType.NPROFILE_SOURCE,
				lpk: d.lpk,
				keys: d.keys,
				maxWithdrawableSats,
				relays,
				beaconStale,
				balanceSats,
			};
		}
		case SourceType.LIGHTNING_ADDRESS_SOURCE:
			return { ...base, type: SourceType.LIGHTNING_ADDRESS_SOURCE };
		case SourceType.LNURL_P_SOURCE:
			return { ...base, type: SourceType.LNURL_P_SOURCE };
	}
}


export const selectSourceViews = createSelector(
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

export const selectHealthyNprofileViews = createSelector(
	[selectNprofileViews],
	(views) => views.filter(v => v.type === SourceType.NPROFILE_SOURCE)
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
			if (meta.type !== SourceType.NPROFILE_SOURCE) continue;
			if (!liveIds.includes(meta.id)) continue; // ensure source is actually live
			if (meta.balance) total += meta.balance.amount;
		}
		return total;
	}
);



