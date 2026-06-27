import { useCallback } from "react";
import { useAppDispatch } from "@/State/store/hooks";
import store from "@/State/store/store";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { switchIdentity } from "@/State/identitiesRegistry/thunks";
import { docsSelectors } from "@/State/scoped/backups/sources/slice";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import { useUnlockIdentity } from "@/lib/hooks/useUnlockIdentity";

import { decryptPushPayload, toPushRouteIntent } from "./pushRouting";
import { clearIdenityIntent, IdentityIntent } from "./identityActivationBus";
import dLogger from "@/Api/helpers/debugLog";
import { setPendingNav } from "./pendingNav";
import { selectIsAppBootstrapped } from "@/State/appState/slice";


function resolveActiveSourcePrivateKey(sourceId: string): string | null {
	const state = store.getState();
	const sourceEntity = docsSelectors.selectById(state, sourceId);
	if (!sourceEntity) return null;
	const draft = sourceEntity.draft;
	if (!draft || draft.type !== SourceType.NPROFILE_SOURCE) return null;
	return draft.keys.privateKey;
}

const log = dLogger.withContext({ component: "identity-activation" });

export function useIdentityActivation() {
	const dispatch = useAppDispatch();
	const { prepareWithUi: unlockWithUi } = useUnlockIdentity();



	const handleIdentityIntent = useCallback(async (intent: IdentityIntent) => {
		const activeIdentity = selectActiveIdentity(store.getState());
		const isBoot = selectIsAppBootstrapped(store.getState());

		// if not target identity, unlock and switch first
		if (intent.identityId !== activeIdentity?.pubkey) {
			const storedIdentity = store.getState().identitiesRegistry.entities[intent.identityId];
			if (!storedIdentity) {
				log.error("target-identity-does-not-exist", { data: { identityId: intent.identityId } });
				clearIdenityIntent();
				return;
			}
			try {
				const unlocked = await unlockWithUi(storedIdentity);
				await dispatch(switchIdentity(unlocked, isBoot));
			} catch (error) {
				log.error("failed-to-unlock-target-identity", { data: { identityId: intent.identityId, error: error instanceof Error ? error.message : String(error) } });
				clearIdenityIntent();
				return;
			}
		}


		if (!intent.push) { // if no push intent, then we are done. clear intent
			clearIdenityIntent();
			return;
		}


		try {
			const privateKey = resolveActiveSourcePrivateKey(intent.push.sourceId);
			if (!privateKey) throw new Error("Unable to resolve source private key for pending push envelope");

			const payload = decryptPushPayload({
				privateKey,
				appNpubHex: intent.push.envelope.app_npub_hex,
				encryptedPayload: intent.push.envelope.encrypted_payload,
			});
			if (!payload) throw new Error("Failed to decrypt pending push envelope payload");
			const route = toPushRouteIntent({
				payload,
				sourceId: intent.push.sourceId,
			});
			setPendingNav({
				identityId: intent.identityId,
				path: route.path,
				state: route.state,
			});
		} catch (error) {
			log.error("failed-to-process-push-intent", {
				data: {
					identityId: intent.identityId,
					sourceId: intent.push.sourceId,
					error: error instanceof Error ? error.message : String(error),
				},
			});
		} finally {
			clearIdenityIntent();
		}
	}, [unlockWithUi, dispatch]);

	return handleIdentityIntent;
}

