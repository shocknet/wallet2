import { useCallback, useEffect } from "react";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { InputClassification, ParsedLnurlWithdrawInput } from "@/lib/types/parse";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { shellActions } from "@/shell/slice";

export type SourcesPageLocationState = {
	sourceToAdd?: string;
	integrationData?: {
		token: string;
		lnAddress: string;
	};
	inviteToken?: string;
	lnurlWParsedData?: ParsedLnurlWithdrawInput;
};

export function useDeepLinks() {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();

	const enqueueRoute = useCallback((path: string, state?: Record<string, unknown>) => {
		dispatch(
			shellActions.pendingNavSet({
				kind: "route",
				path,
				state,
			}),
		);
	}, [dispatch]);

	const parseDeepLink = useCallback(async (input: string) => {
		try {
			const { identifyBitcoinInput, parseBitcoinInput } = await import(
				"@/lib/parse"
			);
			const { classification, value } = identifyBitcoinInput(input);
			if (classification === InputClassification.UNKNOWN) {
				showToast({ message: "Unknown input", color: "danger" });
				return;
			}

			const parsed = await parseBitcoinInput(value, classification);
			if (parsed.type === InputClassification.LNURL_WITHDRAW) {
				enqueueRoute("/sources", { parsedLnurlW: parsed });
			} else {
				enqueueRoute("/send", {
					// pass the input string as opposed to parsed object because in the case of noffer it needs the selected source
					input: parsed.data,
				});
			}
		} catch (err: unknown) {
			console.error("An error occured when parsing deep link ", input, err);
			showToast({
				header: "An error occured when parsing deeplink",
				message: err instanceof Error ? err.message : "",
				color: "danger",
			});
		}
	}, [showToast, enqueueRoute]);

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
