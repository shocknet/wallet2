import {
	IonButton,
	IonIcon,
	IonInput,
	type InputCustomEvent,
} from "@ionic/react";
import { qrCodeOutline } from "ionicons/icons";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useReducer,
	useRef,
	useState,
	type ComponentProps,
	type ReactNode,
} from "react";
import cn from "clsx";
import { useEventCallback } from "@/Hooks/useEventCallback";
import { useQrScanner } from "@/Hooks/useQrScanner";
import { identifyBitcoinInput, InputClassificationConfig, parseBitcoinInput } from "@/lib/parse";
import {
	InputClassification,
	type ParsedInput,
} from "@/lib/types/parse";
import {
	bitcoinInputReducer,
	createInitialBitcoinInputState,
	displayValueForParsed,

	type BitcoinInputState,
} from "./model";

export type { BitcoinInputState } from "./model";

type IonInputProps = ComponentProps<typeof IonInput>;

const DEBOUNCE_MS = 800;

export type BitcoinInputHandle = {
	commit: (input: string | ParsedInput) => void;
	getInputElement: () => HTMLIonInputElement | null;
};

export type BitcoinInputProps = {
	onChange?: (next: BitcoinInputState) => void;
	validate?: (parsed: ParsedInput) => string | null;
	initialValue?: string;
	initialParsed?: ParsedInput | null;
	unidentifiedError?: string;
	showScan?: boolean;
	scanInstruction?: string;
	children?: ReactNode;
	className?: string;
	label?: string;
	placeholder?: string;
	fill?: IonInputProps["fill"];
	mode?: IonInputProps["mode"];
	labelPlacement?: IonInputProps["labelPlacement"];
	color?: IonInputProps["color"];
} & (
		| { allowed?: undefined; disallowed?: undefined }
		| InputClassificationConfig
	);

export const BitcoinInput = forwardRef<BitcoinInputHandle, BitcoinInputProps>(
	function BitcoinInput(
		{
			allowed,
			disallowed,
			onChange,
			validate,
			initialValue,
			initialParsed = null,
			unidentifiedError = "Unrecognized input",
			showScan = true,
			scanInstruction = "Scan a QR code",
			children,
			className,
			label,
			placeholder,
			fill,
			mode: ionMode,
			labelPlacement,
			color = "primary",
		},
		ref,
	) {
		const inputRef = useRef<HTMLIonInputElement>(null);
		const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const parseGen = useRef(0);
		const [touched, setTouched] = useState(false);
		const { scanSingleBarcode } = useQrScanner();
		const validateCallback = useEventCallback(validate);

		const classify = useMemo(
			() =>
				allowed
					? { allowed }
					: disallowed
						? { disallowed }
						: undefined,
			[allowed, disallowed],
		);

		const [state, dispatch] = useReducer(
			bitcoinInputReducer,
			{ value: initialValue, parsed: initialParsed },
			createInitialBitcoinInputState,
		);

		const clearDebounce = () => {
			if (debounceRef.current == null) return;
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		};

		const runParse = useCallback(
			(text: string) => {
				const gen = ++parseGen.current;
				const trimmed = text.trim();
				if (!trimmed) {
					dispatch({ type: "clear" });
					return;
				}

				const { classification, value: normalized } = identifyBitcoinInput(
					trimmed,
					classify,
				);

				if (classification === InputClassification.UNKNOWN) {
					dispatch({
						type: "parseError",
						value: text,
						error: unidentifiedError,
						classification,
					});
					return;
				}

				dispatch({
					type: "parseLoading",
					value: text,
					classification,
				});

				void (async () => {
					try {
						const parsed = await parseBitcoinInput(
							normalized,
							classification,
						);
						if (gen !== parseGen.current) return;
						const invalid = validateCallback?.(parsed) ?? null;
						if (invalid) {
							dispatch({
								type: "parseError",
								value: text,
								error: invalid,
								classification: parsed.type,
							});
							return;
						}
						dispatch({ type: "parseOk", value: text, parsed });
					} catch (err: unknown) {
						if (gen !== parseGen.current) return;
						dispatch({
							type: "parseError",
							value: text,
							error:
								err instanceof Error
									? err.message
									: "Failed to parse input",
							classification,
						});
					}
				})();
			},
			[classify, unidentifiedError, validateCallback],
		);

		const commit = useCallback(
			(input: string | ParsedInput) => {
				clearDebounce();
				if (typeof input === "string") {
					dispatch({ type: "input", value: input });
					runParse(input);
					return;
				}
				parseGen.current += 1;
				const invalid = validateCallback?.(input) ?? null;
				const value = displayValueForParsed(input);
				if (invalid) {
					dispatch({
						type: "parseError",
						value,
						error: invalid,
						classification: input.type,
					});
					return;
				}
				dispatch({ type: "parseOk", value, parsed: input });
			},
			[runParse, validateCallback],
		);

		useImperativeHandle(
			ref,
			() => ({
				commit,
				getInputElement: () => inputRef.current,
			}),
			[commit],
		);

		useEffect(() =>
			() => {
				clearDebounce();
			}, []);

		useEffect(() => {
			if (state.status !== "typing") return;
			const value = state.value;
			debounceRef.current = setTimeout(() => {
				debounceRef.current = null;
				runParse(value);
			}, DEBOUNCE_MS);
			return () => {
				clearDebounce();
			};
		}, [state.status, state.value, runParse]);

		const onChangeCallback = useEventCallback(onChange);

		useEffect(() => {
			onChangeCallback?.(state);
		}, [state, onChangeCallback]);

		const handleIonInput = (event: InputCustomEvent) => {
			const raw = event.detail.value;
			const value = Array.isArray(raw)
				? (raw[0] ?? "")
				: raw == null
					? ""
					: String(raw);
			parseGen.current += 1;
			clearDebounce();
			dispatch({ type: "input", value });
		};

		const openScan = async () => {
			try {
				const scanned = await scanSingleBarcode(scanInstruction);
				commit(scanned);
			} catch {
				/* cancelled */
			}
		};

		return (
			<IonInput
				ref={inputRef}
				label={label}
				labelPlacement={labelPlacement}
				color={color}
				fill={fill}
				mode={ionMode}
				type="text"
				value={state.value}
				placeholder={placeholder}
				errorText={state.status === "error" ? state.error : undefined}
				onIonBlur={() => setTouched(true)}
				onIonInput={handleIonInput}
				className={cn(
					className,
					state.status === "error" && "ion-invalid",
					touched && "ion-touched",
				)}
				data-testid="bitcoin-input"
			>
				{children}
				{showScan ? (
					<IonButton
						slot="end"
						fill="clear"
						size="small"
						color="medium"
						aria-label="scan"
						onClick={() => void openScan()}
						data-testid="bitcoin-input-scan"
					>
						<IonIcon slot="icon-only" icon={qrCodeOutline} />
					</IonButton>
				) : null}
			</IonInput>
		);
	},
);

BitcoinInput.displayName = "BitcoinInput";
