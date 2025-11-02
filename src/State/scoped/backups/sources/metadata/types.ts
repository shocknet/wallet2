import { Satoshi } from "@/lib/types/units";





export type MetaForNprofile = {
	id: string;
	beaconName?: string;
	lastSeenAtMs: number;
	stale: boolean;
	lpk: string;
	balance: Satoshi;
	maxWithdrable: Satoshi;
	vanityName?: string;
	ndebit?: string;
};





export type SourceMetadata = MetaForNprofile

