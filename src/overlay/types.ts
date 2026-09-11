import type { ReactNode } from "react";
import type { useIonModal } from "@ionic/react";

/** `useIonModal` present options: core `ModalOptions` plus React lifecycle callbacks. */
export type OverlayOptions = NonNullable<
	Parameters<ReturnType<typeof useIonModal>[0]>[0]
>;

export type OverlayResult<TRole extends string, TData = never> =
	[TData] extends [never]
		? { role: TRole }
		: { role: TRole; data: TData };

export type OverlayChoice<TData = never> =
	| OverlayResult<"confirm", TData>
	| OverlayResult<"cancel">;

export type Dismiss<T> = (result: T) => void;

export function overlayRole(result: unknown): string | undefined {
	if (
		result !== null
		&& typeof result === "object"
		&& "role" in result
		&& typeof result.role === "string"
	) {
		return result.role;
	}
	return undefined;
}

/** Backdrop, gesture, keyboard, and other Ionic closes have no typed result. */
export function overlayDismissResult(data: unknown): unknown {
	if (overlayRole(data) !== undefined) return data;
	return { role: "cancel" };
}

export function allowOverlayRoles(
	...roles: string[]
): NonNullable<OverlayOptions["canDismiss"]> {
	return (_data, role) => Promise.resolve(role != null && roles.includes(role));
}

export type PresentOutcome<T> =
	| { status: "dismissed"; value: T }
	| { status: "skipped" };

export type Present = <T>(
	render: (dismiss: Dismiss<T>) => ReactNode,
	overlay?: OverlayOptions,
) => Promise<T>;

export type TryPresent = <T>(
	render: (dismiss: Dismiss<T>) => ReactNode,
	overlay?: OverlayOptions,
) => Promise<PresentOutcome<T>>;

export function isDismissed<T>(
	outcome: PresentOutcome<T>,
): outcome is { status: "dismissed"; value: T } {
	return outcome.status === "dismissed";
}

export function isConfirm<TData = never>(
	result: OverlayChoice<TData>,
): result is OverlayResult<"confirm", TData> {
	return result.role === "confirm";
}
