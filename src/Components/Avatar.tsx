import { useEffect, useRef, useState } from "react";
import { IonIcon, IonSkeletonText } from "@ionic/react";
import { personCircle } from "ionicons/icons";
import cn from "clsx";
import type { BeaconHealth } from "@/State/scoped/backups/sources/selectors";

const sizeClass = {
	sm: "h-8 w-8",
	md: "h-10 w-10",
} as const;

export type AvatarSize = keyof typeof sizeClass;

export type AvatarProps = {
	// stable id for robohash fallback
	id: string;
	avatarUrl?: string;
	size?: AvatarSize;
	beacon?: BeaconHealth;
	className?: string;
};

function beaconDotClass(state: BeaconHealth): string {
	switch (state) {
		case "fresh":
			return "bg-[var(--ion-color-success)]";
		case "warmingUp":
			return "bg-[var(--ion-color-warning)]";
		case "stale":
			return "bg-[var(--ion-color-danger)]";
	}
}

function robohash(id: string) {
	return `https://robohash.org/${id}.png?bgset=bg1`;
}


export function Avatar({
	id,
	avatarUrl,
	size = "md",
	beacon,
	className,
}: AvatarProps) {
	const [loaded, setLoaded] = useState(false);
	const [failed, setFailed] = useState(false);
	const fallbackUrl = robohash(id);
	const showImg = loaded && !failed;
	const box = sizeClass[size];

	const imgRef = useRef<HTMLImageElement>(null);
	useEffect(() => {
		setLoaded(false);
		setFailed(false);
	}, [avatarUrl, fallbackUrl]);

	useEffect(() => {
		const el = imgRef.current;
		if (!el) return;
		if (el.complete && el.naturalWidth > 0) {
			setLoaded(true);
		}
	}, [avatarUrl, fallbackUrl]);

	return (
		<div className={cn("relative shrink-0", box, className)}>
			<div
				className={cn(
					"overflow-hidden rounded-full bg-[var(--app-surface-muted)]",
					"ring-2 ring-[color-mix(in_srgb,var(--ion-color-primary)_22%,transparent)]",
					"ring-offset-2 ring-offset-[var(--app-surface)]",
					box,
				)}
			>
				{!showImg && !failed ? (
					<IonSkeletonText animated className="m-0 h-full w-full rounded-full" />
				) : null}
				{failed ? (
					<IonIcon icon={personCircle} className="h-full w-full text-muted" />
				) : (
					<img
						ref={imgRef}
						src={avatarUrl ?? fallbackUrl}
						alt=""
						referrerPolicy="no-referrer"
						onLoad={() => setLoaded(true)}
						onError={(e) => {
							const el = e.currentTarget;
							if (avatarUrl && el.src !== fallbackUrl) {
								el.src = fallbackUrl;
								setLoaded(false);
								return;
							}
							setFailed(true);
						}}
						className={cn(
							"h-full w-full object-cover",
							showImg ? "block" : "hidden",
						)}
					/>
				)}
			</div>
			{beacon ? (
				<span
					aria-hidden
					className={cn(
						"absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--app-surface)]",
						beaconDotClass(beacon),
						beacon === "warmingUp" && "animate-pulse",
					)}
				/>
			) : null}
		</div>
	);
}
