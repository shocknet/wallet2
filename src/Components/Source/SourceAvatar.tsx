import { Avatar, type AvatarSize } from "@/Components/Avatar";
import { LightningAddressAvatar } from "@/Components/LightningAddressAvatar";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import type { SourceView } from "@/State/scoped/backups/sources/selectors";

export type SourceAvatarProps = {
	source: SourceView;
	size?: AvatarSize;
	showBeacon?: boolean;
	className?: string;
};


export function SourceAvatar({
	source,
	size,
	showBeacon = true,
	className,
}: SourceAvatarProps) {
	if (source.type === SourceType.LIGHTNING_ADDRESS_SOURCE) {
		return (
			<LightningAddressAvatar
				address={source.sourceId}
				size={size}
				className={className}
			/>
		);
	}

	return (
		<Avatar
			id={source.sourceId}
			avatarUrl={source.beaconAvatarUrl}
			beacon={showBeacon ? source.beaconStale : undefined}
			size={size}
			className={className}
		/>
	);
}
