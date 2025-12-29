import type { NprofileView, SourceView } from "@/State/scoped/backups/sources/selectors"
import { IonAvatar, IonIcon, IonLabel, IonSkeletonText } from "@ionic/react"
import { alertCircleOutline, personCircle } from "ionicons/icons";
import { useState } from "react";
import cn from "clsx";
import { SourceType } from "@/State/scoped/common";
import { formatSatoshi } from "@/lib/units";


interface SelectSourceProps {
	source: SourceView;
}
export const SelectedSource = ({ source }: SelectSourceProps) => {
	return (
		<>
			<SourceAvatar slot="start" avatarUrl={`https://robohash.org/${source.sourceId}.png?bgset=bg1`} />
			{
				source.type === SourceType.NPROFILE_SOURCE
					?
					<SelectedNprofile source={source} />
					:
					<IonLabel >
						<span className="text-lg text-medium truncate">{source.label || source.sourceId}</span>
					</IonLabel>
			}
		</>
	);
}

const SelectedNprofile = ({ source }: { source: NprofileView }) => {
	return (
		<IonLabel className="flex flex-col">
			<span className="flex gap-1 justify-start items-center">
				<span className="text-lg text-medium truncate">
					{source.label || source.beaconName || "Pub source"}
				</span>
				<span className="text-quiet">•</span>
				<span className="text-base text-low">{formatSatoshi(source.maxWithdrawableSats)} sats</span>
			</span>
			{
				source.beaconStale
				&&
				<span className="flex items-center justify-start gap-1">
					<IonIcon icon={alertCircleOutline} color="warning" />
					<span className="text-sm text-[var(--ion-color-warning)]">stale source</span>
				</span>
			}
		</IonLabel>
	);
}



export const SourceSelectOption = ({ source }: SelectSourceProps) => {
	return (
		<>
			<SourceAvatar slot="start" avatarUrl={`https://robohash.org/${source.sourceId}.png?bgset=bg1`} />
			{
				source.type === SourceType.NPROFILE_SOURCE
					?
					<NprofileSelectOption source={source} />
					:
					<IonLabel >
						<span className="text-lg text-medium truncate">{source.label || source.sourceId}</span>
					</IonLabel>
			}
		</>
	);
}

const NprofileSelectOption = ({ source }: { source: NprofileView }) => {
	return (
		<IonLabel className="flex flex-col">
			<div className="text-lg text-medium truncate">
				{source.label || source.beaconName || "Pub source"}
			</div>

			<div className="text-base text-low ">{formatSatoshi(source.maxWithdrawableSats)} sats</div>

			{
				source.beaconStale
				&&
				<span className="flex items-center justify-start gap-1">
					<IonIcon icon={alertCircleOutline} color="warning" />
					<span className="text-sm text-[var(--ion-color-warning)]">stale source</span>
				</span>
			}

		</IonLabel>
	);
}



interface SourceAvatarProps extends React.ComponentProps<typeof IonAvatar> {
	avatarUrl: string;
}
const SourceAvatar = ({ avatarUrl, ...props }: SourceAvatarProps) => {
	const [loaded, setLoaded] = useState(false);
	const [failed, setFailed] = useState(false);

	const showImg = loaded && !failed;

	return (
		<IonAvatar {...props} className="w-9 h-9">
			{/* Skeleton while loading */}
			{(!showImg && !failed) && (
				<IonSkeletonText
					animated
					className="w-full h-full rounded-full"
				/>
			)}

			{/* Fallback if no URL or error */}
			{(failed) && (
				<IonIcon icon={personCircle} className="w-full h-full" />
			)}

			{/* Real image */}
			{!failed && (
				<img
					src={avatarUrl}
					alt="avatar"
					onLoad={() => setLoaded(true)}
					onError={() => setFailed(true)}
					className={cn(
						"w-full h-full object-cover rounded-full",
						showImg ? "inline-block" : "hidden"
					)}
				/>
			)}
		</IonAvatar>
	)
}
