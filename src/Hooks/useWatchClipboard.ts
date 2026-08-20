import { useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Clipboard } from "@capacitor/clipboard";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { addAsset } from "@/State/Slices/generatedAssets";
import { useAlert } from "@/lib/contexts/useAlert";
import { InputClassification } from "@/lib/types/parse";
import { truncateTextMiddle } from "@/lib/format";
import { identifyBitcoinInput, parseBitcoinInput } from "@/lib/parse";
import { useEventCallback } from "@/Hooks/useEventCallback";
import { useLocalStorage } from "@/Hooks/useLocalStorage/useLocalStorage";
import { useWindowEvent } from "@/Hooks/useWindowEvent";
import { selectIsActive } from "@/State/runtime/slice";
import { navToSend, isSendParsedInput } from "@/Pages/Send/nav";
import { navToSources } from "@/Pages/Sources/nav";

const CLIPBOARD_THROTTLE_MS = 500;
const FOCUS_SETTLE_DELAY_MS = 50;

export function useWatchClipboard() {
	const { showAlert } = useAlert();
	const dispatch = useAppDispatch();
	const history = useHistory();
	const isAppActive = useAppSelector(selectIsActive);

	const [warned, setWarned] = useLocalStorage({
		key: "warned-clipboard-not-allowed",
		defaultValue: false,
	});

	const seenAssets = useAppSelector((state) => state.generatedAssets.assets);

	const lastCheckTsRef = useRef(0);
	const alertInFlightRef = useRef(false);
	const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const remember = (asset: string) => {
		dispatch(addAsset({ asset }));
	};

	const navigateForClipboard = useEventCallback(
		async (value: string, classification: InputClassification) => {
			const parsed = await parseBitcoinInput(value, classification);

			if (parsed.type === InputClassification.LNURL_WITHDRAW) {
				navToSources(history, { parsedLnurlW: parsed });
				return;
			}

			if (parsed.type === InputClassification.NPROFILE) {
				navToSources(history, { parsedNprofile: parsed });
				return;
			}

			if (isSendParsedInput(parsed)) {
				navToSend(history, { parsed });
				return;
			}

			throw new Error(`Cannot send to ${parsed.type}`);
		},
	);

	const checkClipboard = useEventCallback(async () => {
		if (!isAppActive) return;
		if (!document.hasFocus()) return;
		if (document.visibilityState !== "visible") return;
		if (alertInFlightRef.current) return;

		const now = Date.now();
		if (now - lastCheckTsRef.current < CLIPBOARD_THROTTLE_MS) return;
		lastCheckTsRef.current = now;

		let text = "";
		try {
			const { type, value } = await Clipboard.read();
			if (warned) setWarned(false);
			if (type === "text/plain" && typeof value === "string") {
				text = value.trim();
			}
		} catch (err: unknown) {
			const name =
				err && typeof err === "object" && "name" in err ? err.name : undefined;
			if (name !== "NotAllowedError" || warned) return;

			alertInFlightRef.current = true;
			setWarned(true);
			try {
				await showAlert({
					header: "Clipboard access blocked",
					message:
						"When you come back to the app, Shockwallet can read a copied invoice or address and offer to use it. Access is blocked in this browser. You can still paste into Pay.",
					buttons: ["OK"],
				});
			} finally {
				alertInFlightRef.current = false;
			}
			return;
		}

		if (!text) return;

		const { classification, value } = identifyBitcoinInput(text);
		if (
			!value ||
			classification === InputClassification.UNKNOWN ||
			classification === InputClassification.BITCOIN_ADDRESS
		) {
			return;
		}

		if ((seenAssets || []).includes(value)) return;
		if (alertInFlightRef.current) return;

		alertInFlightRef.current = true;
		try {
			const { role } = await showAlert({
				header: "Clipboard detected",
				subHeader: "Use this from your clipboard?",
				message: truncateTextMiddle(value, 20),
				buttons: [
					{ text: "No", role: "cancel" },
					{ text: "Yes", role: "confirm" },
				],
			});

			if (role !== "confirm") {
				remember(value);
				return;
			}

			await navigateForClipboard(value, classification);
			remember(value);
		} catch (err: unknown) {
			console.error("Error parsing clipboard input:", err);
			const message =
				err instanceof Error
					? err.message
					: "Could not use the clipboard content.";
			await showAlert({
				header: "Error",
				message,
				buttons: ["OK"],
			});
		} finally {
			alertInFlightRef.current = false;
		}
	});

	const scheduleCheck = useEventCallback(() => {
		if (settleTimerRef.current) {
			clearTimeout(settleTimerRef.current);
		}
		settleTimerRef.current = setTimeout(() => {
			void checkClipboard();
		}, FOCUS_SETTLE_DELAY_MS);
	});

	useEffect(() => {
		if (!isAppActive) return;
		scheduleCheck();
		return () => {
			if (settleTimerRef.current) {
				clearTimeout(settleTimerRef.current);
			}
		};
	}, [scheduleCheck, isAppActive]);

	const onVisibilityChange = useEventCallback(() => {
		if (document.visibilityState === "visible") {
			scheduleCheck();
		}
	});

	useWindowEvent("focus", scheduleCheck);
	useWindowEvent("visibilitychange", onVisibilityChange);
}
