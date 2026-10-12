import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { IonToast, type ToastOptions } from "@ionic/react";

export type ShowToastOptions = ToastOptions & {
	onDidDismiss?: () => void;
};

export type ShowToast = (options: ShowToastOptions) => void;

interface ToastContextValue {
	showToast: ShowToast;
	toastOptions: ShowToastOptions | null;
	dismissToast: () => void;
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

	const dismissToast = useCallback(() => {
		setToastOptions(null);
	}, []);

	return (
		<ToastContext.Provider value={{ showToast, toastOptions, dismissToast }}>
			{children}
		</ToastContext.Provider>
	);
};

export function ToastOutlet() {
	const { toastOptions, dismissToast } = useToast();
	const { onDidDismiss, ...toastProps } = toastOptions ?? {};

	return (
		<IonToast
			isOpen={!!toastOptions?.message}
			duration={5000}
			position="bottom"
			{...toastProps}
			onDidDismiss={() => {
				onDidDismiss?.();
				dismissToast();
			}}
		/>
	);
}
