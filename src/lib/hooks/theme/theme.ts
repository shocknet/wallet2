import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { Theme } from "@/State/scoped/backups/identity/schema";




export type EffectiveTheme = Exclude<Theme, "system">

function getPrefersDark(): boolean {
	return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

function computeEffectiveTheme(pref: Theme | null | undefined, prefersDark: boolean): EffectiveTheme {
	if (!pref || pref === "system") return prefersDark ? "dark" : "light";
	return pref;
}


export function useThemeManager() {


	const prefFromDoc = useAppSelector((s) => s.scoped?.identity.draft?.theme.value);
	const pref: Theme = prefFromDoc ?? "system";


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
