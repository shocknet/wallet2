import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonIcon,
	IonContent,
	IonGrid,
	IonRow,
	IonCol,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import {
	useOverlayCoordinator,
	usePromiseModal,
	type Dismiss,
	type OverlayOptions,
	type OverlayResult,
} from "@/overlay";

export type PwaScannerResult =
	| OverlayResult<"confirm", string>
	| OverlayResult<"error", string>
	| OverlayResult<"cancel">;

export type PwaScannerHandle = {
	start: () => void;
};

type PWAScannerModalProps = {
	instruction: string;
	dismiss: Dismiss<PwaScannerResult>;
};

function scannerOverlay(scannerRef: RefObject<PwaScannerHandle | null>): OverlayOptions {
	return {
		cssClass: "wallet-modal",
		onDidPresent: () => {
			void scannerRef.current?.start();
		},
	};
}

export const PWAScannerModal = forwardRef<PwaScannerHandle, PWAScannerModalProps>(function PWAScannerModal({ instruction, dismiss }, ref) {
	const regionRef = useRef<HTMLDivElement | null>(null);
	const html5Ref = useRef<Html5Qrcode | null>(null);

		const stopScanner = () => {
			if (!html5Ref.current?.isScanning) return;
			html5Ref.current.stop().catch(() => { });
		};

		const handleDidPresent = async () => {
			if (!regionRef.current) return;

			try {
				if (!html5Ref.current) {
					html5Ref.current = new Html5Qrcode(regionRef.current.id, {
						formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
						verbose: false,
					});
				}
				const html5 = html5Ref.current;

				await html5.start(
					{ facingMode: "environment" },
					{
						fps: 4,
						qrbox: (w, h) => {
							const side = Math.floor(Math.min(w, h) / 2);
							return { width: side, height: side };
						},
					},
					(txt) => {
						stopScanner();
						dismiss({ role: "confirm", data: txt });
					},
					() => { },
				);
			} catch (err: unknown) {
				const message = err instanceof Error
					? err.message
					: typeof err === "string"
						? err
						: "Error when starting scanner. Is camera permitted?";
				dismiss({ role: "error", data: message });
			}
		};

	useImperativeHandle(ref, () => ({ start: () => { void handleDidPresent(); } }));

	useEffect(() => () => { stopScanner(); }, []);

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Scan QR Code</IonTitle>
					<IonButtons slot="end">
						<IonButton color="primary" onClick={() => dismiss({ role: "cancel" })}>
							<IonIcon slot="icon-only" icon={closeOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding" scrollY={false}>
				<IonGrid>
					<IonRow>
						<IonCol>
							<p className="text-secondary" style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: 600 }}>{instruction}</p>
						</IonCol>
					</IonRow>
					<IonRow className="ion-justify-content-center ion-align-items-center">
						<IonCol size="12">
							<div
								id="qr-region"
								ref={regionRef}
							/>
						</IonCol>
					</IonRow>
				</IonGrid>
			</IonContent>
		</>
	);
},
);

export function usePwaScannerModal() {
	const { present } = useOverlayCoordinator();
	const scannerRef = useRef<PwaScannerHandle>(null);
	return useCallback(async (instruction = "Align the QR inside the frame") => {
		return present<PwaScannerResult>(
			(dismiss) => <PWAScannerModal ref={scannerRef} instruction={instruction} dismiss={dismiss} />,
			scannerOverlay(scannerRef),
		);
	}, [present]);
}

export function useNestedPwaScannerModal() {
	const scannerRef = useRef<PwaScannerHandle>(null);
	const presentNested = usePromiseModal<
		{ instruction: string },
		PwaScannerResult,
		PwaScannerHandle
	>(PWAScannerModal, scannerOverlay(scannerRef), scannerRef);
	return useCallback(async (instruction = "Align the QR inside the frame") => {
		return presentNested({ instruction });
	}, [presentNested]);
}
