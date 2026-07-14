import { IonIcon } from "@ionic/react";
import type { ReactNode } from "react";

type ScreenIntroTone = "primary" | "warning" | "danger";

const toneClasses: Record<
	ScreenIntroTone,
	{ badge: string; icon: string }
> = {
	primary: {
		badge:
			"bg-[color-mix(in_srgb,var(--ion-color-primary)_14%,transparent)]",
		icon: "text-[var(--ion-color-primary)]",
	},
	warning: {
		badge:
			"bg-[color-mix(in_srgb,var(--ion-color-warning)_14%,transparent)]",
		icon: "text-[var(--ion-color-warning)]",
	},
	danger: {
		badge:
			"bg-[color-mix(in_srgb,var(--ion-color-danger)_14%,transparent)]",
		icon: "text-[var(--ion-color-danger)]",
	},
};

/**
 * Compact screen heading: icon badge, title, and supporting copy.
 * Used on focused flows (unlock, bootstrap, empty states).
 */
export function ScreenIntro({
	icon,
	title,
	description,
	tone = "primary",
	className = "",
	children,
}: {
	icon: string;
	title: string;
	description?: string;
	tone?: ScreenIntroTone;
	className?: string;
	children?: ReactNode;
}) {
	const colors = toneClasses[tone];

	return (
		<header
			className={`mb-7 pt-2 text-center flex flex-col items-center ${className}`}
		>
			<div
				className={`
					mb-4 flex size-11 items-center
					justify-center rounded-2xl
					${colors.badge}
					${colors.icon}
				`}
			>
				<IonIcon icon={icon} className="text-xl" />
			</div>

			<h1 className="text-2xl font-semibold tracking-tight text-primary">
				{title}
			</h1>

			{description ? (
				<p className="mt-2 text-sm leading-6 text-muted max-w-sm">
					{description}
				</p>
			) : null}

			{children}
		</header>
	);
}
