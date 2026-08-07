import { IonSkeletonText } from "@ionic/react";
import { nip19 } from "nostr-tools";
import {
	Identity,
	resolveIdentityRelays,
} from "@/State/identitiesRegistry/types";
import { useGetProfileQuery } from "@/State/api/api";
import { truncateTextMiddle } from "@/lib/format";
import { ProfilePicture } from "./ProfilePicture";
import { Nip05 } from "./Nip05";
import { resolveProfileDisplayName } from "./resolveProfileDisplayName";
import { IdentityTypeBadge } from "./IdentityTypeBadge";

interface ProfileCardProps {
	identity: Identity;
	variant?: "flat" | "elevated";
	className?: string;
}

export function ProfileCard({
	identity,
	variant = "flat",
	className,
}: ProfileCardProps) {
	const relays = resolveIdentityRelays(identity);
	const { data: profile, isLoading } = useGetProfileQuery({
		pubkey: identity.pubkey,
		relays: resolveIdentityRelays(identity),
	});

	const name = resolveProfileDisplayName(profile);
	const nip05 = profile?.nip05;
	const npub = nip19.npubEncode(identity.pubkey);
	const elevated = variant === "elevated";

	return (
		<div
			className={[
				elevated
					? [
						"relative w-full overflow-hidden rounded-[1.35rem]",
						"bg-[var(--app-surface)]",
						"border border-[color-mix(in_srgb,var(--app-border)_85%,transparent)]",
						"shadow-[0_22px_48px_-30px_rgba(var(--app-box-shadow-color),0.7)]",
						"px-5 pb-5 pt-7",
					].join(" ")
					: [
						"w-full rounded-xl",
						"bg-[var(--app-surface)]",
						"border border-[var(--app-border)]",
						"px-5 py-6",
					].join(" "),
				className ?? "",
			].join(" ")}
		>
			{elevated ? (
				<div
					aria-hidden
					className="
						pointer-events-none absolute inset-x-0 top-0 h-28
						bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--ion-color-primary)_16%,transparent),transparent_72%)]
					"
				/>
			) : null}

			<div
				className={[
					"flex flex-col items-center text-center",
					elevated ? "relative" : "",
				].join(" ")}
			>
				<ProfilePicture
					pubkey={identity.pubkey}
					relays={relays}
					size="lg"
					variant={elevated ? undefined : "flat"}
				/>

				<div className="mt-4 w-full min-w-0">
					{isLoading ? (
						<div className="flex flex-col items-center gap-2">
							<IonSkeletonText
								animated
								className="m-0 h-5 w-40 rounded-md"
							/>
							<IonSkeletonText
								animated
								className="m-0 h-4 w-28 rounded-md"
							/>
						</div>
					) : (
						<>
							<h2 className="truncate text-xl font-semibold tracking-tight text-primary">
								{name}
							</h2>

							{nip05 ? (
								<div className="mt-2.5 flex justify-center">
									<Nip05
										nip05={nip05}
										pubkey={identity.pubkey}
									/>
								</div>
							) : null}
						</>
					)}
				</div>

				<div className="mt-4 flex flex-wrap items-center justify-center gap-2">
					<IdentityTypeBadge identity={identity} />

					<span className="font-mono text-xs text-faint">
						{truncateTextMiddle(npub, 10, 8, "…")}
					</span>
				</div>
			</div>
		</div>
	);
}
