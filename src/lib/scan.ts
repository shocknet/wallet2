import {
	BarcodeScanner,
	BarcodeFormat,
	LensFacing,
} from '@capacitor-mlkit/barcode-scanning';
import { Html5Qrcode } from 'html5-qrcode';


// Mobile scanning
async function scanSingleBarcode() {
	const cleanup = async () => {
		document.querySelector('body')?.classList.remove('barcode-scanner-modal-active');
		await BarcodeScanner.removeAllListeners();
		await BarcodeScanner.stopScan();

	}
	return new Promise((resolve, reject) => {
		document.querySelector('body')?.classList.add('barcode-scanner-modal-active');
		BarcodeScanner.addListener(
			"barcodeScanned",
			async result => {
				await cleanup();
				resolve(result.barcode.displayValue.toLowerCase());
			}
		)
			.then(() => {
				BarcodeScanner.startScan({ formats: [BarcodeFormat.QrCode], lensFacing: LensFacing.Back })
					.catch(err => {
						cleanup();
						reject(new Error(err?.message || "Error when starting camera"));
					})
			})
			.catch((err: any) => {
				reject(new Error(err?.message || "Error when scanning QR code"));
			})
	})
}
export async function scanMobile(): Promise<string> {
	const { camera } = await BarcodeScanner.checkPermissions();
	if (camera !== "granted") {
		const { camera: result } = await BarcodeScanner.requestPermissions();
		if (result !== "granted") {
			throw new Error("Need camera permissions");
		}
	}
	const bardcode = await scanSingleBarcode() as string;
	return bardcode;
}




// Desktop scanning
export async function scanDesktop(html5QrCode: Html5Qrcode): Promise<string> {
	try {
		const devices = await Html5Qrcode.getCameras();
		if (!devices || devices.length === 0) {
			throw new Error("No cameras found");
		}
	} catch (err: any) {
		throw new Error(err?.message || "Error when getting cameras");
	}



	return new Promise((resolve, reject) => {
		html5QrCode.start(
			{ facingMode: 'environment' },
			{
				fps: 10,
			},
			(decodedText) => {
				resolve(decodedText.toLowerCase())
			},
			(_errorMessage) => { // Non fatal error

			}).catch((err: any) => {
				reject(new Error(err?.message || "Error when starting camera"));
			})
	});
}