import { useCallback, useMemo, useRef, type ComponentType, type Ref } from "react";
import { useIonModal } from "@ionic/react";
import {
	overlayDismissResult,
	overlayRole,
	type Dismiss,
	type OverlayOptions,
} from "./types";

export function usePromiseModal<TOptions extends object, TResult, THandle = unknown>(
	Modal: ComponentType<TOptions & { dismiss: Dismiss<TResult> }>,
	overlay?: OverlayOptions,
	instanceRef?: Ref<THandle | null>,
) {
	const optionsRef = useRef<TOptions>({} as TOptions);
	const modalRef = useRef(Modal);
	modalRef.current = Modal;

	const dismissOverlayRef = useRef<(data?: TResult, role?: string) => void>(() => { });

	const Host = useMemo(
		() =>
			function PromiseModalHost() {
				const ModalComponent = modalRef.current;
				const dismiss: Dismiss<TResult> = (result) => {
					dismissOverlayRef.current(result, overlayRole(result));
				};
				return (
					<ModalComponent
						{...optionsRef.current}
						dismiss={dismiss}
						{...(instanceRef != null ? { ref: instanceRef } : {})}
					/>
				);
			},
		[instanceRef],
	);

	const [presentOverlay, dismissOverlay] = useIonModal(Host);
	dismissOverlayRef.current = dismissOverlay;

	return useCallback(
		(options: TOptions): Promise<TResult> =>
			new Promise((resolve) => {
				optionsRef.current = options;
				presentOverlay({
					...overlay,
					onDidDismiss: (event) => {
						resolve(overlayDismissResult(event.detail.data) as TResult);
					},
				});
			}),
		[presentOverlay, overlay],
	);
}
