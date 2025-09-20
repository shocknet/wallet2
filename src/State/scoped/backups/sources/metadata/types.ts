import { Satoshi } from "@/lib/types/units";
import { SourceType } from "@/State/scoped/common";


export type BeaconMeta = {
	lpk: string;         // pub that emitted the beacon
	name: string;
	lastSeenAtMs: number;
	stale: boolean;
};

export type BalanceMeta = {
	amount: Satoshi;
	maxWithdrawable?: Satoshi;
};

export type MetaForNprofile = {
	id: string; // sourceId
	type: SourceType.NPROFILE_SOURCE;
	beacon?: BeaconMeta;
	balance?: BalanceMeta;
};

export type MetaForLightningAddress = {
	id: string;
	type: SourceType.LIGHTNING_ADDRESS_SOURCE;
};

export type MetaForLnurlPay = {
	id: string;
	type: SourceType.LNURL_P_SOURCE;
};

export type SourceMetadata =
	| MetaForNprofile
	| MetaForLightningAddress
	| MetaForLnurlPay;
