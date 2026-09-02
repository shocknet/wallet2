import { Satoshi } from "@/lib/types/units";





export type SourceMetadata = {
	id: string;
	lpk: string;
	topicId?: string;
	balance: Satoshi;
	maxWithdrable: Satoshi;
	vanityName?: string;
	ndebit?: string;
	noffer?: string;
	nmanage?: string;
};
