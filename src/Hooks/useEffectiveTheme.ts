import { useEffect, useState } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { selectTheme, type Theme } from "@/State/appState/slice";


export type EffectiveTheme = Exclude<Theme, "system">;

function getPrefersDark() {
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}


export function useEffectiveTheme(): EffectiveTheme {
	const preference = useAppSelector(selectTheme);
	const [prefersDark, setPrefersDark] = useState(() => getPrefersDark());

	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => setPrefersDark(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	return computeEffectiveTheme(preference, prefersDark);
}



function computeEffectiveTheme(
	preference: Theme,
	prefersDark: boolean,
): EffectiveTheme {
	if (preference === "system") {
		return prefersDark ? "dark" : "light";
	}

	return preference;
}
