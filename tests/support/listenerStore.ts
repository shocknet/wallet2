import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice"
import { addIdentityLifecycle, type ListenerSpec } from "@/State/listeners/lifecycle/lifecycle"
import type { IdentityState } from "@/State/scoped/backups/identity/slice"
import type { SourcesState } from "@/State/scoped/backups/sources/state"
import type { BeaconsState } from "@/State/scoped/beacons/state"
import {
	getPreloadedIdentityState,
	TEST_IDENTITY,
	TEST_RUNTIME_IDENTITY,
} from "./identityFixtures"
import { sourcesStateOf, type TestSource } from "./sourcesHelpers"
import { makeTestStore } from "./testStore"

export type MakeListenerStoreOpts = {
	specs: ListenerSpec[];
	sources?: TestSource[] | SourcesState;
	beacons?: BeaconsState;
	identity?: IdentityState;
	/** When true, set the active runtime identity so lifecycle registers `specs` and kicks. */
	loadIdentity?: boolean;
};

function isSourcesState(v: TestSource[] | SourcesState): v is SourcesState {
	return !Array.isArray(v) && "docs" in v && "metadata" in v && "history" in v;
}

export function makeListenerStore(opts: MakeListenerStoreOpts) {
	const sources = opts.sources === undefined
		? undefined
		: isSourcesState(opts.sources)
			? opts.sources
			: sourcesStateOf(opts.sources);

	const identity = opts.identity ?? getPreloadedIdentityState(
		TEST_IDENTITY.pubkey,
		sources?.docs.ids[0],
	);

	const { store, startAppListening } = makeTestStore({
		scoped: {
			identity,
			sources,
			beacons: opts.beacons,
		},
	});

	addIdentityLifecycle(startAppListening, opts.specs);

	store.dispatch(identitiesRegistryActions._createNewIdentity({ identity: TEST_IDENTITY }));

	if (opts.loadIdentity) {
		store.dispatch(identitiesRegistryActions.setActiveIdentityRuntime({ identity: TEST_RUNTIME_IDENTITY }));
	}

	return { store, startAppListening };
}
