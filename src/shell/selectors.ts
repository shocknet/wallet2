import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/State/store/store";
import type { ShellSnapshot } from "./types";
import { resolveShellPhase } from "./resolveShellPhase";
import { selectActiveIdentity, selectIdentities } from "@/State/identitiesRegistry/slice";


export const selectIdentityCount = createSelector(
	selectIdentities,
	identities => identities.length,
);

export const selectIdentityExists = (
	state: RootState,
	identityId: string,
) =>
	selectIdentities(state).some(
		identity => identity.pubkey === identityId,
	);

export const selectMigrationStatus = (
	state: RootState,
) => state.shell.migration;

export const selectStartupStatus = (
	state: RootState,
) => state.shell.startupIdentity;

export const selectIdentitySession = (
	state: RootState,
) => state.shell.identitySession;


export const selectPushIntent = (
	state: RootState,
) => state.shell.pushIntent;

export const selectPendingNav = (
	state: RootState,
) => state.shell.pendingNav;

export const selectShellSnapshot = createSelector(
	[
		selectMigrationStatus,
		selectStartupStatus,
		selectIdentitySession,
		selectIdentityCount,
		selectActiveIdentity
	],
	(
		migration,
		startupIdentity,
		identitySession,
		identityCount,
		activeIdentity,
	): ShellSnapshot => ({
		migration,
		startupIdentity,
		identitySession,
		identityCount,
		activeIdentity,
	}),
);

export const selectAppPhase = createSelector(
	selectShellSnapshot,
	resolveShellPhase,
);
