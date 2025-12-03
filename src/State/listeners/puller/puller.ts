import { listenerKick } from "@/State/listeners/actions";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { identityActions } from "@/State/scoped/backups/identity/slice";
import { Filter } from "nostr-tools";
import getIdentityNostrApi from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { subscribeToNostrEvents } from "@/State/identitiesRegistry/helpers/nostr";
import { identityDocDtag, processRemoteDoc } from "@/State/identitiesRegistry/helpers/processDocs";
import { ListenerSpec } from "../lifecycle/lifecycle";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";

export const pullerSpec: ListenerSpec = {
	name: "puller",
	listeners: [
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {
					const state = listenerApi.getState();

					const identity = selectActiveIdentity(state)!;
					const pubkey = identity.pubkey;

					const identityApi = await getIdentityNostrApi(identity);

					const filters: Filter[] = [
						{ kinds: [30078], authors: [pubkey], "#d": [identityDocDtag] },

						// 30079: source docs
						{ kinds: [30079], authors: [pubkey] },
					];

					const subCloser = await subscribeToNostrEvents(identityApi, filters, async (decrypted) => {
						let parsed: unknown;
						try { parsed = JSON.parse(decrypted); } catch { /* noop */ }
						if (!parsed) return;

						const data = await processRemoteDoc(parsed);

						if (data && !listenerApi.signal.aborted) {

							if (data.doc_type === "doc/shockwallet/identity_") {
								listenerApi.dispatch(identityActions.applyRemoteIdentity({ remote: data }))
							} else {
								listenerApi.dispatch(sourcesActions.applyRemoteSource({ sourceId: data.source_id, remote: data }));
							}
						}
					});

					listenerApi.signal.addEventListener("abort", () => subCloser.close(), { once: true });

					await listenerApi.take(() => false); // block. take reacts to cancel from lifecycle
				}
			})
	]
}
