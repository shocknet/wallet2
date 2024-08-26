import { PayTo, SpendFrom } from "../globalTypes";
import { SourceOperations } from "./Slices/HistorySlice";
import { PrefsInterface } from "./Slices/prefsSlice";
export const LNURL_OPERATIONS_DTAG = "shockwallet:lnurlOps";
export const PREFS_DTAG = "shockwallet:prefs"


export interface BackupAction {
	type: string;
	payload?: any
}

/* When a new device joings the sync pool, it may have multiple new items (sources, invitations, etc) that are each its own changelog and only after
* all those changes will the hash arrive at newHash. The partial flag signifies this.
*/
export interface Changelog {
	action: BackupAction
	order?: number;
	previousHash: string;
	newHash: string;
	partial?: boolean;
	id: string
}

export interface PaySourceShard {
	kind: "paySource";
	order: number;
	source: PayTo;
}

export interface SpendSourceShard {
	kind: "spendSource";
	order: number;
	source: SpendFrom;
}


export interface LNURLOperationsShard {
	kind: "lnurlOps";
	operations: SourceOperations;
}

export interface PrefsShard {
	kind: "prefs";
	prefs: PrefsInterface;
}


export type GeneralShard = PaySourceShard | SpendSourceShard | LNURLOperationsShard | PrefsShard;

export interface ShardsTagsRecord {
	dtags: string[];
	remoteHash: string;
}

