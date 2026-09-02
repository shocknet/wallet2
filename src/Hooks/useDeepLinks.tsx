import { useCallback, useEffect } from "react";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { InputClassification, type ParsedLnurlWithdrawInput } from "@/lib/types/parse";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { shellActions } from "@/shell/slice";
import { identifyBitcoinInput, parseBitcoinInput } from "@/lib/parse";
import { isSendParsedInput, type SendPageNavState } from "@/Pages/Send/nav";
import type { SourcesPageNavState } from "@/Pages/Sources/nav";

export function useDeepLinks() {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();

	const enqueueRoute = useCallback((path: string, state?: object) => {
		dispatch(
			shellActions.pendingNavSet({
				kind: "route",
				path,
				state: state as Record<string, unknown> | undefined,
			}),
		);
	}, [dispatch]);

	const enqueueSweepLnurlw = useCallback((parsed: ParsedLnurlWithdrawInput) => {
		dispatch(
			shellActions.pendingNavSet({
				kind: "sweep-lnurlw",
				parsed,
			}),
		);
	}, [dispatch]);

	const parseDeepLink = useCallback(async (input: string) => {
		const { classification, value } = identifyBitcoinInput(input);
		if (classification === InputClassification.UNKNOWN) {
			throw new Error("Unknown input");
		}

		try {
			const parsed = await parseBitcoinInput(value, classification);
			if (parsed.type === InputClassification.LNURL_WITHDRAW) {
				enqueueSweepLnurlw(parsed);
				return;
			}
			if (parsed.type === InputClassification.NPROFILE) {
				const state: SourcesPageNavState = { parsedNprofile: parsed };
				enqueueRoute("/sources", state);
				return;
			}
			if (isSendParsedInput(parsed)) {
				const state: SendPageNavState = { parsed };
				enqueueRoute("/send", state);
				return;
			}
			throw new Error(`${parsed.type} not usuable`);
		} catch (err: unknown) {
			console.error("An error occured when parsing deep link ", input, err);
			showToast({
				header: "An error occured when parsing deeplink",
				message: err instanceof Error ? err.message : "Error parsing deep link",
				color: "danger",
			});
		}
	}, [showToast, enqueueRoute, enqueueSweepLnurlw]);

	useEffect(() => {
		const listener = App.addListener(
			"appUrlOpen",
			(event: URLOpenListenerEvent) => {
				const slug = event.url.split(".app").pop();
				if (slug) {
					enqueueRoute(slug);
				} else {
					void parseDeepLink(event.url);
				}
			},
		);

		return () => {
			void listener.then((r) => r.remove());
		};
	}, [parseDeepLink, enqueueRoute]);
}
