import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { IonToast, ToastOptions } from "@ionic/react";





export type ShowToast = (options: ToastOptions) => void;

interface ToastContextValue {
	showToast: ShowToast;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within ToastProvider");
	return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
	const [toastOptions, setToastOptions] = useState<ToastOptions | null>(null);

	const showToast = useCallback((options: ToastOptions) => {
		setToastOptions(options);
	}, []);

	const handleDismiss = () => {
		setToastOptions(null);
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<IonToast
				isOpen={!!toastOptions?.message}
				onDidDismiss={handleDismiss}
				{...toastOptions}
			/>
		</ToastContext.Provider>
	);
};
