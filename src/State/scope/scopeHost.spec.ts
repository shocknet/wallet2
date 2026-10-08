import { combineReducers, createSlice, type PayloadAction, type Reducer, type ReducersMapObject } from "@reduxjs/toolkit";
import { createMigrate, persistReducer, REHYDRATE } from "redux-persist";
import { describe, expect, it, vi } from "vitest";
import { makeScopedPersistedReducer } from "./buildPersistedScopedReducer";
import { memoryStorage, type MemoryStorage } from "@tests/support/memoryStorage";
import { createStore } from "../store/createStore";
import { ScopeRestoreError } from "./scopeHost";
import { defineScopedModule, scopedPersistKey, scopedStorageKey, type ScopedReducerContext } from "./scopedModule";

const dataKey = {} as CryptoKey;

const notesSlice = createSlice({
	name: "notes",
	initialState: { text: "" },
	reducers: {
		setText(state, action: PayloadAction<string>) {
			state.text = action.payload;
		},
	},
});
const { setText } = notesSlice.actions;

const labelsSlice = createSlice({
	name: "labels",
	initialState: { name: "" },
	reducers: {
		setLabel(state, action: PayloadAction<string>) {
			state.name = action.payload;
		},
	},
});
const { setLabel } = labelsSlice.actions;

function testModule(name: string, reducer: Reducer, storage: MemoryStorage) {
	return defineScopedModule({
		persistBaseKey: name,
		createReducer: ({ scopeId }) => makeScopedPersistedReducer(reducer, name, scopeId, { storage }),
	});
}

function openScope(options?: {
	storage?: MemoryStorage;
	createScopedReducer?: (context: ScopedReducerContext) => {
		reducer: Reducer;
		persistKeys: readonly string[];
	};
	reducers?: ReducersMapObject;
}) {
	const storage = options?.storage ?? memoryStorage();
	const notes = testModule("notes", notesSlice.reducer, storage);
	const labels = testModule("labels", labelsSlice.reducer, storage);
	const created = createStore({
		reducers: options?.reducers ?? {},
		createScopedReducer: options?.createScopedReducer ?? ((context) => ({
			reducer: combineReducers({
				notes: notes.createReducer(context),
				labels: labels.createReducer(context),
			}),
			persistKeys: [notes.persistKey(context.scopeId), labels.persistKey(context.scopeId)],
		})),
		storage,
		prependMiddleware: [],
		appendMiddleware: [],
	});
	return {
		storage,
		...created,
		mountScope: (scopeId: string) => created.mountScope({ scopeId, dataKey }),
	};
}

type MountedScope = {
	notes: { text: string };
	labels: { name: string };
};

function mountedScope(scoped: unknown): MountedScope {
	if (scoped === null || typeof scoped !== "object") throw new Error("scope is not mounted");
	return scoped as MountedScope;
}

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRehydrate(action: unknown): action is { type: string; key: string } {
	return typeof action === "object"
		&& action !== null
		&& "type" in action
		&& "key" in action
		&& (action as { type: unknown }).type === REHYDRATE
		&& typeof (action as { key: unknown }).key === "string";
}

describe("scope host", () => {
	it("mounts each module at its initial state when nothing is stored", async () => {
		const { store, mountScope } = openScope();
		await mountScope("alice");
		const scoped = mountedScope(store.getState().scoped);
		expect(scoped.notes.text).toBe("");
		expect(scoped.labels.name).toBe("");
	});

	it("keeps an unsaved draft when mounting the scope that is already active", async () => {
		const { store, mountScope } = openScope();
		await mountScope("alice");
		store.dispatch(setText("draft"));
		await mountScope("alice");
		expect(mountedScope(store.getState().scoped).notes.text).toBe("draft");
	});

	it("restores each module when switching away and back", async () => {
		const { store, mountScope } = openScope();
		await mountScope("alice");
		store.dispatch(setText("hello"));
		store.dispatch(setLabel("home"));
		await mountScope("bob");
		expect(mountedScope(store.getState().scoped).notes.text).toBe("");
		expect(mountedScope(store.getState().scoped).labels.name).toBe("");
		await mountScope("alice");
		expect(mountedScope(store.getState().scoped).notes.text).toBe("hello");
		expect(mountedScope(store.getState().scoped).labels.name).toBe("home");
	});

	it("runs queued switches one after another", async () => {
		const { store, mountScope } = openScope();
		await mountScope("alice");
		store.dispatch(setText("hello"));
		const toBob = mountScope("bob");
		const toCarol = mountScope("carol");
		await toBob;
		await toCarol;
		expect(mountedScope(store.getState().scoped).notes.text).toBe("");
		await mountScope("alice");
		expect(mountedScope(store.getState().scoped).notes.text).toBe("hello");
	});

	it("leaves storage untouched and stays empty when the first mount cannot rehydrate", async () => {
		const storage = memoryStorage();
		const notesKey = scopedStorageKey("notes", "bob");
		await storage.setItem(notesKey, "not-json");
		const { store, persistor, mountScope } = openScope({ storage });

		await expect(mountScope("bob")).rejects.toBeInstanceOf(ScopeRestoreError);
		expect(store.getState().scoped).toBeNull();
		await persistor.flush();
		expect(await storage.getItem(notesKey)).toBe("not-json");
		expect(storage.snapshot()[scopedStorageKey("labels", "bob")]).toBeUndefined();
	});

	it("restores the previous scope when a switch cannot rehydrate", async () => {
		const storage = memoryStorage();
		const { store, persistor, mountScope } = openScope({ storage });
		await mountScope("alice");
		store.dispatch(setText("hello"));
		store.dispatch(setLabel("home"));
		const notesKey = scopedStorageKey("notes", "bob");
		await storage.setItem(notesKey, "not-json");

		const error = await mountScope("bob").then(() => {
			throw new Error("switch should have failed");
		}, (reason: unknown) => reason);

		expect(error).toBeInstanceOf(ScopeRestoreError);
		expect((error as ScopeRestoreError).failures.map((failure) => failure.key)).toEqual([scopedPersistKey("notes", "bob")]);
		const scoped = mountedScope(store.getState().scoped);
		expect(scoped.notes.text).toBe("hello");
		expect(scoped.labels.name).toBe("home");
		await persistor.flush();
		expect(await storage.getItem(notesKey)).toBe("not-json");
		expect(storage.snapshot()[scopedStorageKey("labels", "bob")]).toBeUndefined();
	});

	it("mounts a later scope after a failed first mount", async () => {
		const storage = memoryStorage();
		await storage.setItem(scopedStorageKey("notes", "bob"), "not-json");
		const { store, mountScope } = openScope({ storage });
		await expect(mountScope("bob")).rejects.toBeInstanceOf(ScopeRestoreError);
		await mountScope("alice");
		expect(mountedScope(store.getState().scoped).notes.text).toBe("");
	});

	it("treats a migration failure as a rehydrate error and does not write storage", async () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			const storage = memoryStorage();
			const key = scopedStorageKey("notes", "bob");
			const stored = JSON.stringify({
				text: JSON.stringify("hello"),
				_persist: JSON.stringify({ version: -1, rehydrated: true }),
			});
			await storage.setItem(key, stored);
			const broken = defineScopedModule({
				persistBaseKey: "notes",
				createReducer: ({ scopeId }) => makeScopedPersistedReducer(
					notesSlice.reducer,
					"notes",
					scopeId,
					{
						storage,
						version: 1,
						migrate: createMigrate({
							1: () => {
								throw new Error("bad migrate");
							},
						}),
					},
				),
			});
			const { store, persistor, mountScope } = openScope({
				storage,
				createScopedReducer: (context) => ({
					reducer: combineReducers({
						notes: broken.createReducer(context),
					}),
					persistKeys: [broken.persistKey(context.scopeId)],
				}),
			});
			await expect(mountScope("bob")).rejects.toBeInstanceOf(ScopeRestoreError);
			expect(store.getState().scoped).toBeNull();
			await persistor.flush();
			expect(await storage.getItem(key)).toBe(stored);
		} finally {
			consoleError.mockRestore();
		}
	});

	it("rehydrates the next scope outside the store", async () => {
		const storage = memoryStorage();
		const prefsSlice = createSlice({
			name: "prefs",
			initialState: { theme: "dark" },
			reducers: {
				setTheme(state, action: PayloadAction<string>) {
					state.theme = action.payload;
				},
			},
		});
		const { store, mountScope } = openScope({
			storage,
			reducers: {
				prefs: persistReducer({ key: "prefs", storage, timeout: 50 }, prefsSlice.reducer),
			},
		});
		await mountScope("alice");
		await delay(80);
		const keys: string[] = [];
		const dispatch = store.dispatch;
		store.dispatch = ((action: unknown) => {
			if (isRehydrate(action)) keys.push(action.key);
			return dispatch(action as never);
		}) as typeof store.dispatch;

		await mountScope("bob");
		await delay(80);
		expect(keys).toEqual([]);
		expect(mountedScope(store.getState().scoped).notes.text).toBe("");
		expect(mountedScope(store.getState().scoped).labels.name).toBe("");
	});

	it("rejects an empty scope id", async () => {
		const { mountScope } = openScope();
		await expect(mountScope(" ")).rejects.toThrow(/scope id/);
	});
});
