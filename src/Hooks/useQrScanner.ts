import { useCallback } from "react";
import { BITCOIN_ADDRESS_BASE58_REGEX } from "../lib/regex";
import { useToast } from "../lib/contexts/useToast";
import {
	useNestedPwaScannerModal,
	usePwaScannerModal,
	type PwaScannerResult,
} from "@/Components/Modals/PWAScannerModal";
import { Capacitor } from "@capacitor/core";

export type QrScanResult = PwaScannerResult;

async function nativeScan(instruction: string): Promise<string> {
	const {
		CapacitorBarcodeScanner,
		CapacitorBarcodeScannerAndroidScanningLibrary,
		CapacitorBarcodeScannerCameraDirection,
		CapacitorBarcodeScannerTypeHint,
	} = await import("@capacitor/barcode-scanner");

	const result = await CapacitorBarcodeScanner.scanBarcode({
		hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
		scanInstructions: " " + instruction,
		cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
		android: {
			scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT,
		},
		web: {
			scannerFPS: 10,
		},
	});
	return result.ScanResult;
}

function normalizeScanned(text: string): string {
	if (!BITCOIN_ADDRESS_BASE58_REGEX.test(text)) {
		return text.toLowerCase();
	}
	return text;
}

function isUserCancel(err: unknown): boolean {
	const message =
		err && typeof err === "object" && "message" in err && typeof err.message === "string"
			? err.message
			: "";
	return /cancell?ed/i.test(message);
}

function errorMessage(err: unknown): string {
	if (err instanceof Error) {
		return err.message || "Error when scanning QR code";
	}
	return "Error when scanning QR code";
}

function useQrScannerWithWebScan(scanWeb: (instruction: string) => Promise<PwaScannerResult>) {
	const { showToast } = useToast();

	const scanSingleBarcode = useCallback(async (instruction: string): Promise<QrScanResult> => {
		let result: PwaScannerResult;
		try {
			if (Capacitor.isNativePlatform()) {
				const scanned = await nativeScan(instruction);
				result = { role: "confirm", data: scanned };
			} else {
				result = await scanWeb(instruction);
			}
		} catch (err: unknown) {
			if (isUserCancel(err)) {
				return { role: "cancel" };
			}
			result = { role: "error", data: errorMessage(err) };
		}

		if (result.role === "confirm") {
			return { role: "confirm", data: normalizeScanned(result.data) };
		}
		if (result.role === "error") {
			showToast({
				message: result.data,
				color: "danger",
			});
		}
		return result;
	}, [scanWeb, showToast]);

	return { scanSingleBarcode };
}

/** Page-level scan. Takes the overlay slot. */
export function useQrScanner() {
	return useQrScannerWithWebScan(usePwaScannerModal());
}

/** Scan on top of an already-open dialog. */
export function useNestedQrScanner() {
	return useQrScannerWithWebScan(useNestedPwaScannerModal());
}
