import { useState } from "react";
export type Operation<R = unknown> = () => R;

export type FieldRule<T> = (
	previous: T,
	next: T
) => Operation | null;

export type FieldRules<S> = {
	[K in keyof S]: FieldRule<S[K]>;
};


export function useDraft<S extends object>(
	snapshot: S,
	rules: FieldRules<S>
) {
	const [overrides, setOverrides] = useState<Partial<S>>({});

	let activeOverrides = overrides;
	const operations: Operation[] = [];

	for (const key of Reflect.ownKeys(overrides) as (keyof S)[]) {
		const operation = rules[key](
			snapshot[key],
			overrides[key] as S[typeof key]
		);

		if (operation === null) {
			if (activeOverrides === overrides) {
				activeOverrides = { ...overrides };
			}

			delete activeOverrides[key];
		} else {
			operations.push(operation);
		}
	}

	if (activeOverrides !== overrides) {
		setOverrides(activeOverrides);
	}

	function setField<K extends keyof S>(key: K, value: S[K]) {
		setOverrides(previous => {
			if (
				Object.hasOwn(previous, key) &&
				Object.is(previous[key], value)
			) {
				return previous;
			}

			return { ...previous, [key]: value };
		});
	}

	function discardField(key: keyof S) {
		setOverrides(previous => {
			if (!Object.hasOwn(previous, key)) return previous;

			const next = { ...previous };
			delete next[key];
			return next;
		});
	}

	function reset() {
		setOverrides({});
	}

	return {
		draft: { ...snapshot, ...activeOverrides },
		operations,
		isDirty: operations.length > 0,
		setField,
		discardField,
		reset,
	};
}
