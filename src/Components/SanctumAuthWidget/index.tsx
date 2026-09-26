import { useEffect, useId, useRef } from "react";
import { Browser } from "@capacitor/browser";
import { Device } from "@capacitor/device";
import { createSanctumDK, type SanctumDK, type TokensData } from "sanctum-sdk";
import { SANCTUM_URL } from "@/constants";
import { useEffectiveTheme } from "@/Hooks/useEffectiveTheme";

type SanctumAuthWidgetProps = {
	onTokensUpdated: (tokensData: TokensData) => void | Promise<void>;
	className?: string;
};

function createWidgetSdk(): SanctumDK {
	let tokensDataRef: TokensData | null = null;
	return createSanctumDK({
		url: SANCTUM_URL,
		tokenDataAdapter: {
			getTokenData: () => tokensDataRef,
			setTokenData: (tokens) => {
				tokensDataRef = tokens;
			},
			clearTokenData: () => {
				tokensDataRef = null;
			},
		},
		getClientKey: async () => (await Device.getId()).identifier,
	});
}

export function SanctumAuthWidget({ onTokensUpdated, className }: SanctumAuthWidgetProps) {
	const rawId = useId();
	const containerId = `sanctum-auth-widget-${rawId.replace(/:/g, "-")}`;
	const effectiveTheme = useEffectiveTheme();
	const hostRef = useRef<HTMLDivElement>(null);
	const sdkRef = useRef<SanctumDK | null>(null);
	const onTokensUpdatedRef = useRef(onTokensUpdated);
	const themeRef = useRef(effectiveTheme);
	onTokensUpdatedRef.current = onTokensUpdated;
	themeRef.current = effectiveTheme;

	useEffect(() => {
		// The widget attaches a closed shadow root, which can never be removed,
		// so every mount needs its own element.
		const container = document.createElement("div");
		container.id = containerId;
		hostRef.current?.appendChild(container);

		const sdk = createWidgetSdk();
		const unsubTokens = sdk.events.onTokensUpdated((tokensData) => {
			void onTokensUpdatedRef.current(tokensData);
		});
		sdk.widget.mount({
			containerId,
			theme: themeRef.current,
			openAuthWindow: (url) => {
				void Browser.open({ url });
				return null;
			},
			showLogoutButton: false,
		});
		sdkRef.current = sdk;

		return () => {
			sdkRef.current = null;
			unsubTokens();
			void sdk.destroy();
			container.remove();
		};
	}, [containerId]);

	useEffect(() => {
		sdkRef.current?.widget.setTheme(effectiveTheme);
	}, [effectiveTheme]);

	return <div ref={hostRef} className={className} />;
}
