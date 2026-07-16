import { IonAlert } from "@ionic/react";
import {
	createContext,
	useContext,
	useReducer,
	type ReactNode,
	useCallback,
	useRef,
} from "react";

export type AlertOptions = React.ComponentProps<typeof IonAlert>;

type AlertDismissEvent = Parameters<NonNullable<AlertOptions["onDidDismiss"]>>[0];
export type AlertResult = AlertDismissEvent["detail"];

interface AlertContextValue {
	showAlert: (options: AlertOptions) => Promise<AlertResult>;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

type QueuedAlert = {
	id: number;
	options: AlertOptions;
	resolve: (result: AlertResult) => void;
};

type AlertQueueState = {
	active: QueuedAlert | null;
	waiting: QueuedAlert[];
};

type AlertQueueAction =
	| { type: "enqueue"; alert: QueuedAlert }
	| { type: "complete" };

function alertQueueReducer(state: AlertQueueState, action: AlertQueueAction): AlertQueueState {
	switch (action.type) {
		case "enqueue":
			if (state.active === null) {
				return { active: action.alert, waiting: state.waiting };
			}
			return { active: state.active, waiting: [...state.waiting, action.alert] };
		case "complete": {
			const [next, ...rest] = state.waiting;
			return { active: next ?? null, waiting: rest };
		}
	}
}

export const useAlert = () => {
	const ctx = useContext(AlertContext);
	if (!ctx) throw new Error("useAlert must be used within AlertProvider");
	return ctx;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
	const [queueState, dispatch] = useReducer(alertQueueReducer, {
		active: null,
		waiting: [],
	});
	const idCounter = useRef(0);



	const showAlert = useCallback((options: AlertOptions): Promise<AlertResult> => {
		return new Promise((resolve) => {
			const id = ++idCounter.current;
			dispatch({ type: "enqueue", alert: { id, options, resolve } });
		});
	}, []);

	const handleDidDismiss = useCallback<NonNullable<AlertOptions["onDidDismiss"]>>((ev) => {
		const alert = queueState.active;
		alert?.options.onDidDismiss?.(ev);
		alert?.resolve(ev.detail);
		dispatch({ type: "complete" });
	}, [queueState.active]);

	const {
		onDidDismiss: _onDidDismiss,
		isOpen: _isOpen,
		buttons,
		...alertProps
	} = queueState.active?.options ?? {};

	return (
		<AlertContext.Provider value={{ showAlert }}>
			{children}
			<IonAlert
				className="custom-alert"
				{...alertProps}
				isOpen={queueState.active !== null}
				onDidDismiss={handleDidDismiss}
				buttons={buttons ?? ["OK"]}
			/>
		</AlertContext.Provider>
	);
};
