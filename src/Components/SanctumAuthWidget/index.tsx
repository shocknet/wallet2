import { useEffect, useId } from "react";
import { Browser } from "@capacitor/browser";
import { Device } from "@capacitor/device";
import { createSanctumDK, type TokensData } from "sanctum-sdk";
import { SANCTUM_URL } from "@/constants";

type SanctumAuthWidgetProps = {
	onTokensUpdated: (tokensData: TokensData) => void | Promise<void>;
	className?: string;
};

export function SanctumAuthWidget({ onTokensUpdated, className }: SanctumAuthWidgetProps) {
	const rawId = useId();
	const containerId = `sanctum-auth-widget-${rawId.replace(/:/g, "-")}`;


	useEffect(() => {
		let tokensDataRef: TokensData | null = null;

		const sdk = createSanctumDK({
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

		const unsubTokens = sdk.events.onTokensUpdated((tokensData) => {
			void onTokensUpdated(tokensData);
		});

		sdk.widget.mount({
			containerId,
			theme: "system",
			openAuthWindow: (url) => {
				void Browser.open({ url });
				return null;
			},
			showLogoutButton: false,
		});

		return () => {
			unsubTokens();
			sdk.widget.unmount();
			void sdk.destroy();
		};
	}, [containerId, onTokensUpdated]);

	return (
		<div
			id={containerId}
			className={className}
		/>
	);
}
