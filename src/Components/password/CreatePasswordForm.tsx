import { IonInput } from "@ionic/react";
import { FormEvent, useReducer } from "react";

interface CreatePasswordFormProps {
	id: string;
	description?: string;
	username?: string;
	minLength?: number;
	onSubmit: (password: string) => void;
	className?: string;
	ionInputProps?: React.ComponentProps<typeof IonInput>;
}

export function CreatePasswordForm({
	id,
	description,
	username,
	minLength = 8,
	onSubmit,
	className,
	ionInputProps,
}: CreatePasswordFormProps) {
	const [state, dispatch] = useReducer(reducer, {
		...initialState,
		minLength,
	});

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const error = validatePasswords(
			state.password,
			state.confirmPassword,
			state.minLength,
		);

		dispatch({ type: "submissionAttempted" });

		if (error) {
			return;
		}

		onSubmit(state.password);
	}

	const fieldClassName = `${!state.error && "ion-valid"} ${state.error && "ion-invalid"} ${state.touched && "ion-touched"}`;

	return (
		<form
			id={id}
			onSubmit={handleSubmit}
			className={className ?? "flex flex-col gap-4 mt-9"}
		>
			{description ? (
				<div className="text-secondary text-sm tracking-wide leading-normal text-wrap mb-10">
					{description}
				</div>
			) : null}
			{username ? (
				<input
					type="text"
					name="username"
					autoComplete="username"
					value={username}
					readOnly
					className="absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
				/>
			) : null}
			<IonInput
				className={fieldClassName}
				label="Password"
				labelPlacement="stacked"
				fill="outline"
				color="primary"
				mode="md"
				type="password"
				autocomplete="new-password"
				name="new-password"
				value={state.password}
				onIonInput={(e) =>
					dispatch({
						type: "passwordChanged",
						password: e.detail.value ?? "",
					})
				}
				onIonBlur={() => dispatch({ type: "passwordBlurred" })}
				minlength={state.minLength}
				required
				{...ionInputProps}
			/>

			<IonInput
				className={fieldClassName}
				name="confirm-password"
				type="password"
				autocomplete="new-password"
				value={state.confirmPassword}
				label="Confirm password"
				labelPlacement="stacked"
				fill="outline"
				color="primary"
				mode="md"
				errorText={state.error ?? undefined}
				minlength={state.minLength}
				required
				onIonInput={(e) =>
					dispatch({
						type: "confirmPasswordChanged",
						confirmPassword: e.detail.value ?? "",
					})
				}
				onIonBlur={() => dispatch({ type: "confirmPasswordBlurred" })}
				{...ionInputProps}
			/>
		</form>
	);
}

type Action =
	| {
		type: "passwordChanged";
		password: string;
	}
	| {
		type: "confirmPasswordChanged";
		confirmPassword: string;
	}
	| {
		type: "passwordBlurred";
	}
	| {
		type: "confirmPasswordBlurred";
	}
	| {
		type: "submissionAttempted";
	};

type State = {
	password: string;
	confirmPassword: string;
	minLength: number;
	touched: boolean;
	error: string | null;
};

const initialState: State = {
	password: "",
	confirmPassword: "",
	minLength: 8,
	touched: false,
	error: null,
};

function validatePasswords(
	password: string,
	confirmPassword: string,
	minLength: number,
): string | null {
	if (password.length < minLength) {
		return `Password must be at least ${minLength} characters.`;
	}
	if (password !== confirmPassword) {
		return "Passwords do not match.";
	}
	return null;
}

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "passwordChanged": {
			const next = {
				...state,
				password: action.password,
			};
			return {
				...next,
				error: state.touched
					? validatePasswords(
						next.password,
						next.confirmPassword,
						next.minLength,
					)
					: null,
			};
		}

		case "confirmPasswordChanged": {
			const next = {
				...state,
				confirmPassword: action.confirmPassword,
			};
			return {
				...next,
				error: state.touched
					? validatePasswords(
						next.password,
						next.confirmPassword,
						next.minLength,
					)
					: null,
			};
		}

		case "passwordBlurred":
		case "confirmPasswordBlurred":
		case "submissionAttempted": {
			return {
				...state,
				touched: true,
				error: validatePasswords(
					state.password,
					state.confirmPassword,
					state.minLength,
				),
			};
		}

		default:
			return state;
	}
}
