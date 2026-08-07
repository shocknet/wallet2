import { IonSkeletonText } from "@ionic/react";
import { nip19 } from "nostr-tools";
import { useGetProfileQuery } from "@/State/api/api";
import { truncateTextMiddle } from "@/lib/format";
import { NOSTR_RELAYS } from "@/constants";
import { Nip05 } from "@/Components/User/Nip05";
import { ProfilePicture } from "@/Components/User/ProfilePicture";
import { resolveProfileDisplayName } from "@/Components/User/resolveProfileDisplayName";

export function ClinkRequestIdentityView({
	pubkey,
	relays,
}: {
	pubkey: string;
	relays?: string[];
}) {
	const profileRelays = relays?.length ? relays : NOSTR_RELAYS;
	const { data: profile, isLoading } = useGetProfileQuery({
		pubkey,
		relays: profileRelays,
	});

	const name = resolveProfileDisplayName(profile);
	const nip05 = profile?.nip05;
	const npub = nip19.npubEncode(pubkey);

	return (
		<div className="flex flex-col items-center text-center">
			<div className="rounded-full bg-[color-mix(in_srgb,var(--ion-color-primary)_10%,transparent)] p-1.5">
				<ProfilePicture
					pubkey={pubkey}
					relays={profileRelays}
					size="md"
					variant="default"
				/>
			</div>

			{isLoading ? (
				<div className="mt-4 flex w-full flex-col items-center gap-2">
					<IonSkeletonText animated className="m-0 h-5 w-40 rounded-md" />
					<IonSkeletonText animated className="m-0 h-4 w-28 rounded-md" />
				</div>
			) : (
				<div className="mt-4 w-full min-w-0">
					<h2 className="truncate text-xl font-semibold tracking-tight text-primary">
						{name}
					</h2>
					{nip05 ? (
						<div className="mt-2.5 flex justify-center">
							<Nip05 nip05={nip05} pubkey={pubkey} />
						</div>
					) : null}
				</div>
			)}

			<span className="mt-2.5 font-mono text-[0.7rem] tracking-wide text-faint">
				{truncateTextMiddle(npub, 12, 8, "…")}
			</span>
		</div>
	);
}
