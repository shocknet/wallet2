import store, { type RootState } from "@/State/store/store";
import { identitiesSelectors, selectActiveIdentityId } from "@/State/identitiesRegistry/slice";
import { docsSelectors, getScopedSourcesPersistKey, metadataSelectors } from "@/State/scoped/backups/sources/slice";
import IonicStorageAdapter from "@/storage/redux-persist-ionic-storage-adapter";
import { SourceType } from "@/State/scoped/common";
import { SourceDocEntity, SourcesState } from "@/State/scoped/backups/sources/state";
import { MetaForNprofile } from "@/State/scoped/backups/sources/metadata/types";

type TopicResolution = {
	identityId: string;
	sourceId: string;
	privateKey: string;
};

const getPersistedSlice = (raw: SourcesState | null) => {
	if (!raw) return {};
	return {
		docs: raw.docs.entities,
		metadata: raw.metadata.entities
	};
};

const findSourceInIdentityByTopicId = (
	identityId: string,
	docs: Record<string, SourceDocEntity> | undefined,
	metadata: Record<string, MetaForNprofile> | undefined,
	topicId: string
): TopicResolution | null => {
	if (!docs || !metadata) return null;
	for (const [sourceId, meta] of Object.entries(metadata)) {
		if (!meta || meta.topicId !== topicId) continue;
		const doc = docs[sourceId]?.draft;
		if (!doc || doc.type !== SourceType.NPROFILE_SOURCE) continue;
		const privateKey = doc.keys.privateKey;
		return { identityId, sourceId, privateKey };
	}
	return null;
};

export async function resolveTopicTarget(
	topicId: string,
	state: RootState = store.getState()
): Promise<TopicResolution | null> {
	if (!topicId) {
		console.log("[Push] resolveTopicTarget: missing topicId");
		return null;
	}

	console.log("[Push] resolveTopicTarget: start", { topicId });

	const activeIdentityId = selectActiveIdentityId(state);
	console.log("[Push] resolveTopicTarget: active identity", { activeIdentityId });

	// If there is a loaded identity check if the addressed source is in it
	if (activeIdentityId && state.scoped?.sources) {
		const docs = docsSelectors.selectEntities(state);
		const metadata = metadataSelectors.selectEntities(state);
		const match = findSourceInIdentityByTopicId(activeIdentityId, docs, metadata, topicId);
		if (match) {
			console.log("[Push] resolveTopicTarget: match in active identity", {
				identityId: activeIdentityId,
				sourceId: match.sourceId
			});
			return match;
		}
	}

	// Search for the source in other identities
	const allIdentityIds = identitiesSelectors.selectIds(state);
	console.log("[Push] resolveTopicTarget: scanning persisted identities", {
		count: allIdentityIds.length
	});
	const persistedMatch = await findInPersistedIdentities(
		allIdentityIds,
		activeIdentityId,
		topicId
	);
	if (persistedMatch) return persistedMatch;

	console.log("[Push] resolveTopicTarget: no match", { topicId });
	return null;
}

async function findInPersistedIdentities(
	identityIds: Array<string | number>,
	activeIdentityId: string | null,
	topicId: string
): Promise<TopicResolution | null> {
	const tasks = identityIds
		.filter((identityId) => identityId !== activeIdentityId)
		.map(async (identityId) => {
			const identityKey = String(identityId);
			const key = "persist:" + getScopedSourcesPersistKey(identityKey);
			console.log("[Push] resolveTopicTarget: checking persisted sources", { identityId: identityKey, key });
			const stored = await IonicStorageAdapter.getItem(key);
			if (!stored) {
				console.log("[Push] resolveTopicTarget: no persisted sources", { identityId: identityKey });
				throw new Error("no persisted sources");
			}
			console.log({ stored })
			let parsed: SourcesState | null = null;
			try {
				parsed = parseReduxPersist(stored) as any as SourcesState;
			} catch {
				parsed = null;
			}
			if (!parsed) {
				console.log("[Push] resolveTopicTarget: failed to parse persisted sources", { identityId: identityKey });
				throw new Error("failed to parse persisted sources");
			}
			const { docs, metadata } = getPersistedSlice(parsed);
			const match = findSourceInIdentityByTopicId(identityKey, docs, metadata, topicId);
			if (!match) throw new Error("no match");
			console.log("[Push] resolveTopicTarget: match in persisted identity", {
				identityId: identityKey,
				sourceId: match.sourceId
			});
			return match;
		});

	if (!tasks.length) return null;
	try {
		return await Promise.any(tasks);
	} catch {
		return null;
	}
}

export type ReduxPersistRaw = Record<string, unknown>;
export type ReduxPersistParsed = Record<string, unknown>;

export function parseReduxPersist(serialized: string) {
	const outer = JSON.parse(serialized) as ReduxPersistRaw;

	const out: ReduxPersistParsed = {};
	for (const [key, value] of Object.entries(outer)) {

		if (typeof value === "string") {
			try {
				out[key] = JSON.parse(value);
			} catch {

				out[key] = value;
			}
		} else {

			out[key] = value;
		}
	}
	return out;
}
