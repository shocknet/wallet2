import { IonSkeletonText } from "@ionic/react";
import cn from "clsx";
import {
	Identity,
	resolveIdentityRelays,
} from "@/State/identitiesRegistry/types";
import type { RuntimeIdentity } from "@/shell/types";
import { useGetProfileQuery } from "@/State/api/api";

const sizeClass = {
	sm: "size-11",
	md: "size-[4.5rem]",
	lg: "size-[5.75rem]",
} as const;

export type ProfilePictureSize = keyof typeof sizeClass;

interface ProfilePictureProps {
	identity: Identity | RuntimeIdentity;
	size?: ProfilePictureSize;
	/** Flat: hairline border only — no ring glow or shadow. */
	variant?: "default" | "flat";
	className?: string;
}

function robohash(pubkey: string) {
	return `https://robohash.org/${pubkey}.png?bgset=bg1`;
}

export function ProfilePicture({
	identity,
	size = "md",
	variant = "default",
	className,
}: ProfilePictureProps) {
	const { data: profile, isLoading } = useGetProfileQuery({
		pubkey: identity.pubkey,
		relays: resolveIdentityRelays(identity),
	});
	const fallbackUrl = robohash(identity.pubkey);
	const pictureUrl = profile?.picture;

	const isCompact = size === "sm";
	const isFlat = variant === "flat";

	return (
		<div
			className={cn(
				"relative shrink-0 overflow-hidden rounded-full",
				"bg-[var(--app-surface-muted)]",
				isFlat
					? "border border-[var(--app-border)]"
					: isCompact
						? "ring-1 ring-[color-mix(in_srgb,var(--app-border)_90%,transparent)]"
						: [
							"ring-2 ring-[color-mix(in_srgb,var(--ion-color-primary)_22%,transparent)]",
							"ring-offset-2 ring-offset-[var(--app-surface)]",
							"shadow-[0_14px_28px_-18px_rgba(var(--app-box-shadow-color),0.65)]",
						].join(" "),
				sizeClass[size],
				className,
			)}
		>
			{isLoading ? (
				<IonSkeletonText
					animated
					className="m-0 h-full w-full rounded-full"
				/>
			) : (
				<img
					src={pictureUrl ?? fallbackUrl}
					alt=""
					referrerPolicy="no-referrer"
					className="size-full object-cover"
					onError={(e) => {
						const el = e.currentTarget as HTMLImageElement;
						if (el.src !== fallbackUrl) {
							el.src = fallbackUrl;
						}
					}}
				/>
			)}
		</div>
	);
}
