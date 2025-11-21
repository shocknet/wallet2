import { getNostrClient } from "@/Api/nostr";
import Bridge from "@/Api/bridge";
import { Buffer } from "buffer";
import { finalizeEvent, nip98 } from 'nostr-tools'
import { extractDomainFromUrl } from "@/lib/domain";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { NprofileView, selectSourceViewById } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
import { isAnyOf, TaskAbortError, UnknownAction } from "@reduxjs/toolkit";

import logger from "@/Api/helpers/logger";
import type { ListenerSpec } from "../lifecycle/lifecycle";
import { RootState } from "@/State/store/store";
const { getToken } = nip98

const isBridgeRelated = isAnyOf(
	sourcesActions._createDraftDoc,
	sourcesActions.applyRemoteSource,
	sourcesActions.updateBridgeUrl
)

const LV_IDENTIFIER = "lightning.video";

export const bridgePredicate = (action: UnknownAction, curr: RootState, prev: RootState): boolean => {
	if (!isBridgeRelated(action)) return false;

	const { sourceId } = action.payload;
	const prevSource = prev.scoped!.sources.docs.entities[sourceId];
	const currSource = curr.scoped!.sources.docs.entities[sourceId];

	// If it doesn't exist now, nothing to do
	if (!currSource) return false;

	const currDraft = currSource.draft;
	const prevDraft = prevSource?.draft;

	if (currDraft.type !== SourceType.NPROFILE_SOURCE) return false;

	const justCreated = !prevSource;

	const bridgeChanged =
		prevDraft?.type === SourceType.NPROFILE_SOURCE &&
		prevDraft.bridgeUrl.value !== currDraft.bridgeUrl.value;

	return justCreated || bridgeChanged;
}

export const bridgeListenerSpec: ListenerSpec = {
	name: "bridgeListener",
	listeners: [
		(add) =>
			add({
				predicate: bridgePredicate,
				effect: async (action, listenerApi) => {

					const { sourceId } = action.payload as { sourceId: string };

					const source = selectSourceViewById(
						listenerApi.getState(),
						sourceId
					) as NprofileView;


					if (source.vanityName?.includes(LV_IDENTIFIER)) return; // if this source is from LVs integration, never change its vanityName

					const task = listenerApi.fork(async forkApi => {

						try {
							const nostrClient = await forkApi.pause(getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys));

							const userInfoRes = await forkApi.pause(nostrClient.GetUserInfo());
							if (userInfoRes.status !== "OK") {
								throw new Error(`GetUserInfo failed: ${userInfoRes.reason}`);
							}

							const lnurlPayLinkRes = await forkApi.pause(nostrClient.GetLnurlPayLink());
							if (lnurlPayLinkRes.status !== "OK") {
								throw new Error(`GetUserInfo failed: ${lnurlPayLinkRes.reason}`);
							}



							const bridgeUrl = source.bridgeUrl || userInfoRes.bridge_url;

							if (!bridgeUrl) {
								throw new Error("No bridgeUrl from local source or GetUserInfo response!");
							}


							const payload = { k1: lnurlPayLinkRes.k1, noffer: userInfoRes.noffer };
							const nostrHeader = await forkApi.pause(getToken(`${bridgeUrl}/api/v1/noffer/vanity`, "POST", e => finalizeEvent(e, Buffer.from(source.keys.privateKey, 'hex')), true, payload))
							const bridgeHandler = new Bridge(bridgeUrl, nostrHeader);
							const bridgeRes = await forkApi.pause(bridgeHandler.GetOrCreateNofferName(payload));
							if (bridgeRes.status !== "OK") {
								throw new Error(`GetOrCreateNofferName failed: ${bridgeRes.reason}`);
							}
							const domainName = extractDomainFromUrl(bridgeUrl);

							if (!forkApi.signal.aborted) {
								listenerApi.dispatch(
									sourcesActions.setVanityName({
										sourceId: source.sourceId,
										vanityName: `${bridgeRes.vanity_name}@${domainName}`,
									})
								);
							}
						} catch (err) {
							if (err instanceof TaskAbortError) {
								logger.info(`[${bridgeListenerSpec.name}] cancelled normally`)
							} else if (err instanceof Error) {
								logger.error(`[${bridgeListenerSpec.name}] error: ${err.message}`)
							}

						}

					});


					await task.result;
				},
			})
	]
}

