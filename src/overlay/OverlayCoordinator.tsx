import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	type MutableRefObject,
	type ReactNode,
} from "react";
import { useIonModal } from "@ionic/react";
import {
	overlayDismissResult,
	overlayRole,
	type Dismiss,
	type OverlayOptions,
	type Present,
	type TryPresent,
} from "./types";

type Presentation = {
	id: symbol;
	render: (dismiss: Dismiss<unknown>) => ReactNode;
	resolve: (result: unknown) => void;
};

type OverlayCoordinatorValue = {
	occupied: boolean;
	present: Present;
	tryPresent: TryPresent;
};

const OverlayCoordinatorContext = createContext<OverlayCoordinatorValue | undefined>(undefined);

const SLOT_OCCUPIED = "useOverlayCoordinator.present: overlay slot is occupied";

type OverlaySlotHostProps = {
	presentationRef: MutableRefObject<Presentation | null>;
	dismissRef: MutableRefObject<(data?: unknown, role?: string) => void>;
};

function OverlaySlotHost({
	presentationRef,
	dismissRef,
}: OverlaySlotHostProps) {
	const presentation = presentationRef.current;
	if (!presentation) {
		return null;
	}

	const dismiss: Dismiss<unknown> = (result) => {
		if (presentationRef.current?.id !== presentation.id) {
			return;
		}
		dismissRef.current(result, overlayRole(result));
	};

	return <>{presentation.render(dismiss)}</>;
}

export function useOverlayCoordinator() {
	const ctx = useContext(OverlayCoordinatorContext);
	if (!ctx) {
		throw new Error("useOverlayCoordinator must be used within OverlayCoordinator");
	}
	return ctx;
}

export function OverlayCoordinator({ children }: { children: ReactNode }) {
	const presentationRef = useRef<Presentation | null>(null);
	const dismissRef = useRef<(data?: unknown, role?: string) => void>(() => { });
	const [occupied, setOccupied] = useState(false);

	const hostProps = useMemo<OverlaySlotHostProps>(
		() => ({ presentationRef, dismissRef }),
		[],
	);

	const [presentIonModal, dismissIonModal] = useIonModal(OverlaySlotHost, hostProps);
	dismissRef.current = dismissIonModal;

	const startPresentation = useCallback(
		<T,>(
			render: (dismiss: Dismiss<T>) => ReactNode,
			overlay: OverlayOptions = {},
		): Promise<T> | null => {
			if (presentationRef.current !== null) {
				return null;
			}

			return new Promise<T>((resolve) => {
				const id = Symbol("overlay");
				const presentation: Presentation = {
					id,
					render: (dismiss) => render(dismiss as Dismiss<T>),
					resolve: (result) => resolve(result as T),
				};

				presentationRef.current = presentation;
				setOccupied(true);

				presentIonModal({
					...overlay,
					onDidDismiss: (event) => {
						const active = presentationRef.current;
						if (active === null || active.id !== id) {
							return;
						}
						presentationRef.current = null;
						setOccupied(false);
						active.resolve(overlayDismissResult(event.detail.data));
					},
				});
			});
		},
		[presentIonModal],
	);

	const tryPresent = useCallback<TryPresent>((render, overlay) => {
		const promise = startPresentation(render, overlay);
		if (promise === null) {
			return Promise.resolve({ status: "skipped" });
		}
		return promise.then((value) => ({ status: "dismissed", value }));
	}, [startPresentation]);

	const present = useCallback<Present>((render, overlay) => {
		const promise = startPresentation(render, overlay);
		if (promise === null) {
			return Promise.reject(new Error(SLOT_OCCUPIED));
		}
		return promise;
	}, [startPresentation]);

	const value = useMemo<OverlayCoordinatorValue>(
		() => ({ occupied, present, tryPresent }),
		[occupied, present, tryPresent],
	);

	return (
		<OverlayCoordinatorContext.Provider value={value}>
			{children}
		</OverlayCoordinatorContext.Provider>
	);
}
