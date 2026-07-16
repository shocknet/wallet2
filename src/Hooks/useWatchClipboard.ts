import { useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Clipboard } from "@capacitor/clipboard";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { addAsset } from "@/State/Slices/generatedAssets";
import { useAlert } from "@/lib/contexts/useAlert";
import { InputClassification } from "@/lib/types/parse";
import { truncateTextMiddle } from "@/lib/format";
import { useEventCallback } from "@/Hooks/useEventCallback";
import { useLocalStorage } from "@/Hooks/useLocalStorage/useLocalStorage";
import { useOnAppActive } from "@/Hooks/useOnAppActive";
import { useWindowEvent } from "@/Hooks/useWindowEvent";

const CLIPBOARD_THROTTLE_MS = 500;
const FOCUS_SETTLE_DELAY_MS = 50;

export function useWatchClipboard() {
	const { showAlert } = useAlert();
	const dispatch = useAppDispatch();
	const history = useHistory();

	const [warned, setWarned] = useLocalStorage({
		key: "warned-clipboard-not-allowed",
		defaultValue: false,
	});


	const seenAssets = useAppSelector((state) => state.generatedAssets.assets);

	const lastCheckTsRef = useRef(0);
	const alertInFlightRef = useRef(false);
	const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const navigateForClipboard = useEventCallback(
		async (
			value: string,
			classification: InputClassification,
			parseBitcoinInput: typeof import("@/lib/parse").parseBitcoinInput,
		) => {
			if (classification === InputClassification.NOFFER) {
				history.push({ pathname: "/send", state: { input: value } });
				return;
			}

			const parsed = await parseBitcoinInput(value, classification);

			if (parsed.type === InputClassification.LNURL_WITHDRAW) {
				history.push({
					pathname: "/sources",
					state: { parsedLnurlW: parsed },
				});
				return;
			}

			if (parsed.type === InputClassification.NPROFILE) {
				history.push({
					pathname: "/sources",
					state: { parsedNprofile: parsed },
				});
				return;
			}

			history.push({
				pathname: "/send",
				state: { input: parsed.data },
			});
		},
	);

	const checkClipboard = useEventCallback(async () => {
		const now = Date.now();
		if (now - lastCheckTsRef.current < CLIPBOARD_THROTTLE_MS) return;
		lastCheckTsRef.current = now;


		if (!document.hasFocus()) return;
		if (document.visibilityState !== "visible") return;
		if (alertInFlightRef.current) return;

		let text = "";
		try {
			const { type, value } = await Clipboard.read();
			if (warned) setWarned(false);
			if (type === "text/plain" && typeof value === "string") {
				text = value.trim();
			}
		} catch (err: unknown) {
			const name = err && typeof err === "object" && "name" in err ? err.name : undefined;
			if (name === "NotAllowedError" && !warned) {
				showAlert({
					header: "Clipboard Permission Denided",
					message:
						"Shockwallet reads your clipboard to prompt you to use data on your clipboard",
					onDidPresent: () => setWarned(true),
				});
			}
			return;
		}

		if (!text) return;

		let identifyBitcoinInput: typeof import("@/lib/parse").identifyBitcoinInput;
		let parseBitcoinInput: typeof import("@/lib/parse").parseBitcoinInput;
		try {
			({ identifyBitcoinInput, parseBitcoinInput } = await import("@/lib/parse"));
		} catch (err) {
			console.error("Failed to lazy-load '@/lib/parse'", err);
			return;
		}

		const { classification, value } = identifyBitcoinInput(text);
		if (
			!value ||
			value.length === 0 ||
			classification === InputClassification.UNKNOWN
		) {
			return;
		}

		if ((seenAssets || []).includes(value)) return;
		if (alertInFlightRef.current) return;

		alertInFlightRef.current = true;

		const { role } = await showAlert({
			header: "Clipboard Detected",
			subHeader: "Do you want to use the content from your clipboard?",
			message: truncateTextMiddle(value, 20),
			buttons: [
				{ text: "No", role: "cancel" },
				{ text: "Yes", role: "confirm" },
			],
		});

		dispatch(addAsset({ asset: value }));
		alertInFlightRef.current = false;

		if (role !== "confirm") return;

		try {
			await navigateForClipboard(value, classification, parseBitcoinInput);
		} catch (err: unknown) {
			console.error("Error parsing clipboard input:", err);
			const message =
				err && typeof err === "object" && "message" in err && typeof err.message === "string"
					? err.message
					: "Unknown error occurred while parsing clipboard input.";
			showAlert({
				header: "Error",
				message,
				buttons: ["OK"],
			});
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
		scheduleCheck();
		return () => {
			if (settleTimerRef.current) {
				clearTimeout(settleTimerRef.current);
			}
		};
	}, [scheduleCheck]);

	const onVisibilityChange = useEventCallback(() => {
		if (document.visibilityState === "visible") {
			scheduleCheck();
		}
	});

	const onAppActive = useEventCallback(() => {
		if (warned) return;
		scheduleCheck();
	});

	useOnAppActive(onAppActive);
	useWindowEvent("focus", scheduleCheck);
	useWindowEvent("visibilitychange", onVisibilityChange);
}
