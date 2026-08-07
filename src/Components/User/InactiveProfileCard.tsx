import { IonSkeletonText, IonText } from "@ionic/react";
import { nip19 } from "nostr-tools";
import {
	Identity,
	resolveIdentityRelays,
} from "@/State/identitiesRegistry/types";
import { useGetProfileQuery } from "@/State/api/api";
import { truncateTextMiddle } from "@/lib/format";
import { ProfilePicture } from "./ProfilePicture";
import { resolveProfileDisplayName } from "./resolveProfileDisplayName";
import { IdentityTypeBadge } from "@/Components/User/IdentityTypeBadge";
import { useMemo } from "react";

export function InactiveProfileCard({
	identity,
	onClick,
	className = "",
}: {
	identity: Identity;
	onClick?: () => void;
	className?: string;
}) {
	const relays = useMemo(() => resolveIdentityRelays(identity), [identity]);
	const { data: profile, isLoading } = useGetProfileQuery({
		pubkey: identity.pubkey,
		relays,
	});

	const displayName = resolveProfileDisplayName(profile);
	const npub = nip19.npubEncode(identity.pubkey);

	return (
		<button
			type="button"
			onClick={onClick}
			className={[
				"mb-2 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left",
				"border-[color-mix(in_srgb,var(--app-border)_80%,transparent)]",
				"bg-[var(--app-surface)]",
				"transition-[background-color,border-color] duration-150",
				"hover:bg-[var(--app-surface-hover)]",
				"active:scale-[0.99]",
				className,
			].join(" ")}
		>
			<ProfilePicture
				pubkey={identity.pubkey}
				relays={relays}
				size="sm"
				variant="flat"
			/>

			<div className="min-w-0 flex-1">
				{isLoading ? (
					<IonSkeletonText animated className="m-0 h-4 w-2/3" />
				) : (
					<IonText className="block truncate text-base font-medium text-primary">
						{displayName}
					</IonText>
				)}
				<div className="mt-1.5 flex flex-wrap items-center gap-2">
					<IdentityTypeBadge identity={identity} />
					<span className="font-mono text-xs text-faint">
						{truncateTextMiddle(npub, 8, 6, "…")}
					</span>
				</div>
			</div>
		</button>
	);
}
