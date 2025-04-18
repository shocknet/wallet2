import { createContext, useContext, useState, ReactNode } from "react";
import { IonToast } from "@ionic/react";

type ToastColor = "success" | "danger" | "primary";

interface ToastOptions {
	message: string;
	color?: ToastColor;
}

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
	const [message, setMessage] = useState<string | null>(null);
	const [color, setColor] = useState<ToastColor>("primary");

	const showToast = ({ message, color = "danger" }: ToastOptions) => {
		setMessage(message);
		setColor(color);
	};

	const handleDismiss = () => {
		setMessage(null);
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<IonToast
				isOpen={!!message}
				message={message || ""}
				color={color}
				duration={3000}
				onDidDismiss={handleDismiss}
			/>
		</ToastContext.Provider>
	);
};
