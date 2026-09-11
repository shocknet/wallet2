import { useAppSelector } from "@/State/store/hooks";
import { selectSourceViews } from "@/State/scoped/backups/sources/selectors";
import type { RuntimeIdentity } from "./types";
import { ReadyApp } from "./ReadApp";
import SourceBootstrapScreen from "./screens/SourceBootstrapScreen";


export function LoadedIdentity({
	runtimeIdentity,
}: {
	runtimeIdentity: RuntimeIdentity;
}) {
	const sourceCount = useAppSelector(selectSourceViews).length;

	if (sourceCount === 0) {
		return <SourceBootstrapScreen />;
	}

	return <ReadyApp runtimeIdentity={runtimeIdentity} />;
}
