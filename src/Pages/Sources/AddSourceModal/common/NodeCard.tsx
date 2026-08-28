import { IonSkeletonText } from "@ionic/react";
import { Avatar } from "@/Components/Avatar";
import { SourceReachabilityHint } from "@/Components/Source/SourceReachabilityHint";
import type { ParsedNprofileInput } from "@/lib/types/parse";
import { useBeaconDiscovery } from "@/Hooks/useBeaconDiscovery";

export function NodeCard({ parsed }: { parsed: ParsedNprofileInput }) {
	const beacon = useBeaconDiscovery(parsed);
	const lookingUp = beacon.health === "warmingUp";
	const name = beacon.data?.name.trim() || null;
	const avatarUrl = beacon.data?.avatarUrl;

	return (
		<div className="flex flex-col gap-2">
			<div className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
				<div className="flex items-center gap-2.5">
					<Avatar
						id={parsed.pubkey}
						avatarUrl={avatarUrl}
						size="sm"
						beacon={beacon.health}
					/>
					<div className="min-w-0 flex-1">
						{lookingUp ? (
							<IonSkeletonText animated className="m-0 h-4 w-32 rounded" />
						) : name ? (
							<p className="m-0 truncate text-sm font-semibold text-primary">
								{name}
							</p>
						) : null}
					</div>
				</div>

				<p className="code-string m-0 mt-2 break-all text-[0.65rem] leading-4 text-muted">
					{parsed.pubkey}
				</p>
				{parsed.relays.length === 0 ? (
					<p className="code-string m-0 mt-1 text-[0.65rem] leading-4 text-faint">
						No relays
					</p>
				) : (
					<ul className="m-0 mt-1 list-none p-0">
						{parsed.relays.map((relay) => (
							<li
								key={relay}
								className="code-string break-all text-[0.65rem] leading-4 text-muted"
							>
								{relay}
							</li>
						))}
					</ul>
				)}
			</div>

			{lookingUp ? null : (
				<SourceReachabilityHint
					source={{
						sourceId: parsed.pubkey,
						beaconStale: beacon.health,
						beaconLastSeenAtMs: beacon.lastSeenAtMs,
					}}
				/>
			)}
		</div>
	);
}
