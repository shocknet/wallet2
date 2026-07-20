import { selectAppPhase } from "./selectors";
import { useAppSelector } from "@/State/store/hooks";
import { DeviceToIdentitiesMigrationFailedScreen } from "./screens/DeviceToIdentitiesMigrationFailedScreen";
import { SecureIdentitiesMigrationFailedScreen } from "./screens/SecureIdentitiesMigrationFailedScreen";
import { SanctumReauthScreen } from "./screens/SanctumReauthScreen";
import { LoadingIdentityScreen } from "./screens/LoadingIdentityScreen";
import { IdentityLoadFailedScreen } from "./screens/IdentityLoadFailedScreen";
import { ReadyApp } from "./ReadApp";
import { UnlockIdentityScreen } from "./screens/UnlockIdentityScreen";
import { IdentityGate } from "./screens/identityGate";
import { StartupScreen } from "./screens/StartupScreen";
import { ShellEffects } from "./ShellEffects";

export function AppShell() {
	const phase = useAppSelector(selectAppPhase);

	return (
		<>
			<ShellEffects />
			<AppShellPhase phase={phase} />
		</>
	);
}

function AppShellPhase({
	phase,
}: {
	phase: ReturnType<typeof selectAppPhase>;
}) {
	switch (phase.kind) {
		case "starting-up":
			return <StartupScreen />;

		case "device-to-identities-migration-failed":
			return (
				<DeviceToIdentitiesMigrationFailedScreen
					failure={phase.failure}
				/>
			);

		case "secure-identities-migration-failed":
			return (
				<SecureIdentitiesMigrationFailedScreen
					failure={phase.failure}
				/>
			);

		case "identity-gate":
			return (
				<IdentityGate
					initialView={phase.initialView}
				/>
			);

		case "unlocking-identity":
			return (
				<UnlockIdentityScreen
					identityId={phase.identityId}
					reason={phase.reason}
				/>
			);

		case "sanctum-reauth":
			return (
				<SanctumReauthScreen
					runtimeIdentity={phase.runtimeIdentity}
					reason={phase.reason}
				/>
			);

		case "loading-identity":
			return (
				<LoadingIdentityScreen
					identityId={phase.identityId}
				/>
			);

		case "identity-load-failed":
			return (
				<IdentityLoadFailedScreen
					identityId={phase.identityId}
					message={phase.message}
				/>
			);

		case "ready":
			return (
				<ReadyApp
					runtimeIdentity={phase.runtimeIdentity}
				/>
			);
	}
}
