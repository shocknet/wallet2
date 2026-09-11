import { useEffect, useRef } from "react";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { useHistory } from "react-router-dom";
import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch } from "@/State/store/hooks";
import { useEventCallback } from "@/Hooks/useEventCallback";
import { resolveAppUrlOpen, resolveLocationHref } from "./resolve";

export function useDeepLinks() {
	const dispatch = useAppDispatch();
	const history = useHistory();
	const { showToast } = useToast();

	const ingest = useEventCallback(async (
		raw: string,
		resolve: typeof resolveLocationHref | typeof resolveAppUrlOpen,
	) => {
		try {
			const { stripAddSourceQuery } = await dispatch(resolve(raw));
			if (stripAddSourceQuery) {
				history.replace({
					pathname: history.location.pathname,
					search: "",
				});
			}
		} catch (err: unknown) {
			console.error("An error occured when parsing deep link ", raw, err);
			showToast({
				header: "An error occured when parsing deep link",
				message: err instanceof Error ? err.message : "Error parsing deep link",
				color: "danger",
			});
		}
	});

	const hydratedRef = useRef(false);
	useEffect(() => {
		if (hydratedRef.current) return;
		hydratedRef.current = true;
		void ingest(window.location.href, resolveLocationHref);
	}, [ingest]);

	useEffect(() => {
		const listener = App.addListener(
			"appUrlOpen",
			(event: URLOpenListenerEvent) => {
				void ingest(event.url, resolveAppUrlOpen);
			},
		);

		return () => {
			void listener.then((r) => r.remove());
		};
	}, [ingest]);
}
