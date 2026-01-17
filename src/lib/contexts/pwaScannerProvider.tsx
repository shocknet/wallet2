import FullSpinner from '@/Components/common/ui/fullSpinner';
import { createContext, lazy, Suspense, useCallback, useContext, useState } from 'react';

const PWAScannerModal = lazy(() => import('@/Components/Modals/PWAScannerModal'));

interface ScannerContextType {
	scanBarcode: (instruction?: string) => Promise<string>;
}

const ScannerContext = createContext<ScannerContextType | null>(null);

export function ScannerProvider({ children }: { children: React.ReactNode }) {
	const [scanConfig, setScanConfig] = useState<{
		instruction: string;
		resolve: (value: string) => void;
		reject: (reason?: any) => void;
	} | null>(null);

	const [loadedPwaScannerModal, setLoadedPwaScannerModal] = useState(false);

	const scanBarcode = useCallback((instruction = 'Align the QR inside the frame') => {
		if (!loadedPwaScannerModal) {
			setLoadedPwaScannerModal(true);
		}
		return new Promise<string>((resolve, reject) => {
			setScanConfig({ instruction, resolve, reject });
		});
	}, [loadedPwaScannerModal]);

	const handleResult = (result: string) => {
		scanConfig?.resolve(result.toLowerCase());
		setScanConfig(null);
	};

	const handleCancel = () => {
		scanConfig?.reject(new Error('Scan cancelled'));
		setScanConfig(null);
	};

	const handleError = (error: string) => {
		scanConfig?.reject(new Error(error));
		setScanConfig(null);
	}

	return (
		<ScannerContext.Provider value={{ scanBarcode }}>
			{children}
			{
				loadedPwaScannerModal && (
					<Suspense fallback={<FullSpinner />}>
						<PWAScannerModal
							instruction={scanConfig?.instruction || ""}
							onResult={handleResult}
							onCancel={handleCancel}
							onError={handleError}
							isOpen={!!scanConfig}
						/>
					</Suspense>
				)
			}
		</ScannerContext.Provider >
	);
}

export function useScanner() {
	const context = useContext(ScannerContext);
	if (!context) {
		throw new Error('useScanner must be used within a ScannerProvider');
	}
	return context;
}
