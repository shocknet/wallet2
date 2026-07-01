import { useEffect, useLayoutEffect, useState } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { selectTheme, Theme } from "@/State/appState/slice";
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";




export type EffectiveTheme = Exclude<Theme, "system">

function getPrefersDark(): boolean {
	return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

function computeEffectiveTheme(pref: Theme, prefersDark: boolean): EffectiveTheme {
	if (pref === "system") return prefersDark ? "dark" : "light";
	return pref;
}

export function ThemeManager() {
	const pref = useAppSelector(selectTheme);
	const [prefersDark, setPrefersDark] = useState(() => getPrefersDark());

	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => setPrefersDark(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	useLayoutEffect(() => {
		const effective = computeEffectiveTheme(pref, prefersDark);
		const root = document.documentElement;
		root.classList.toggle("dark", effective === "dark");
		SystemBars.setStyle({ style: effective === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light });
		StatusBar.setBackgroundColor({ color: effective === "dark" ? "#16191c" : "#f5f7fa" }); // android version < 15
		root.style.colorScheme = effective;
	}, [pref, prefersDark]);

	return null;
}
