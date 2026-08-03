import {
	IonButton,
	IonInput,
	type InputCustomEvent,
} from "@ionic/react";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useMemo,
	useReducer,
	useRef,
	useState,
	type ComponentProps,
	type ReactNode,
} from "react";
import { getFiatString } from "@/Components/FiatDisplay";
import type { AmountUnit, Satoshi } from "@/lib/types/units";
import { selectFiatCurrency } from "@/State/scoped/backups/identity/slice";
import { useAppSelector } from "@/State/store/hooks";
import {
	type AmountLimits,
	amountFieldReducer,
	createInitialAmountFieldState,
	formatAmountInput,
	selectAmountFieldView,
} from "./model";
import { useEventCallback } from "@/Hooks/useEventCallback";
import cn from "clsx";

type IonInputProps = ComponentProps<typeof IonInput>;

export type AmountFieldChange = {
	// Payable amount - null when empty, unparseable, or outside limits
	sats: Satoshi | null;
	error: string | undefined;
};

export type AmountFieldProps = {
	limits?: AmountLimits | null;

	//When non-null, the field is locked to this exact sats amount
	fixedSats?: Satoshi | null;
	onChange?: (next: AmountFieldChange) => void;

	initialSats?: Satoshi | null;
	initialUnit?: AmountUnit;
	/*
	 * When true (default), show a tappable unit control.
	 * When false, unit is shown as static end text.
	 */
	allowUnitToggle?: boolean;
	showFiat?: boolean;
	children?: ReactNode;
	className?: string;
	label?: string;
	placeholder?: string;
	fill?: IonInputProps["fill"];
	mode?: IonInputProps["mode"];
	labelPlacement?: IonInputProps["labelPlacement"];
	color?: IonInputProps["color"];
};

export const AmountField = forwardRef<HTMLIonInputElement, AmountFieldProps>(
	function AmountField(
		{
			limits = null,
			fixedSats = null,
			onChange,
			initialSats = null,
			initialUnit = "sats",
			allowUnitToggle = true,
			showFiat = true,
			children,
			className,
			label = "Amount",
			placeholder,
			fill,
			mode: ionMode,
			labelPlacement,
			color = "primary",
		},
		ref,
	) {
		const inputRef = useRef<HTMLIonInputElement>(null);
		useImperativeHandle(ref, () => inputRef.current as HTMLIonInputElement);

		const [state, dispatch] = useReducer(
			amountFieldReducer,
			{ unit: initialUnit, limits, initialSats },
			createInitialAmountFieldState,
		);


		useEffect(() => {
			dispatch({
				type: "setLimits",
				limits:
					limits?.min !== undefined && limits?.max !== undefined
						? { min: limits.min, max: limits.max }
						: null,
			});
		}, [limits?.min, limits?.max]);

		// Unlocking discards the draft underneath (Send: clear recipient → empty amount).
		const prevFixed = useRef<Satoshi | null>(fixedSats);
		useEffect(() => {
			const previous = prevFixed.current;
			prevFixed.current = fixedSats;
			if (previous != null && fixedSats == null) {
				dispatch({ type: "clear" });
			}
		}, [fixedSats]);

		const view = useMemo(
			() => selectAmountFieldView(state, fixedSats),
			[state, fixedSats],
		);

		const onChangeCallback = useEventCallback(onChange);

		useEffect(() => {
			onChangeCallback?.({
				sats: view.sats,
				error: view.error,
			});
		}, [view.sats, view.error, onChangeCallback]);

		const fiatCurrency = useAppSelector(selectFiatCurrency);
		const [fiatHelper, setFiatHelper] = useState("");
		const [touched, setTouched] = useState(false);

		useEffect(() => {
			if (!showFiat) {
				setFiatHelper("");
				return;
			}
			let alive = true;
			void (async () => {
				const next = await getFiatString(view.parsedSats, fiatCurrency);
				if (alive) {
					setFiatHelper(next);
				}
			})();
			return () => {
				alive = false;
			};
		}, [view.parsedSats, fiatCurrency, showFiat]);

		const handleIonInput = (event: InputCustomEvent) => {
			if (view.disabled) {
				return;
			}
			const value = event.detail.value;
			const raw = Array.isArray(value)
				? (value[0] ?? "")
				: value == null
					? ""
					: String(value);
			dispatch({
				type: "input",
				text: formatAmountInput(raw, state.unit),
			});
		};

		const showMax = !!state.limits && !view.disabled;
		const resolvedPlaceholder =
			placeholder ?? `Enter amount in ${state.unit}`;

		return (
			<IonInput
				ref={inputRef}
				label={label}
				labelPlacement={labelPlacement}
				color={color}
				fill={fill}
				mode={ionMode}
				inputMode={state.unit === "sats" ? "numeric" : "decimal"}
				type="text"
				value={view.displayValue}
				placeholder={resolvedPlaceholder}
				helperText={fiatHelper ? `~ ${fiatHelper}` : undefined}
				errorText={view.error}
				disabled={view.disabled}
				onIonBlur={() => setTouched(true)}
				onIonInput={handleIonInput}
				className={cn(
					className,
					view.error !== undefined && "ion-invalid",
					touched && "ion-touched",
				)}
				data-testid="amount-field"
			>
				{children}
				{allowUnitToggle ? (
					<IonButton
						slot="end"
						fill="clear"
						size="small"
						color="medium"
						onClick={() => dispatch({ type: "toggleUnit" })}
						aria-label="Toggle unit"
						data-testid="amount-field-unit-toggle"
					>
						{state.unit.toUpperCase()}
					</IonButton>
				) : (
					<span
						slot="end"
						className="px-2 text-sm text-muted"
						data-testid="amount-field-unit-label"
					>
						{state.unit.toUpperCase()}
					</span>
				)}
				{showMax ? (
					<IonButton
						slot="end"
						fill={view.isMaxSelected ? "solid" : "clear"}
						size="small"
						color={view.isMaxSelected ? "primary" : "medium"}
						onClick={() => dispatch({ type: "max" })}
						aria-label="Set max"
						data-testid="amount-field-max"
					>
						Max
					</IonButton>
				) : null}
			</IonInput>
		);
	},
);

AmountField.displayName = "AmountField";
