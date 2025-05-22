import { IonButton, IonInput } from "@ionic/react";
import { Dispatch, forwardRef, SetStateAction, useEffect, useImperativeHandle, useRef, useState } from "react";
import { formatBitcoin, formatSatoshi, parseUserInputToSats, satsToBtc } from "@/lib/units";
import useDebounce from "@/Hooks/useDebounce";
import { formatFiat, validateAndFormatAmountInput } from "@/lib/format";
import { Satoshi } from "@/lib/types/units";
import { useSelector } from "@/State/store";
import { convertSatsToFiat } from "@/lib/fiat";




interface AmountInputProps extends React.ComponentProps<typeof IonInput> {
	children?: React.ReactNode;
	amountInSats: Satoshi | null;
	setAmountInSats: Dispatch<SetStateAction<Satoshi | null>>;
	unit: "BTC" | "sats";
	setUnit: Dispatch<SetStateAction<"BTC" | "sats">>;
	displayValue: string;
	setDisplayValue: Dispatch<SetStateAction<string>>;
	limits?: {
		minSats: Satoshi;
		maxSats: Satoshi;
	},
}
const AmountInput = forwardRef<HTMLIonInputElement, AmountInputProps>(({
	children,
	amountInSats,
	setAmountInSats,
	unit,
	setUnit,
	displayValue,
	setDisplayValue,
	limits,
	...props
}: AmountInputProps, ref) => {
	const input = useRef<HTMLIonInputElement>(null);
	useImperativeHandle(ref, () => input.current as HTMLIonInputElement);

	const { url, currency } = useSelector(state => state.prefs.FiatUnit)


	const debouncedDisplayValue = useDebounce(displayValue, 500);

	const [isTouched, setIsTouched] = useState(false);
	const [error, setError] = useState<string | undefined>();

	const [money, setMoney] = useState<string>("");

	const [choseMax, setChoseMax] = useState(false);

	useEffect(() => {
		let newSats: Satoshi;
		try {
			newSats = parseUserInputToSats(debouncedDisplayValue, unit);
		} catch (err) {
			console.error(err);
			setError("Invalid amount");
			return;
		}

		if (!newSats) {
			setAmountInSats(null);
			setError(undefined);
			return;
		}


		if (limits) {
			if (newSats < limits.minSats) {
				setError(`Minimum amount is ${formatSatoshi(limits.minSats)}`);
				return;
			} else if (newSats > limits.maxSats) {
				setError(`Maximum amount is ${formatSatoshi(limits.maxSats)}`);
				return;
			}
		}



		setError(undefined);
		setAmountInSats(newSats);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedDisplayValue]);

	const handleInputChange = (e: CustomEvent) => {
		const rawValue = (e.target as HTMLIonInputElement).value?.toString() || "";
		const newValue = validateAndFormatAmountInput(rawValue, unit);
		setDisplayValue(newValue);
		const inputCmp = input.current;
		if (inputCmp !== null) {
			inputCmp.value = newValue;
		}
	};

	const toggleUnit = () => {
		const newUnit = unit === "BTC" ? "sats" : "BTC";

		if (amountInSats) {
			const convertedValue = newUnit === "BTC"

				? formatBitcoin(satsToBtc(amountInSats))
				: formatSatoshi(amountInSats);
			setDisplayValue(convertedValue);
		}

		setUnit(newUnit);
	}

	useEffect(() => {
		const setFiat = async () => {
			if (!amountInSats) {
				setMoney("");
				return;
			}
			const fiat = await convertSatsToFiat(amountInSats, currency, url);
			setMoney(formatFiat(fiat, currency));
		}
		setFiat();
	}, [amountInSats, currency, url]);


	const setMax = () => {
		if (limits) {
			const maxValue = unit === "BTC"
				? formatBitcoin(satsToBtc(limits.maxSats))
				: formatSatoshi(limits.maxSats);
			setDisplayValue(maxValue);
			setChoseMax(true);
		}
	};

	useEffect(() => {
		if (choseMax) {
			setMax();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [limits])

	return (
		<IonInput
			key={unit}
			onIonBlur={() => setIsTouched(true)}
			ref={input}
			label="Amount"
			color="primary"
			inputMode="decimal"
			type="text"
			onIonInput={handleInputChange}
			placeholder={`Enter amount in ${unit}`}
			value={displayValue}
			helperText={money ? `~ ${money}` : undefined}
			errorText={error}
			{...props}
			className={` ${props.className || ""} ${error !== undefined && 'ion-invalid'} ${isTouched && 'ion-touched'}`}
		>
			{children}
			<IonButton
				slot="end"
				fill="clear"
				size="small"
				onClick={toggleUnit}
				aria-label="Toggle unit"
			>
				{unit.toUpperCase()}
			</IonButton>
			{limits && (

				<IonButton
					slot="end"
					fill="clear"
					size="small"
					onClick={setMax}
					aria-label="Set max"
				>
					Max
				</IonButton>
			)}
		</IonInput>
	);
})

AmountInput.displayName = "AmountInput";

export default AmountInput;



