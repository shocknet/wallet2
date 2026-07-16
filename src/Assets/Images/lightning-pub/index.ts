import lpMarkDark from "@/Assets/Images/lightning-pub/dark/lp-mark.svg";
import lpMarkLight from "@/Assets/Images/lightning-pub/light/lp-mark.svg";
import lightningPubWordmarkDark from "@/Assets/Images/lightning-pub/dark/lightning-pub-full.svg";
import lightningPubWordmarkLight from "@/Assets/Images/lightning-pub/light/lightning-pub-full.svg";
import {
	useEffectiveTheme,
	type EffectiveTheme,
} from "@/Hooks/useEffectiveTheme";

export type { EffectiveTheme };

export type LightningPubLogoVariant = "mark" | "full";

/**
 * Responsive nav mark height (no fixed px). `rem` scales with the user's
 * font-size/density settings so the mark stays proportional inside the Ionic
 * toolbar across phone, tablet and web.
 */
export const LIGHTNING_PUB_MARK_HEIGHT = {
	nav: "clamp(2.75rem, 5vw, 3rem)",
	inline: "1.4rem",
} as const;

/**
 * Responsive full-wordmark height (no fixed px). Height-anchored with
 * `width: auto` so the wide wordmark keeps its aspect ratio and stays a single
 * line in the toolbar while scaling with the user's font-size/density.
 */
export const LIGHTNING_PUB_WORDMARK_HEIGHT = {
	nav: "1.625rem",
} as const;

const LOGOS = {
	mark: { dark: lpMarkDark, light: lpMarkLight },
	full: { dark: lightningPubWordmarkDark, light: lightningPubWordmarkLight },
} as const;

/** Dark UI uses light-on-dark assets; light UI uses dark-on-light assets. */
export function getLightningPubLogoSrc(
	variant: LightningPubLogoVariant,
	theme: EffectiveTheme,
): string {
	return LOGOS[variant][theme];
}

export function useLightningPubLogo(variant: LightningPubLogoVariant): string {
	const theme = useEffectiveTheme();
	return getLightningPubLogoSrc(variant, theme);
}

export { useEffectiveTheme };
