import { useCallback, useEffect, useRef, useState } from "react";
import { OfferPriceType } from "@shocknet/clink-sdk";
import { identifyBitcoinInput, parseBitcoinInput } from "@/lib/parse";
import { InputClassification, type ParsedInput } from "@/lib/types/parse";
import { SEND_DISALLOWED_CLASSIFICATIONS } from "./helpers";
import { isSendParsedInput, type SendParsedInput } from "./nav";
import type { RecipentParseState } from "./types";

const DEBOUNCE_MS = 800;
const IDLE: RecipentParseState = { status: "idle", inputValue: "" };

function recipientStateFromParsed(parsed: ParsedInput): RecipentParseState {
	const inputValue = parsed.data;

	if (parsed.type === InputClassification.LNURL_WITHDRAW) {
		return {
			status: "error",
			inputValue,
			classification: parsed.type,
			error: "Lnurl cannot be a lnurl-withdraw",
		};
	}

	if (parsed.type === InputClassification.LN_INVOICE && !parsed.amount) {
		return {
			status: "error",
			inputValue,
			classification: parsed.type,
			error: "Zero value invoices are not supported",
		};
	}

	if (
		parsed.type === InputClassification.NOFFER &&
		parsed.noffer.priceType !== OfferPriceType.Spontaneous &&
		!parsed.noffer.price
	) {
		return {
			status: "error",
			inputValue,
			classification: parsed.type,
			error: "Invalid offer price for a fixed-price offer",
		};
	}

	if (!isSendParsedInput(parsed)) {
		return {
			status: "error",
			inputValue,
			classification: parsed.type,
			error: "Unidentified recipient",
		};
	}

	return {
		status: "parsedOk",
		inputValue,
		parsedData: parsed,
	};
}


export function useRecipientField() {
	const [value, setValue] = useState("");
	const [parseState, setParseState] = useState<RecipentParseState>(IDLE);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const parseGen = useRef(0);

	const clearDebounce = () => {
		if (debounceRef.current == null) return;
		clearTimeout(debounceRef.current);
		debounceRef.current = null;
	};

	const parseString = useCallback((text: string) => {
		const gen = ++parseGen.current;
		const trimmed = text.trim();
		if (!trimmed) {
			setParseState(IDLE);
			return;
		}

		const { classification, value: normalized } = identifyBitcoinInput(
			trimmed,
			{ disallowed: [...SEND_DISALLOWED_CLASSIFICATIONS] },
		);

		if (classification === InputClassification.UNKNOWN) {
			setParseState({
				status: "error",
				inputValue: trimmed,
				classification,
				error: "Unidentified recipient",
			});
			return;
		}

		setParseState({
			status: "loading",
			inputValue: normalized,
			classification,
		});

		void (async () => {
			try {
				const parsed = await parseBitcoinInput(normalized, classification);
				if (gen !== parseGen.current) return;
				setParseState(recipientStateFromParsed(parsed));
			} catch (err: unknown) {
				if (gen !== parseGen.current) return;
				setParseState({
					status: "error",
					inputValue: normalized,
					classification,
					error:
						err instanceof Error
							? err.message
							: "Failed to parse recipient",
				});
			}
		})();
	}, []);

	useEffect(() => () => {
		clearDebounce();
	}, []);

	const onInput = useCallback((next: string) => {
		setValue(next);
		clearDebounce();
		if (!next.trim()) {
			parseGen.current += 1;
			setParseState(IDLE);
			return;
		}
		debounceRef.current = setTimeout(() => {
			debounceRef.current = null;
			parseString(next);
		}, DEBOUNCE_MS);
	}, [parseString]);

	const commit = useCallback((input: string | SendParsedInput) => {
		clearDebounce();
		if (typeof input === "string") {
			setValue(input);
			parseString(input);
			return;
		}

		parseGen.current += 1;
		setValue(input.data);
		setParseState(recipientStateFromParsed(input));
	}, [parseString]);

	return { value, state: parseState, onInput, commit };
}
