
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDraft, type FieldRules } from "./useDraft.js";

type State = {
	label: string;
	enabled: boolean;
};

const INITIAL: State = {
	label: "Alice",
	enabled: true,
};

function setup(snapshot: State = INITIAL) {
	const updateLabel = vi.fn();
	const updateEnabled = vi.fn();

	const rules: FieldRules<State> = {
		label: (previous, next) =>
			Object.is(previous, next)
				? null
				: () => updateLabel(next, previous),

		enabled: (previous, next) =>
			Object.is(previous, next)
				? null
				: () => updateEnabled(next, previous),
	};

	const hook = renderHook(
		({ snapshot }: { snapshot: State }) =>
			useDraft(snapshot, rules),
		{ initialProps: { snapshot } },
	);

	return {
		...hook,
		updateLabel,
		updateEnabled,
	};
}

describe("useDraft", () => {
	it("starts clean and follows snapshot changes", () => {
		const { result, rerender } = setup();

		expect(result.current.draft).toEqual(INITIAL);
		expect(result.current.operations).toEqual([]);
		expect(result.current.isDirty).toBe(false);

		rerender({
			snapshot: { label: "Bob", enabled: false },
		});

		expect(result.current.draft).toEqual({
			label: "Bob",
			enabled: false,
		});
		expect(result.current.isDirty).toBe(false);
	});

	it("collects operations returned by rules without executing them", () => {
		const operation = vi.fn();

		const rules: FieldRules<{ value: number }> = {
			value: (previous, next) =>
				Object.is(previous, next) ? null : operation,
		};

		const { result } = renderHook(() =>
			useDraft({ value: 1 }, rules),
		);

		act(() => {
			result.current.setField("value", 2);
		});

		expect(result.current.draft.value).toBe(2);
		expect(result.current.isDirty).toBe(true);
		expect(result.current.operations).toEqual([operation]);
		expect(operation).not.toHaveBeenCalled();

		result.current.operations[0]();

		expect(operation).toHaveBeenCalledOnce();
	});

	it("supports multiple independent overrides", () => {
		const { result, updateLabel, updateEnabled } = setup();

		act(() => {
			result.current.setField("label", "Bob");
			result.current.setField("enabled", false);
		});

		expect(result.current.draft).toEqual({
			label: "Bob",
			enabled: false,
		});
		expect(result.current.operations).toHaveLength(2);
		expect(result.current.isDirty).toBe(true);

		for (const operation of result.current.operations) {
			operation();
		}

		expect(updateLabel).toHaveBeenCalledExactlyOnceWith(
			"Bob",
			"Alice",
		);
		expect(updateEnabled).toHaveBeenCalledExactlyOnceWith(
			false,
			true,
		);
	});

	it("uses the latest override when a field is edited repeatedly", () => {
		const { result, updateLabel } = setup();

		act(() => {
			result.current.setField("label", "Bob");
			result.current.setField("label", "Charlie");
		});

		expect(result.current.draft.label).toBe("Charlie");
		expect(result.current.operations).toHaveLength(1);

		result.current.operations[0]();

		expect(updateLabel).toHaveBeenCalledExactlyOnceWith(
			"Charlie",
			"Alice",
		);
	});

	it("treats a rule returning null as no pending change", () => {
		const { result, rerender } = setup();

		act(() => {
			result.current.setField("label", "Alice");
		});

		expect(result.current.operations).toEqual([]);
		expect(result.current.isDirty).toBe(false);

		// The override should have been discarded.
		rerender({
			snapshot: { ...INITIAL, label: "Charlie" },
		});

		expect(result.current.draft.label).toBe("Charlie");
	});

	it("preserves overrides while accepting unrelated snapshot changes", () => {
		const { result, rerender } = setup();

		act(() => {
			result.current.setField("label", "Bob");
		});

		rerender({
			snapshot: { label: "Charlie", enabled: false },
		});

		expect(result.current.draft).toEqual({
			label: "Bob",
			enabled: false,
		});
		expect(result.current.operations).toHaveLength(1);
		expect(result.current.isDirty).toBe(true);
	});

	it("plans changes against the latest snapshot", () => {
		const { result, rerender, updateLabel } = setup();

		act(() => {
			result.current.setField("label", "Bob");
		});

		rerender({
			snapshot: { ...INITIAL, label: "Charlie" },
		});

		result.current.operations[0]();

		expect(updateLabel).toHaveBeenCalledExactlyOnceWith(
			"Bob",
			"Charlie",
		);
	});

	it("discards an override when the snapshot catches up", () => {
		const { result, rerender } = setup();

		act(() => {
			result.current.setField("label", "Bob");
		});

		expect(result.current.isDirty).toBe(true);

		rerender({
			snapshot: { ...INITIAL, label: "Bob" },
		});

		expect(result.current.draft.label).toBe("Bob");
		expect(result.current.operations).toEqual([]);
		expect(result.current.isDirty).toBe(false);

		// Verify that the override really was forgotten.
		rerender({
			snapshot: { ...INITIAL, label: "Charlie" },
		});

		expect(result.current.draft.label).toBe("Charlie");
		expect(result.current.isDirty).toBe(false);
	});

	it("reconciles fields independently", () => {
		const { result, rerender } = setup();

		act(() => {
			result.current.setField("label", "Bob");
			result.current.setField("enabled", false);
		});

		expect(result.current.operations).toHaveLength(2);

		// Only label catches up.
		rerender({
			snapshot: { ...INITIAL, label: "Bob" },
		});

		expect(result.current.draft).toEqual({
			label: "Bob",
			enabled: false,
		});
		expect(result.current.operations).toHaveLength(1);
		expect(result.current.isDirty).toBe(true);

		// The reconciled field follows the snapshot again.
		rerender({
			snapshot: { ...INITIAL, label: "Charlie" },
		});

		expect(result.current.draft).toEqual({
			label: "Charlie",
			enabled: false,
		});
		expect(result.current.isDirty).toBe(true);

		// The remaining field catches up.
		rerender({
			snapshot: { label: "Charlie", enabled: false },
		});

		expect(result.current.operations).toEqual([]);
		expect(result.current.isDirty).toBe(false);
	});

	it("does not clear an override merely because its operation executed", () => {
		const { result, rerender, updateLabel } = setup();

		act(() => {
			result.current.setField("label", "Bob");
		});

		result.current.operations[0]();

		expect(updateLabel).toHaveBeenCalledOnce();
		expect(result.current.isDirty).toBe(true);

		// Only the snapshot catching up clears the override.
		rerender({
			snapshot: { ...INITIAL, label: "Bob" },
		});

		expect(result.current.isDirty).toBe(false);
	});

	it("discards an override when edited back to the snapshot value", () => {
		const { result, rerender } = setup();

		act(() => {
			result.current.setField("label", "Bob");
		});

		expect(result.current.isDirty).toBe(true);

		act(() => {
			result.current.setField("label", "Alice");
		});

		expect(result.current.draft.label).toBe("Alice");
		expect(result.current.operations).toEqual([]);
		expect(result.current.isDirty).toBe(false);

		rerender({
			snapshot: { ...INITIAL, label: "Charlie" },
		});

		expect(result.current.draft.label).toBe("Charlie");
	});

	it("discards only the specified field", () => {
		const { result, rerender } = setup();

		act(() => {
			result.current.setField("label", "Bob");
			result.current.setField("enabled", false);
		});

		act(() => {
			result.current.discardField("label");
		});

		expect(result.current.draft).toEqual({
			label: "Alice",
			enabled: false,
		});
		expect(result.current.operations).toHaveLength(1);

		rerender({
			snapshot: { ...INITIAL, label: "Charlie" },
		});

		expect(result.current.draft).toEqual({
			label: "Charlie",
			enabled: false,
		});
	});

	it("resets all overrides to the current snapshot", () => {
		const { result, rerender } = setup();

		act(() => {
			result.current.setField("label", "Bob");
			result.current.setField("enabled", false);
		});

		rerender({
			snapshot: { ...INITIAL, label: "Charlie" },
		});

		act(() => {
			result.current.reset();
		});

		expect(result.current.draft).toEqual({
			label: "Charlie",
			enabled: true,
		});
		expect(result.current.operations).toEqual([]);
		expect(result.current.isDirty).toBe(false);
	});

	it("respects arbitrary field rules rather than using Object.is for reconciliation", () => {
		type CustomState = {
			items: readonly string[];
		};

		const operation = vi.fn();


		const rules: FieldRules<CustomState> = {
			items: (previous, next) =>
				previous.length === next.length
					? null
					: operation,
		};

		const { result, rerender } = renderHook(
			({ snapshot }: { snapshot: CustomState }) =>
				useDraft(snapshot, rules),
			{
				initialProps: {
					snapshot: { items: ["a", "b"] },
				},
			},
		);

		// Different contents, but the rule returns null.
		act(() => {
			result.current.setField("items", ["x", "y"]);
		});

		expect(result.current.isDirty).toBe(false);
		expect(result.current.operations).toEqual([]);

		// Verify that the override was actually discarded.
		rerender({
			snapshot: { items: ["c"] },
		});

		expect(result.current.draft.items).toEqual(["c"]);

		// Now the rule returns an operation.
		act(() => {
			result.current.setField("items", ["c", "d"]);
		});

		expect(result.current.isDirty).toBe(true);
		expect(result.current.operations).toEqual([operation]);
		expect(operation).not.toHaveBeenCalled();
	});

	it("supports undefined as an explicit override", () => {
		type State = {
			value: string | undefined;
		};

		const rules: FieldRules<State> = {
			value: (previous, next) =>
				Object.is(previous, next)
					? null
					: () => { },
		};

		const { result, rerender } = renderHook(
			({ snapshot }: { snapshot: State }) =>
				useDraft(snapshot, rules),
			{
				initialProps: {
					snapshot: { value: "Alice" },
				},
			},
		);

		act(() => {
			result.current.setField("value", undefined);
		});

		expect(result.current.draft.value).toBeUndefined();
		expect(result.current.isDirty).toBe(true);

		rerender({ snapshot: { value: undefined } });

		expect(result.current.isDirty).toBe(false);

		rerender({ snapshot: { value: "Bob" } });

		expect(result.current.draft.value).toBe("Bob");
	});
});
