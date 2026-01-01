import type { MetaForNprofile } from "./scoped/backups/sources/metadata/types";
import type { NprofileSourceDocV0, SourceDocV0 } from "./scoped/backups/sources/schema";
import { BEACON_STALE_OLDER_THAN } from "./scoped/backups/sources/state";
import { SourceType } from "./scoped/common";
import { RootState } from "./store/store";
import { docsSelectors } from "./scoped/backups/sources/slice";

export const isNprofileSource = (doc?: SourceDocV0): doc is NprofileSourceDocV0 => !!doc && doc.type === SourceType.NPROFILE_SOURCE;

export const isSourceDeleted = (doc: SourceDocV0) => doc.deleted.value;

export const isSourceExists = (doc: SourceDocV0) => !!doc && !doc.deleted.value;

export const isSourceStale = (meta: MetaForNprofile) => Date.now() - meta.lastSeenAtMs > BEACON_STALE_OLDER_THAN;

export const isNewSourceAddition = (curr: RootState, prev: RootState, sourceId: string) => {
	const prevSource = docsSelectors.selectById(prev, sourceId)?.draft;
	const currSource = docsSelectors.selectById(curr, sourceId)?.draft;

	const justCreated = !isSourceExists(prevSource) && isSourceExists(currSource);

	return justCreated;
}






export class TypedEmitter<Events extends Record<string, any>> {
	private listeners = new Map<keyof Events, Set<(payload: any) => void>>();

	on<K extends keyof Events>(
		event: K,
		fn: (payload: Events[K]) => void,
		opts?: { signal?: AbortSignal }
	): () => void {
		let set = this.listeners.get(event);
		if (!set) {
			set = new Set();
			this.listeners.set(event, set);
		}
		set.add(fn as any);

		const off = () => {
			set!.delete(fn as any);
			if (set!.size === 0) this.listeners.delete(event);
		};

		if (opts?.signal) {
			if (opts.signal.aborted) off();
			else opts.signal.addEventListener("abort", off, { once: true });
		}

		return off;
	}

	emit<K extends keyof Events>(event: K, payload: Events[K]) {
		const set = this.listeners.get(event);
		if (!set) return;

		[...set].forEach((fn) => {
			try {
				(fn as any)(payload);
			} catch (e) {
				console.error("TypedEmitter listener error", e);
			}
		});
	}

	removeAll() {
		this.listeners.clear();
	}
}
