import { useIonModal } from "@ionic/react";
import { useCallback, useMemo, useRef } from "react";
import type { ComponentType } from "react";

export type ModalDismissRole = "cancel" | "confirm";

export type ModalDismiss<TResult> = (
	data: TResult | null,
	role: ModalDismissRole
) => void;




export function useAskModal<TOptions extends object, TResult>(
	Modal: ComponentType<TOptions & { dismiss: ModalDismiss<TResult> }>,
	modalClass?: string
) {
	const optionsRef = useRef<TOptions>({} as TOptions);
	const modalRef = useRef(Modal);
	modalRef.current = Modal;

	const dismissRef = useRef<(data?: TResult | null, role?: string) => void>(() => {});

	const Host = useMemo(
		() =>
			function AskModalHost() {
				const ModalComponent = modalRef.current;
				const dismiss: ModalDismiss<TResult> = (data, role) => {
					dismissRef.current(data, role);
				};
				return <ModalComponent {...optionsRef.current} dismiss={dismiss} />;
			},
		[]
	);

	const [present, dismissOverlay] = useIonModal(Host);
	dismissRef.current = dismissOverlay;

	return useCallback(
		(options: TOptions): Promise<TResult | null> =>
			new Promise((resolve) => {
				optionsRef.current = options;
				present({
					cssClass: modalClass,
					onDidDismiss: (event) => {
						resolve(
							event.detail.role === "confirm" ? (event.detail.data ?? null) : null
						);
					},
				});
			}),
		[present, modalClass]
	);
}
