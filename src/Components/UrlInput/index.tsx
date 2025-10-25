import { IonButton, IonInput } from "@ionic/react";
import { Dispatch, forwardRef, SetStateAction, useEffect, useImperativeHandle, useRef, useState } from "react";
import { parseUserInputToSats } from "@/lib/units";

import { formatFiat } from "@/lib/format";
import { Satoshi } from "@/lib/types/units";
import { useSelector } from "@/State/store/store";
import { convertSatsToFiat } from "@/lib/fiat";




interface UrlInputProps extends React.ComponentProps<typeof IonInput> {
	children?: React.ReactNode;
	acceptableSchemes: string[];
	defaultScheme: string;
	initial: string;

}
const UrlInput = forwardRef<HTMLIonInputElement, UrlInputProps>(({
	children,
	acceptableSchemes,
	defaultScheme,

	...props
}: UrlInputProps, ref) => {
	const input = useRef<HTMLIonInputElement>(null);
	useImperativeHandle(ref, () => input.current as HTMLIonInputElement);

	const [inputValue, setInputValue] = useState()



	const [isTouched, setIsTouched] = useState(false);
	const [error, setError] = useState(false);


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

UrlInput.displayName = "UrlInput";

export default UrlInput;



