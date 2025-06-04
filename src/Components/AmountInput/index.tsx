import { IonButton, IonInput } from "@ionic/react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { parseUserInputToSats } from "@/lib/units";

import { formatFiat } from "@/lib/format";
import { Satoshi } from "@/lib/types/units";
import { useSelector } from "@/State/store";
import { convertSatsToFiat } from "@/lib/fiat";




interface AmountInputProps extends React.ComponentProps<typeof IonInput> {
	children?: React.ReactNode;
	displayValue: string;
	error?: string;

	limits?: {
		min: Satoshi;
		max: Satoshi;
	}
	onPressMax?: () => void;

	unit: "BTC" | "sats";
	onType: (text: string) => string;
	onToggleUnit: () => void;
	effectiveSats: Satoshi | null; // for fiat helper text
	isDisabled?: boolean;
}
const AmountInput = forwardRef<HTMLIonInputElement, AmountInputProps>(({
	children,
	displayValue,
	error,
	limits,

	unit,
	onType,
	onPressMax,
	onToggleUnit,
	effectiveSats,
	isDisabled,
	...props
}: AmountInputProps, ref) => {
	const input = useRef<HTMLIonInputElement>(null);
	useImperativeHandle(ref, () => input.current as HTMLIonInputElement);

	const { url, currency } = useSelector(state => state.prefs.FiatUnit)



	const [isTouched, setIsTouched] = useState(false);


	const [money, setMoney] = useState<string>("");




	const handleInputChange = (e: CustomEvent) => {

		const rawValue = (e.target as HTMLIonInputElement).value?.toString() || "";
		const formattedValue = onType(rawValue);
		const inputCmp = input.current;
		if (inputCmp !== null) {
			inputCmp.value = formattedValue;
		}

	};



	useEffect(() => {
		const setFiat = async () => {
			if (!effectiveSats) {
				setMoney("");
				return;
			}
			const fiat = await convertSatsToFiat(effectiveSats, currency, url);
			setMoney(formatFiat(fiat, currency));
		}
		setFiat();
	}, [effectiveSats, currency, url]);


	const maxSelected = limits && displayValue && parseUserInputToSats(displayValue, unit) === limits.max;

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
			disabled={isDisabled}
		>
			{children}
			<IonButton
				slot="end"
				fill="clear"
				size="small"
				onClick={onToggleUnit}
				aria-label="Toggle unit"
			>
				{unit.toUpperCase()}
			</IonButton>
			{limits && onPressMax && (

				<IonButton
					slot="end"
					fill={maxSelected ? "solid" : "clear"}
					size="small"
					onClick={onPressMax}
					aria-label="Set max"
					disabled={isDisabled}
				>
					Max
				</IonButton>
			)}
		</IonInput>
	);
})

AmountInput.displayName = "AmountInput";

export default AmountInput;



