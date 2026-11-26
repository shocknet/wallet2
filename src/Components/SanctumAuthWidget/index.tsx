import { useEffect, useId } from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Device } from "@capacitor/device";
import { createSanctumDK, type LifecycleAdapter, type TokensData } from "sanctum-sdk";
import { SANCTUM_URL, WALLET_URL } from "@/constants";
import { useEffectiveTheme } from "@/Hooks/useEffectiveTheme";
import { Capacitor } from "@capacitor/core";

function createNativeLifecycleAdapter(): LifecycleAdapter {
	return {
		subscribe(listener) {
			let active = true;
			const appHandle = App.addListener("appStateChange", ({ isActive }) => {
				if (!active) return;
				listener(isActive ? "foreground" : "background");
			});
			const browserHandle = Browser.addListener("browserFinished", () => {
				if (!active) return;
				listener("foreground");
			});

			return () => {
				active = false;
				void appHandle.then((handle) => handle.remove());
				void browserHandle.then((handle) => handle.remove());
			};
		},
	};
}

type SanctumAuthWidgetProps = {
	onTokensUpdated: (tokensData: TokensData) => void | Promise<void>;
	className?: string;
};

export function SanctumAuthWidget({ onTokensUpdated, className }: SanctumAuthWidgetProps) {
	const rawId = useId();
	const containerId = `sanctum-auth-widget-${rawId.replace(/:/g, "-")}`;
	const effectiveTheme = useEffectiveTheme();


	useEffect(() => {
		let tokensDataRef: TokensData | null = null;

		const isNative = Capacitor.isNativePlatform();
		const sdk = createSanctumDK({
			url: SANCTUM_URL,
			returnTo: isNative ? WALLET_URL : undefined,
			lifecycleAdapter: isNative ? createNativeLifecycleAdapter() : undefined,
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
			theme: effectiveTheme,
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
	}, [containerId, onTokensUpdated, effectiveTheme]);

	return (
		<div
			id={containerId}
			className={className}
		/>
	);
}
