import swMarkDark from "@/Assets/Images/wallet-avatar/dark/sw-mark.svg";
import swMarkLight from "@/Assets/Images/wallet-avatar/light/sw-mark.svg";
import shockWalletWordmarkDark from "@/Assets/Images/wallet-avatar/dark/shock-wallet.svg";
import shockWalletWordmarkLight from "@/Assets/Images/wallet-avatar/light/shock-wallet.svg";
import {
	useEffectiveTheme,
	type EffectiveTheme,
} from "@/Hooks/useEffectiveTheme";

/**
 * Responsive logo heights (no fixed px).
 * - nav: `rem` so the mark scales with the user's font-size/density settings
 *   while staying proportional inside the Ionic toolbar across phone/tablet/web.
 * - hero: `clamp()` so the onboarding display mark also scales with viewport
 *   width — smaller on phones, larger on tablets/desktop.
 * - welcome: centred SHOCK WALLET wordmark for setup/onboarding screens.
 */
export const WALLET_AVATAR_HEIGHT = {
	nav: "clamp(2.75rem, 5vw, 3rem)",
	hero: "clamp(2.5rem, 7vw, 3.5rem)",
	welcome: "clamp(2.25rem, 10vw, 3.75rem)",
} as const;

const MARKS = {
	dark: swMarkDark,
	light: swMarkLight,
} as const;

const WELCOME_WORDMARKS = {
	dark: shockWalletWordmarkDark,
	light: shockWalletWordmarkLight,
} as const;

export function getWalletAvatarSrc(theme: EffectiveTheme): string {
	return MARKS[theme];
}

export function getWalletWelcomeWordmarkSrc(theme: EffectiveTheme): string {
	return WELCOME_WORDMARKS[theme];
}

export function useWalletAvatar(): string {
	const theme = useEffectiveTheme();
	return getWalletAvatarSrc(theme);
}

export function useWalletWelcomeWordmark(): string {
	const theme = useEffectiveTheme();
	return getWalletWelcomeWordmarkSrc(theme);
}
