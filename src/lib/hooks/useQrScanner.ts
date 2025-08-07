import { useScanner } from '../contexts/pwaScannerProvider';
import { useToast } from '../contexts/useToast';
import { useCallback } from 'react';
import { isPlatform } from '@ionic/react';
import { BITCOIN_ADDRESS_BASE58_REGEX } from '../regex';


// Native scanning function
async function nativeScan(instruction: string): Promise<string> {
	const {
		CapacitorBarcodeScanner,
		CapacitorBarcodeScannerAndroidScanningLibrary,
		CapacitorBarcodeScannerCameraDirection,
		CapacitorBarcodeScannerTypeHint
	} = await import("@capacitor/barcode-scanner");

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

			/*
			 * Only force lowercase when result scan is not a base58 btc address
			 * Everything else is bech32 encoded and should be lowercased
			*/
			if (!BITCOIN_ADDRESS_BASE58_REGEX.test(result)) {
				result = result.toLowerCase();
			}
			return result;
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
