import { IonInput } from "@ionic/react";
import { FormEvent, useReducer } from "react";

interface InputPasswordFormProps {
	id: string;
	description?: string;
	username?: string;
	onSubmit: (password: string) => void;

	className?: string;
	ionInputProps?: React.ComponentProps<typeof IonInput>;
}



export function InputPasswordform({ id, description, username, onSubmit, className, ionInputProps }: InputPasswordFormProps) {
	const [state, dispatch] = useReducer(reducer, initialState);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const error = validatePassword(state.password);

		dispatch({
			type: "submissionAttempted",
		});

		if (error) {
			return;
		}

		onSubmit(state.password);
	}


	return (
		<form
			id={id}
			onSubmit={handleSubmit}
			className={className}
		>
			{description && <div className="text-secondary text-sm tracking-wide leading-normal text-wrap mb-10">{description}</div>}
			{
				username && (
					<input
						type="text"
						name="username"
						autoComplete="username"
						value={username}
						readOnly
						className="absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
					/>
				)
			}
			<IonInput
				className={`${!state.error && 'ion-valid'} ${state.error && 'ion-invalid'} ${state.touched && 'ion-touched'}`}
				label="Password"
				labelPlacement="stacked"
				fill="outline"
				mode="md"
				type="password"
				autocomplete="current-password"
				name="password"
				value={state.password}
				onIonInput={(e) => dispatch({ type: "passwordChanged", password: e.detail.value ?? "" })}
				required
				errorText={state.error ?? undefined}
				onIonBlur={() => dispatch({ type: "passwordBlurred" })}
				{...ionInputProps}
			/>
		</form>
	)
}


type Action =
	| {
		type: "passwordChanged";
		password: string;
	}
	| {
		type: "passwordBlurred";
	}
	| {
		type: "submissionAttempted";
	};


type State = {
	password: string;
	touched: boolean;
	error: string | null;
};

const initialState: State = {
	password: "",
	touched: false,
	error: null,
};

function validatePassword(password: string): string | null {
	if (password.length === 0) {
		return "Password is required.";
	}

	if (password.length < 8) {
		return "Password must be at least 8 characters.";
	}

	return null;
}


function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "passwordChanged": {
			return {
				...state,
				password: action.password,

				// Only update the visible error after the field
				// has already been interacted with.
				error: state.touched
					? validatePassword(action.password)
					: null,
			};
		}

		case "passwordBlurred": {
			return {
				...state,
				touched: true,
				error: validatePassword(state.password),
			};
		}

		case "submissionAttempted": {
			return {
				...state,
				touched: true,
				error: validatePassword(state.password),
			};
		}

		default:
			return state;
	}
}
