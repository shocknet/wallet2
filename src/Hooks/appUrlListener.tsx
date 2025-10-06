import { useCallback, useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { InputClassification } from '@/lib/types/parse';
import { useHistory } from 'react-router';
import { parseBitcoinInput as legacyParseBitcoinInput } from '@/constants';
import { useToast } from '@/lib/contexts/useToast';

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
				const legacyParsedLnurlW = await legacyParseBitcoinInput(input);
				history.push({
					pathname: "/sources",
					state: legacyParsedLnurlW
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
		App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
			try {
				const url = new URL(event.url);
				if (
					url.pathname === "/sources" &&
					(
						url.searchParams.get("addSource") ||
						url.searchParams.get("lnAddress") ||
						url.searchParams.get("token") ||
						url.searchParams.get("inviteToken")
					)
				) {
					history.push(url.pathname + url.search);
				} else {
					showToast({
						message: "Usupported deeplink",
						color: "danger"
					});
				}
			} catch { // Not a url
				parseDeepLink(event.url);
			}

		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
};


