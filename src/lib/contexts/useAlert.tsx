import { AlertButton, IonAlert } from '@ionic/react';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';



interface AlertOptions {
	header?: string;
	subHeader?: string;
	message?: string;
	buttons?: (AlertButton | string)[];
}

interface AlertContextValue {
	showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const useAlert = () => {
	const ctx = useContext(AlertContext);
	if (!ctx) throw new Error('useAlert must be used within AlertProvider');
	return ctx;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
	const [alertQueue, setAlertQueue] = useState<AlertOptions[]>([]);
	const [currentAlert, setCurrentAlert] = useState<AlertOptions | null>(null);
	const [isOpen, setIsOpen] = useState(false);


	const showAlert = useCallback((options: AlertOptions) => {
		setAlertQueue(prev => [...prev, options]);
	}, []);

	useEffect(() => {
		if (!isOpen && alertQueue.length > 0) {
			setCurrentAlert(alertQueue[0]);
			setAlertQueue(prev => prev.slice(1));
			setIsOpen(true);
		}
	}, [isOpen, alertQueue]);

	return (
		<AlertContext.Provider value={{ showAlert }}>
			{children}
			<IonAlert
				isOpen={isOpen}
				onDidDismiss={() => setIsOpen(false)}
				header={currentAlert?.header}
				subHeader={currentAlert?.subHeader}
				message={currentAlert?.message}
				buttons={currentAlert?.buttons || ["OK"]}
			></IonAlert>
		</AlertContext.Provider>
	);
};
