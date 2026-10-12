import { createAction, type Reducer } from "@reduxjs/toolkit";
import { PERSIST, REHYDRATE, type Persistor, type Storage } from "redux-persist";


export type ScopeSession = {
	scopeId: string;
};

export const scopeCommitted = createAction("@@scope/commit");

export type ScopedReducerBundle<R extends Reducer> = {
	reducer: R;
	persistKeys: readonly string[];
};

export type ScopeRehydrateFailure = {
	key: string;
	error: unknown;
};

export class ScopeRestoreError extends Error {
	readonly failures: readonly ScopeRehydrateFailure[];

	constructor(failures: readonly ScopeRehydrateFailure[]) {
		super("Failed to restore this scope");
		this.name = "ScopeRestoreError";
		this.failures = failures;
	}
}

type PersistBoot = {
	type: typeof PERSIST;
	register: (key: string) => void;
	rehydrate: (key: string, payload: unknown, err?: unknown) => void;
};

type HostStore = {
	dispatch: (action: unknown) => unknown;
};

type BootReport = {
	key: string;
	payload: unknown;
	error?: unknown;
};


export function createScopeHost<Session extends ScopeSession, R extends Reducer>(
	createScopedReducer: (context: Session & { storage: Storage }) => ScopedReducerBundle<R>,
	storage: Storage,
) {
	type ScopedState = ReturnType<R>;
	type ScopedHostState = ScopedState | null;
	let activeReducer: R | null = null;
	let activeScopeId: string | null = null;
	let pendingCommit: ScopedHostState = null;
	let queue: Promise<void> = Promise.resolve();

	const reducer: Reducer<ScopedHostState> = (state = null, action) => {
		if (scopeCommitted.match(action)) return pendingCommit;
		if (!activeReducer || state === null) return state ?? null;
		return activeReducer(state, action);
	};

	function boot(stagingReducer: R, persistKeys: readonly string[]): Promise<{ state: ScopedState; failures: ScopeRehydrateFailure[] }> {
		const pending = new Set(persistKeys);
		const reports: BootReport[] = [];
		let staged: unknown;
		return new Promise((resolve, reject) => {
			const persistAction: PersistBoot = {
				type: PERSIST,
				register() {
					return undefined;
				},
				rehydrate(key, payload, err) {
					if (!pending.has(key)) return;
					pending.delete(key);
					reports.push(err == null ? { key, payload } : { key, payload, error: err });
					if (pending.size > 0) return;
					const failures = reports.flatMap((report) => (
						report.error === undefined ? [] : [{ key: report.key, error: report.error }]
					));
					// An error REHYDRATE marks the slice rehydrated with empty state and
					// writes that over the stored bytes. Apply none of them unless every
					// slice loaded, so a failed slice cannot be saved and a sibling cannot
					// be written on its own.
					if (failures.length === 0) {
						for (const report of reports) {
							staged = stagingReducer(staged as ScopedState | undefined, {
								type: REHYDRATE,
								key: report.key,
								payload: report.payload,
								err: undefined,
							} as never);
						}
					}
					resolve({ state: staged as ScopedState, failures });
				},
			};
			try {
				staged = stagingReducer(undefined, persistAction);
			} catch (error) {
				reject(error);
			}
		});
	}

	async function mountInternal(store: HostStore, persistor: Persistor, session: Session) {
		if (session.scopeId.trim() === "") throw new Error("A scope id is required");
		if (session.scopeId === activeScopeId) return;
		if (activeReducer) await persistor.flush().catch(() => { });

		const scoped = createScopedReducer({ ...session, storage });
		const staged = await boot(scoped.reducer, scoped.persistKeys);
		if (staged.failures.length > 0) throw new ScopeRestoreError(staged.failures);

		activeReducer = scoped.reducer;
		pendingCommit = staged.state;
		activeScopeId = session.scopeId;
		store.dispatch(scopeCommitted());
	}

	function mount(store: HostStore, persistor: Persistor, session: Session) {
		const run = queue.then(() => mountInternal(store, persistor, session));
		queue = run.then(() => undefined, () => undefined);
		return run;
	}

	return { reducer, mount };
}
