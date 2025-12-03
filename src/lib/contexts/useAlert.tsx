import { IonAlert } from '@ionic/react';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';

export type AlertOptions = React.ComponentProps<typeof IonAlert>;
export type AlertResult = { role?: string; data?: any };



interface AlertContextValue {
	showAlert: (options: AlertOptions) => Promise<AlertResult>;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

type Queued = {
	id: number;
	options: AlertOptions;
	resolve: (r: AlertResult) => void;
	reject: (e?: unknown) => void;
};

export const useAlert = () => {
	const ctx = useContext(AlertContext);
	if (!ctx) throw new Error('useAlert must be used within AlertProvider');
	return ctx;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
	const [alertQueue, setAlertQueue] = useState<Queued[]>([]);
	const [currentAlert, setCurrentAlert] = useState<Queued | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const idCounter = useRef(0);


	const showAlert = useCallback(async (options: AlertOptions): Promise<AlertResult> => {
		let resolve!: (r: AlertResult) => void;
		let reject!: (e?: unknown) => void;

		const onDidDismiss = new Promise<AlertResult>((res, rej) => {
			resolve = res; reject = rej;
		});

		const id = ++idCounter.current;
		setAlertQueue(prev => [...prev, { id, options, resolve, reject }]);

		return onDidDismiss;
	}, []);

	useEffect(() => {
		if (!isOpen && alertQueue.length > 0) {
			setCurrentAlert(alertQueue[0]);
			setAlertQueue(prev => prev.slice(1));
			setIsOpen(true);
		}
	}, [isOpen, alertQueue]);


	const handleDidDismiss: NonNullable<AlertOptions['onDidDismiss']> = (ev) => {
		// chain any user-supplied handler on this alert
		currentAlert?.options.onDidDismiss?.(ev);

		// resolve this specific alert’s promise
		currentAlert?.resolve(ev.detail);

		// close and allow next in queue
		setIsOpen(false);
		setCurrentAlert(null);
	};

	return (
		<AlertContext.Provider value={{ showAlert }}>
			{children}
			<IonAlert
				isOpen={isOpen}
				onDidDismiss={handleDidDismiss}
				{...(currentAlert?.options ?? {})}
				buttons={currentAlert?.options.buttons || ["OK"]}
			></IonAlert>
		</AlertContext.Provider>
	);
};
