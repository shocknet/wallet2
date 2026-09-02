import { describe, expect, it, vi } from "vitest";
import { createAction, TaskAbortError } from "@reduxjs/toolkit";
import { identitiesRegistryActions } from "@/State/identitiesRegistry/slice";
import { TEST_RUNTIME_IDENTITY } from "@tests/support/identityFixtures";
import { identityUnloaded, listenerKick } from "../actions";
import { createDeferred } from "@/lib/deferred";
import { makeListenerStore } from "@tests/support/listenerStore";
import type { ListenerSpec } from "./lifecycle";

const ping = createAction("lifecycle/test-ping");

function openStore(specs: ListenerSpec[]) {
	return makeListenerStore({ specs, loadIdentity: false }).store;
}

function loadIdentity(store: ReturnType<typeof openStore>) {
	store.dispatch(identitiesRegistryActions.setActiveIdentityRuntime({
		identity: TEST_RUNTIME_IDENTITY,
	}));
}

async function unload(store: ReturnType<typeof openStore>) {
	const done = createDeferred<void>();
	store.dispatch(identityUnloaded({ deferred: done }));
	await done;
}

function kickSpec(name: string, onKick = vi.fn()) {
	const spec: ListenerSpec = {
		name,
		listeners: [
			(add) =>
				add({
					actionCreator: listenerKick,
					effect: onKick,
				}),
		],
	};
	return { spec, onKick };
}

describe("identity lifecycle", () => {
	it("registers specs and kicks when the runtime identity is set", () => {
		const { spec, onKick } = kickSpec("kicker");
		const store = openStore([spec]);

		expect(onKick).not.toHaveBeenCalled();
		loadIdentity(store);
		expect(onKick).toHaveBeenCalledTimes(1);
	});

	it("does not kick again after the identity unloads", async () => {
		const { spec, onKick } = kickSpec("kicker");
		const store = openStore([spec]);
		loadIdentity(store);
		await unload(store);

		store.dispatch(listenerKick());
		expect(onKick).toHaveBeenCalledTimes(1);
	});

	it("re-subscribes after unload so a new runtime identity kicks again", async () => {
		const { spec, onKick } = kickSpec("kicker");
		const store = openStore([spec]);

		loadIdentity(store);
		await unload(store);
		loadIdentity(store);

		expect(onKick).toHaveBeenCalledTimes(2);
	});

	it("does not register twice if the runtime identity is set again while still loaded", () => {
		const { spec, onKick } = kickSpec("kicker");
		const store = openStore([spec]);

		loadIdentity(store);
		loadIdentity(store);

		expect(onKick).toHaveBeenCalledTimes(1);
	});

	it("kicks every listener in every spec and cancels them on unload", async () => {
		const cancelled = {
			a: createDeferred<void>(),
			b: createDeferred<void>(),
			c: createDeferred<void>(),
		};

		const waitUntilCancelled = (key: keyof typeof cancelled) =>
			(add: Parameters<ListenerSpec["listeners"][number]>[0]) =>
				add({
					actionCreator: listenerKick,
					effect: async (_, listenerApi) => {
						try {
							await listenerApi.take(() => false);
						} catch (err) {
							if (err instanceof TaskAbortError) cancelled[key].resolve();
						}
					},
				});

		const store = openStore([
			{
				name: "one",
				listeners: [waitUntilCancelled("a"), waitUntilCancelled("b")],
			},
			{
				name: "two",
				listeners: [waitUntilCancelled("c")],
			},
		]);

		loadIdentity(store);
		await unload(store);
		await Promise.all([cancelled.a, cancelled.b, cancelled.c]);
	});

	it("runs beforeUnload while spec listeners are still active, then drops them", async () => {
		let pings = 0;
		const store = openStore([
			{
				name: "pinger",
				listeners: [
					(add) =>
						add({
							actionCreator: ping,
							effect: () => {
								pings += 1;
							},
						}),
				],
				beforeUnload: ({ dispatch }) => {
					dispatch(ping());
				},
			},
		]);

		loadIdentity(store);
		expect(pings).toBe(0);

		await unload(store);
		expect(pings).toBe(1);

		store.dispatch(ping());
		expect(pings).toBe(1);
	});

	it("does not resolve identityUnloaded until beforeUnload finishes", async () => {
		const gate = createDeferred<void>();
		let beforeUnloadStarted = false;
		const store = openStore([
			{
				name: "slow",
				listeners: [],
				beforeUnload: () => {
					beforeUnloadStarted = true;
					return gate;
				},
			},
		]);

		loadIdentity(store);

		const done = createDeferred<void>();
		const resolveSpy = vi.spyOn(done, "resolve");
		store.dispatch(identityUnloaded({ deferred: done }));

		await vi.waitFor(() => {
			expect(beforeUnloadStarted).toBe(true);
		});
		expect(resolveSpy).not.toHaveBeenCalled();

		gate.resolve();
		await done;
		expect(resolveSpy).toHaveBeenCalledTimes(1);
	});

	it("still finishes unload when a beforeUnload throws", async () => {
		const { spec, onKick } = kickSpec("kicker");
		const store = openStore([
			{
				...spec,
				beforeUnload: async () => {
					throw new Error("beforeUnload failed");
				},
			},
		]);

		loadIdentity(store);
		await unload(store);

		store.dispatch(listenerKick());
		expect(onKick).toHaveBeenCalledTimes(1);
	});

	it("unloads with no specs", async () => {
		const store = openStore([]);
		loadIdentity(store);
		await unload(store);
	});
});
