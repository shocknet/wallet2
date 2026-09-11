import { useEffect, useRef } from "react";
import { Clipboard } from "@capacitor/clipboard";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { addAsset } from "@/State/Slices/generatedAssets";
import { InputClassification } from "@/lib/types/parse";
import { useEventCallback } from "@/Hooks/useEventCallback";
import { useLocalStorage } from "@/Hooks/useLocalStorage/useLocalStorage";
import { useWindowEvent } from "@/Hooks/useWindowEvent";
import { selectIsActive } from "@/State/runtime/slice";
import { useClipboardDetectedModal } from "@/Components/Modals/ClipboardDetectedModal";
import { usePromptNoticeModal } from "@/Components/prompt";
import { resolveAppIntent } from "@/intents/resolve";
import { identifyBitcoinInput } from "@/lib/parse";

const CLIPBOARD_THROTTLE_MS = 500;
const FOCUS_SETTLE_DELAY_MS = 50;

export function useWatchClipboard() {
	const showNotice = usePromptNoticeModal();
	const askClipboardDetected = useClipboardDetectedModal();
	const dispatch = useAppDispatch();
	const isAppActive = useAppSelector(selectIsActive);
	const pendingIntent = useAppSelector((state) => state.shell.pendingIntent);
	const pendingIntentRef = useRef(pendingIntent);
	pendingIntentRef.current = pendingIntent;

	const [warned, setWarned] = useLocalStorage({
		key: "warned-clipboard-not-allowed",
		defaultValue: false,
	});

	const seenAssets = useAppSelector((state) => state.generatedAssets.assets || []);

	const lastCheckTsRef = useRef(0);
	const alertInFlightRef = useRef(false);
	const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const remember = (asset: string) => {
		dispatch(addAsset({ asset }));
	};

	const checkClipboard = useEventCallback(async () => {
		if (!isAppActive) return;
		if (!document.hasFocus()) return;
		if (document.visibilityState !== "visible") return;
		if (alertInFlightRef.current) return;
		if (pendingIntentRef.current) return;

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
			try {
				const outcome = await showNotice({
					title: "Clipboard access blocked",
					description: "When you come back to the app, Shockwallet can read a copied invoice or address and offer to use it. Access is blocked in this browser.",
				});
				if (outcome.status === "skipped") {
					return;
				}
				setWarned(true);
			} finally {
				alertInFlightRef.current = false;
			}
			return;
		}

		if (!text) return;

		const { classification, value } = identifyBitcoinInput(text, { disallowed: [InputClassification.BITCOIN_ADDRESS] });
		if (classification === InputClassification.UNKNOWN) return;

		if (seenAssets.includes(value)) return;
		if (alertInFlightRef.current) return;
		if (pendingIntentRef.current) return;

		alertInFlightRef.current = true;
		try {
			const outcome = await askClipboardDetected({ value });
			if (outcome.status === "skipped") {
				return;
			}
			if (outcome.value.role !== "confirm") {
				remember(value);
				return;
			}

			await dispatch(resolveAppIntent(value));
			remember(value);
		} catch (err: unknown) {
			console.error("Error parsing clipboard input:", err);
			const message =
				err instanceof Error
					? err.message
					: "Could not use the clipboard content.";
			await showNotice({
				title: "Error",
				description: message,
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
