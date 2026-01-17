import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { selectTheme, Theme } from "@/State/appState/slice";




export type EffectiveTheme = Exclude<Theme, "system">

function getPrefersDark(): boolean {
	return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

function computeEffectiveTheme(pref: Theme, prefersDark: boolean): EffectiveTheme {
	if (pref === "system") return prefersDark ? "dark" : "light";
	return pref;
}


export function useThemeManager() {


	const pref = useAppSelector(selectTheme);



	const [prefersDark, setPrefersDark] = useState<boolean>(() => getPrefersDark());

	useEffect(() => {
		const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
		if (!mq) return;

		const onChange = () => setPrefersDark(mq.matches);

		// Modern + Safari fallback
		mq.addEventListener?.("change", onChange);
		mq.addListener?.(onChange);

		return () => {
			mq.removeEventListener?.("change", onChange);
			mq.removeListener?.(onChange);
		};
	}, []);

	const effective: EffectiveTheme = useMemo(
		() => computeEffectiveTheme(pref, prefersDark),
		[pref, prefersDark]
	);



	useLayoutEffect(() => {
		const root = document.documentElement;

		root.classList.toggle("dark", effective === "dark");


		root.style.colorScheme = effective;
	}, [effective]);

	return null;
}
