import {
	IonButton,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonText,
} from "@ionic/react";
import deepEqual from "fast-deep-equal";
import { add, close } from "ionicons/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { PAYER_DATA_KEY_RX } from "./utils";



type PayerDataEditorProps = {
	value: string[];
	onChange: (next: string[]) => void;
	disabled?: boolean;
	reservedKeys?: string[];
};



const normalize = (s: string) => s.trim().toLowerCase();
const isValidKey = (k: string) => PAYER_DATA_KEY_RX.test(k);


const PayerDataEditor = ({
	value,
	onChange,
	disabled = false,
}: PayerDataEditorProps) => {



	const [rows, setRows] = useState<string[]>(value.length ? value : [""]);

	const lastParent = useRef<string[]>(value);

	useEffect(() => {
		// Compare parent’s valid keys with our own valid keys.
		const parentValid = value.filter(isValidKey);
		const localValid = rows.filter(isValidKey);
		if (!deepEqual(parentValid, localValid)) {
			// Merge: parentValid + any local invalid rows still being edited
			const localInvalid = rows.filter(r => !isValidKey(r));
			setRows(parentValid.concat(localInvalid.length ? localInvalid : [""]));
			lastParent.current = value;
		}
	}, [value]); // eslint-disable-line react-hooks/exhaustive-deps

	// inputsRef to focus newly added row
	const inputsRef = useRef<(HTMLIonInputElement | null)[]>([]);
	const prevLen = useRef(rows.length);
	useEffect(() => {
		if (rows.length > prevLen.current) {
			setTimeout(() => inputsRef.current[rows.length - 1]?.setFocus(), 0);
		}
		prevLen.current = rows.length;
	}, [rows.length])


	// collect rows problems to display
	const { problems } = useMemo(() => {
		const prob: Record<number, string> = {};
		const seen = new Set<string>();
		rows.forEach((raw, idx) => {
			const key = normalize(raw);
			if (!key) return; // empty ok until save
			if (!PAYER_DATA_KEY_RX.test(key)) {
				prob[idx] = "Letters, numbers, _ or - (start with letter, max 32)";
			} else if (seen.has(key)) {
				prob[idx] = "Duplicate";
			} else {
				seen.add(key);
			}
		});
		return { problems: prob };
	}, [rows]);



	const lastCommitted = useRef<string[]>(value);
	useEffect(() => {
		const id = setTimeout(() => {
			const cleaned = rows
				.map(normalize)
				.filter(isValidKey)
				.filter((k, i, arr) => arr.indexOf(k) === i); // dedupe

			if (!deepEqual(cleaned, lastCommitted.current)) {
				onChange(cleaned);
				lastCommitted.current = cleaned;
			}
		}, 400);
		return () => clearTimeout(id);
	}, [rows, onChange]);


	const updateRow = (idx: number, val: string) => {
		setRows(r => {
			const copy = [...r];
			copy[idx] = val;
			return copy;
		});
	};

	const removeRow = (idx: number) =>
		setRows(r => (r.length === 1 ? [""] : r.filter((_, i) => i !== idx)));

	const addRow = () => {
		// Prevent adding a new row if last one is empty or has problems
		if (rows[rows.length - 1].trim() === "" || problems[rows.length - 1]) return;
		setRows(r => [...r, ""])
	};




	return (
		<IonList lines="none" className="ion-margin-top" style={{ borderRadius: "12px" }}>
			<IonListHeader className="text-medium" style={{ fontWeight: "600", fontSize: "1rem" }} lines="full">
				<IonLabel >Payer data</IonLabel>
			</IonListHeader>


			{rows.map((raw, idx) => (
				<>
					<IonItem key={idx}>
						<IonInput
							ref={el => inputsRef.current[idx] = el}
							mode="md"
							fill="outline"
							style={{ marginTop: "0.7rem" }}
							value={raw}
							spellCheck={false}
							placeholder="attribute name"
							onIonInput={e => updateRow(idx, e.detail.value ?? "")}
							onKeyDown={e => {
								if (e.key === "Enter") {
									e.preventDefault();
									addRow();
								}
							}}
							autocapitalize="off"
							inputmode="text"
							pattern="^[A-Za-z][A-Za-z0-9_-]{0,31}$"
							disabled={disabled}
						>

							{!disabled && (
								<IonButton
									slot="end"
									fill="clear"
									onClick={() => removeRow(idx)}
								>
									<IonIcon icon={close} />
								</IonButton>
							)}
						</IonInput>
					</IonItem>
					{problems[idx] && (
						<IonItem>

							<IonText color="danger">
								{problems[idx]}
							</IonText>
						</IonItem>
					)}
				</>
			))}

			{!disabled && (
				<IonButton
					expand="full"
					fill="clear"
					onClick={addRow}
					className="ion-margin-top"
					style={{ fontWeight: "600" }}
					disabled={(rows[rows.length - 1].trim() === "" || !!problems[rows.length - 1])}
				>
					<IonIcon icon={add} slot="start" />
					Add new attribute
				</IonButton>
			)}

		</IonList>
	);
};

export default PayerDataEditor;
