import {
	CapacitorBarcodeScanner,
	CapacitorBarcodeScannerAndroidScanningLibrary,
	CapacitorBarcodeScannerCameraDirection,
	CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';
import { useScanner } from '../contexts/pwaScannerProvider';
import { useToast } from '../contexts/useToast';
import { useCallback } from 'react';
import { isPlatform } from '@ionic/react';

// Native scanning function
async function nativeScan(instruction: string): Promise<string> {
	const result = await CapacitorBarcodeScanner.scanBarcode({
		hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
		scanInstructions: " " + instruction,
		cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
		android: {
			scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT
		},
		web: {
			scannerFPS: 10
		}

	})
	return result.ScanResult;
}

// Main utility function
export function useQrScanner() {
	const { scanBarcode } = useScanner();
	const { showToast } = useToast();

	const scanSingleBarcode = useCallback(async (instruction: string): Promise<string> => {
		let result = ""
		try {

			if (isPlatform("hybrid")) {
				result = await nativeScan(instruction);
			} else {
				result = await scanBarcode(instruction);
			}
			return result.toLowerCase();
		} catch (err: any) {
			if (err?.message && !err.message.includes("cancelled")) {
				showToast({
					message: err.message || "Error when scanning QR code",
					color: "danger"
				})
			}
			throw err;
		}
	}, [scanBarcode, showToast]);

	return { scanSingleBarcode };
}
