
import { getNostrClient } from '@/Api/nostr';

import type { AppThunk } from '@/State/store/store';

import type { Satoshi } from '@/lib/types/units';
import { NprofileView } from '../selectors';
import { sourcesActions } from '../slice';



export function refreshSourceInfo(source: NprofileView): AppThunk<void> {
	return async (dispatch) => {

		const client = await getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys);
		const res = await client.GetUserInfo();
		if (res.status !== "OK") throw new Error(res.reason);

		dispatch(sourcesActions.setBalance({ sourceId: source.sourceId, balance: { amount: res.balance as Satoshi, maxWithdrawable: res.max_withdrawable as Satoshi } }));

	};
}
