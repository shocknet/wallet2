import { useCallback, useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { InputClassification, ParsedLnurlWithdrawInput } from '@/lib/types/parse';
import { useHistory } from 'react-router';
import { useToast } from '@/lib/contexts/useToast';

export type SourcesPageLocationState = {
	sourceToAdd?: string
	integrationData?: {
		token: string;
		lnAddress: string;
	}
	inviteToken?: string;
	lnurlWParsedData?: ParsedLnurlWithdrawInput;
}

export const useAppUrlListener = () => {
	const history = useHistory();
	const { showToast } = useToast();


	const parseDeepLink = useCallback(async (input: string) => {
		try {
			const { identifyBitcoinInput, parseBitcoinInput } = await import("@/lib/parse")
			const { classification, value } = identifyBitcoinInput(input);
			if (classification === InputClassification.UNKNOWN) {
				showToast({ message: "Unknown input", color: "danger" });
				return;
			}

			const parsed = await parseBitcoinInput(value, classification);
			if (parsed.type === InputClassification.LNURL_WITHDRAW) {
				history.push({
					pathname: "/sources",
					state: { parsedLnurlW: parsed }
				})
			} else {
				history.push({
					pathname: "/send",
					state: {
						// pass the input string as opposed to parsed object because in the case of noffer it needs the selected source
						input: parsed.data
					}
				})
			}
		} catch (err: any) {
			console.error("An error occured when parsing deep link ", input, err);
			showToast({
				header: "An error occured when parsing deeplink",
				message: err?.message || "",
				color: "danger"
			});
		}

	}, [history, showToast]);

	useEffect(() => {

		const listener = App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
			const slug = event.url.split(".app").pop();
			if (slug) {
				history.push(slug);
			} else {
				parseDeepLink(event.url); // Not a url
			}
		});

		return () => {
			listener.then((r) => r.remove());
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
};


