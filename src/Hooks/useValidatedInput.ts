import { useState } from "react";

type ValidationResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: string };

type CommitMode = "auto" | "manual";

export function useValidatedInput<TInput>(
	initial: TInput,
	onCommit: (value: TInput) => void,
	validate: (input: TInput) => ValidationResult<TInput>,
	commitMode: CommitMode = "auto",
) {
	const [draft, setDraft] = useState(initial);
	const [isTouched, setIsTouched] = useState(false);

	const result = validate(draft);
	const error = result.ok ? null : result.error;
	const displayedError = isTouched && error ? error : null;

	function onChange(next: TInput) {
		setDraft(next);

		if (commitMode === "auto") {
			const result = validate(next);
			if (result.ok) {
				onCommit(result.value);
			}
		}
	}

	function onBlur() {
		setIsTouched(true);

		if (result.ok) {
			setDraft(result.value);
		}
	}

	function commit(): boolean {
		if (!result.ok) return false;

		onCommit(result.value);
		setDraft(result.value);

		return true;
	}

	function reset() {
		setDraft(initial);
		setIsTouched(false);
	}

	return {
		value: draft,
		error: displayedError,
		isTouched,
		isValid: result.ok,
		onChange,
		onBlur,
		commit,
		reset,
	};
}
