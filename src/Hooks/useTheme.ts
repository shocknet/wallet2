import { useLayoutEffect } from "react";
import { EffectiveTheme, useEffectiveTheme } from "./useEffectiveTheme";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";


export function useTheme() {
	const effective = useEffectiveTheme();

	useLayoutEffect(() => {
		applyTheme(effective);
	}, [effective]);
}

export function applyTheme(effective: EffectiveTheme) {
	const root = document.documentElement;
	const isDark = effective === "dark";

	root.classList.toggle("dark", isDark);
	root.style.colorScheme = effective;

	if (!Capacitor.isNativePlatform()) {
		return;
	}

	SystemBars.setStyle({
		style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
	});
	StatusBar.setBackgroundColor({
		color: isDark ? "#15191c" : "#f5f7fa",
	});
}
