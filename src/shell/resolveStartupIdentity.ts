import type { RootState } from "@/State/store/store";
import {
	selectIdentityByPubkey,
	selectLastActiveIdentityId,
	selectIdentities,
	selectTopicIndexFromRegistry,
} from "../State/identitiesRegistry/slice";
import { selectPushIntent } from "./selectors";
import type { UnlockReason } from "./types";

export type StartupIdentitySource =
	| "push"
	| "last-active"
	| "single";

export type StartupIdentityTarget = {
	identityId: string;
	source: StartupIdentitySource;
	reason: UnlockReason;
};

function resolvePushTarget(
	state: RootState,
): StartupIdentityTarget | null {
	const pushIntent = selectPushIntent(state);
	if (!pushIntent) {
		return null;
	}

	const topicEntry = selectTopicIndexFromRegistry(
		state,
		pushIntent.envelope.topic_id,
	);

	if (!topicEntry) {
		return null;
	}

	if (
		!selectIdentityByPubkey(
			state,
			topicEntry.identityId,
		)
	) {
		return null;
	}

	return {
		identityId: topicEntry.identityId,
		source: "push",
		reason: "push-intent",
	};
}

function resolveLastActiveTarget(
	state: RootState,
): StartupIdentityTarget | null {
	const lastActiveIdentityId =
		selectLastActiveIdentityId(state);

	if (
		!lastActiveIdentityId ||
		!selectIdentityByPubkey(
			state,
			lastActiveIdentityId,
		)
	) {
		return null;
	}

	return {
		identityId: lastActiveIdentityId,
		source: "last-active",
		reason: "last-active",
	};
}

function resolveSingleIdentityTarget(
	state: RootState,
): StartupIdentityTarget | null {
	const identities = selectIdentities(state);

	if (identities.length !== 1) {
		return null;
	}

	return {
		identityId: identities[0].pubkey,
		source: "single",
		reason: "single-identity",
	};
}

export function resolveStartupIdentityTarget(
	state: RootState,
): StartupIdentityTarget | null {
	return (
		resolvePushTarget(state) ??
		resolveLastActiveTarget(state) ??
		resolveSingleIdentityTarget(state)
	);
}
