import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { useAlert } from "../contexts/useAlert";
import { useHistory } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";
import { Clipboard } from "@capacitor/clipboard";
import { InputClassification } from "../types/parse";
import { truncateTextMiddle } from "../format";
import { addAsset } from "@/State/Slices/generatedAssets";
import { useEventCallback } from "../hooks/useEventCallbck/useEventCallback";
import { useAppStateChange } from "../hooks/useAppStateChange/useAppStateChange";
import { useLocalStorage } from "../hooks/useLocalStorage/useLocalStorage";


const CLIPBOARD_THROTTLE_MS = 500;

const FOCUS_SETTLE_DELAY_MS = 50;

export const useWatchClipboard = () => {
	const { showAlert } = useAlert();
	const dispatch = useAppDispatch();
	const history = useHistory();
	const [warned, updateWraned] = useLocalStorage({ key: "warned-clipboard-not-allowed", defaultValue: false });


	const isBootstrapped = useAppSelector(state => state.appState.bootstrapped);
	const seenAssets = useAppSelector(state => state.generatedAssets.assets);


	const lastCheckTsRef = useRef(0);
	const alertInFlightRef = useRef(false);
	const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


	const checkClipboard = useEventCallback(async () => {

		const now = Date.now();
		if (now - lastCheckTsRef.current < CLIPBOARD_THROTTLE_MS) return;

		lastCheckTsRef.current = now;


		if (!isBootstrapped) return;


		if (!document.hasFocus()) return;
		if (document.visibilityState !== "visible") return;


		if (alertInFlightRef.current) return;


		let text = "";
		try {
			const { type, value } = await Clipboard.read();
			if (warned) updateWraned(false)
			if (type === "text/plain" && typeof value === "string") {
				text = value.trim();
			}
		} catch (err: any) {
			if (err?.name === "NotAllowedError" && !warned) {
				showAlert({
					header: "Clipboard Permission Denided",
					message: "Shockwallet reads your clipboard to prompt you to use data on your clipboard",
					onDidPresent: () => updateWraned(true)
				});
			}
			return;
		}


		if (!text) return;


		let identifyBitcoinInput: any;
		let parseBitcoinInput: any;
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


		if ((seenAssets || []).includes(value)) {
			return;
		}


		if (alertInFlightRef.current) {
			return;
		}


		alertInFlightRef.current = true;


		const handleYes = async () => {
			try {
				const parsed = await parseBitcoinInput(value, classification);


				if (parsed.type === InputClassification.LNURL_WITHDRAW) {
					history.push({
						pathname: "/sources",
						state: { parsedLnurlW: parsed }
					});
					return;
				}


				history.push({
					pathname: "/send",
					state: {
						// pass the input string as opposed to parsed object because in the case of noffer it needs the selected source
						input: parsed.data
					}
				});
			} catch (err: any) {
				console.error("Error parsing clipboard input:", err);
				showAlert({
					header: "Error",
					message: err?.message || "Unknown error occurred while parsing clipboard input.",
					buttons: ["OK"]
				});
			}
		};


		showAlert({
			header: "Clipboard Detected",
			subHeader: "Do you want to use the content from your clipboard?",
			message: truncateTextMiddle(value, 20),
			onWillPresent: () => alertInFlightRef.current = true,
			buttons: [
				{
					text: "No",
					role: "cancel",
				},
				{
					text: "Yes",
					role: "confirm",
				}
			]
		}).then(({ role }) => {
			dispatch(addAsset({ asset: value }));
			alertInFlightRef.current = false;
			if (role === "confirm") handleYes();
		})
	});

	const throttle = useCallback(() => {

		if (settleTimerRef.current) {
			clearTimeout(settleTimerRef.current);
		}
		settleTimerRef.current = setTimeout(() => {
			checkClipboard();
		}, FOCUS_SETTLE_DELAY_MS);

	}, [checkClipboard])


	useEffect(() => {
		throttle();
	}, [throttle])


	useAppStateChange({
		onChange: (next, prev) => {
			if (warned) return;
			if (next && !prev) {

				throttle();
			}
		}
	})

};
