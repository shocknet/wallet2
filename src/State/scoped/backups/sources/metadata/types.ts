import { Satoshi } from "@/lib/types/units";
import { SourceType } from "@/State/scoped/common";


export type BeaconMeta = {
	name: string;
	lastSeenAtMs: number;
	stale: boolean;
};

export type BalanceMeta = {
	amount: Satoshi;
	maxWithdrawable?: Satoshi;
};

export type MetaForNprofile = {
	id: string;
	type: SourceType.NPROFILE_SOURCE;
	beacon?: BeaconMeta;
	balance?: BalanceMeta;
	vanityName?: string;
	ndebit?: string;
};

export type MetaForLightningAddress = {
	id: string;
	type: SourceType.LIGHTNING_ADDRESS_SOURCE;
};



export type SourceMetadata =
	| MetaForNprofile
	| MetaForLightningAddress;
