import {
	CapacitorBarcodeScanner,
	CapacitorBarcodeScannerAndroidScanningLibrary,
	CapacitorBarcodeScannerCameraDirection,
	CapacitorBarcodeScannerTypeHint
} from "@capacitor/barcode-scanner";



// Mobile scanning
export async function scanSingleBarcode(instruction: string): Promise<string> {
	return new Promise((resolve, reject) => {
		CapacitorBarcodeScanner.scanBarcode({
			hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
			scanInstructions: " " + instruction,
			cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
			android: {
				scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT
			},
			web: {
				scannerFPS: 10
			}

		}).then(result => {
			resolve(result.ScanResult.toLowerCase())
		}).catch(err => {
			reject(new Error(err?.message || "Error when scanning qr code"));
		})

	})
}
