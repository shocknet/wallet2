import { useAppSelector } from "@/State/store/hooks";
import { selectLiveSourceIds } from "@/State/scoped/backups/sources/selectors";
import type { ScopedRuntimeIdentity } from "./types";
import { ReadyApp } from "./ReadApp";
import SourceBootstrapScreen from "./screens/SourceBootstrapScreen";


export function LoadedIdentity({
	runtimeIdentity,
}: {
	runtimeIdentity: ScopedRuntimeIdentity;
}) {
	const sourceCount = useAppSelector(selectLiveSourceIds).length;

	if (sourceCount === 0) {
		return <SourceBootstrapScreen />;
	}

	return <ReadyApp runtimeIdentity={runtimeIdentity} />;
}
