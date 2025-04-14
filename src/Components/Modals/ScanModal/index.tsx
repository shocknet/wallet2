import {
	IonButton,
	IonButtons,
	IonCol,
	IonContent,
	IonGrid,
	IonHeader,
	IonIcon,
	IonRow,
	IonText,
	IonTitle,
	IonToolbar
} from "@ionic/react";
import { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { clipboard, closeOutline } from "ionicons/icons";
import "./styles/index.css";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { scanDesktop, scanMobile } from "@/lib/scan";
import { Clipboard } from "@capacitor/clipboard";
import { toast } from "react-toastify";

interface ScanModalProps {
	onScanned: (input: string) => void;
	onError: (error: string) => void;
	isMobile: boolean;
	instructions?: string;
	dismiss: () => void;
}

type ScannerProps = Omit<ScanModalProps, "isMobile">;


const readClipBoard = async () => {
	try {

		const { type, value } = await Clipboard.read();
		if (type === "text/plain") {
			return value;
		}
		toast.error("Clipboard does not contain text");
		return null;
	} catch {
		toast.error("Cannot read clipboard");
		return null;
	}
}


const DesktopScanner = ({ onScanned, onError, instructions, dismiss }: ScannerProps) => {



	useEffect(() => {
		const html5QrCode = new Html5Qrcode("reader");
		scanDesktop(html5QrCode).then(result => {
			onScanned(result);
		}).catch(err => onError(err?.message || "An unknown scanner error occured"));

		return () => {
			html5QrCode.stop();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Scan QR</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={dismiss}>
							<IonIcon icon={closeOutline} slot="icon-only" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<div className="desktop-scanner-wrapper">
				<div id="reader" />
				<IonGrid className="scanner-fields">
					<IonRow style={{ height: "20%" }} className="ion-justify-content-center">
						<IonCol size="auto">
							<IonText color="light" className="ion-text-center " style={{ fontSize: "1rem", display: "block", textShadow: "1px 1px 1px rgba(0, 0, 0, 0.7)" }}>
								{instructions}
							</IonText>
						</IonCol>
					</IonRow>
					<IonRow style={{ height: "60%" }} className="ion-align-items-center ion-justify-content-center">
						<IonCol size="10" className="scan-box" style={{ height: "100%" }}>
							<div className="corner top-left" />
							<div className="corner top-right" />
							<div className="corner bottom-left" />
							<div className="corner bottom-right" />
						</IonCol>
					</IonRow>
					<IonRow style={{ height: "20%" }} className="ion-justify-content-center ion-align-items-end">
						<IonCol size="auto">
							<IonButton color="secondary" onClick={() => {
								console.log("clipboard clicked");
								readClipBoard().then(value => value && onScanned(value))
							}}>
								<IonIcon icon={clipboard} slot="start" />
								Paste from clipboard
							</IonButton>
						</IonCol>
					</IonRow>
				</IonGrid>
			</div>
		</>
	)
}

const MobileScanner = ({ onScanned, onError, instructions }: ScannerProps) => {

	useEffect(() => {
		scanMobile().then(result => {
			onScanned(result);
		}).catch(err => onError(err?.message || "An unknown scanner error occured"));

		// ScanMobile tears down the scanner when it's done,
		// but if user leaves before it's done, we need to clean up
		return () => {
			document.querySelector('body')?.classList.remove('barcode-scanner-modal-active');
			BarcodeScanner.removeAllListeners().then(() => BarcodeScanner.stopScan());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	return (
		<IonContent className="mobile-scanner-wrapper">
			<IonGrid style={{ height: "100%" }}>
				<IonRow style={{ height: "20%" }} className="ion-justify-content-center">
					<IonCol size="auto">
						<IonText color="light" className="ion-text-center " style={{ fontSize: "1rem", display: "block", textShadow: "1px 1px 1px rgba(0, 0, 0, 0.7)" }}>
							{instructions}
						</IonText>
					</IonCol>
				</IonRow>
				<IonRow style={{ height: "60%" }} className="ion-align-items-center ion-justify-content-center">
					<IonCol size="10" className="scan-box">
						<div className="corner top-left" />
						<div className="corner top-right" />
						<div className="corner bottom-left" />
						<div className="corner bottom-right" />
					</IonCol>
				</IonRow>
				<IonRow style={{ height: "20%" }} className="ion-justify-content-center ion-align-items-end">
					<IonCol size="auto">
						<IonButton color="secondary" onClick={() => {
							readClipBoard().then(value => value && onScanned(value))
						}}>
							<IonIcon icon={clipboard} slot="start" />
							Paste from clipboard
						</IonButton>
					</IonCol>
				</IonRow>
			</IonGrid>
		</IonContent>
	);
}


const ScanModal = (props: ScanModalProps) => {
	if (props.isMobile) {
		return <MobileScanner {...props} />
	} else {
		return <DesktopScanner {...props} />
	}
};

export default ScanModal;

