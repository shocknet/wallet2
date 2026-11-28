import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import type { SourceView } from "@/State/scoped/backups/sources/selectors";
import { useSourceView } from "@/Hooks/useSourceView";
import { useAppSelector } from "@/State/store/hooks";
import { IonIcon } from "@ionic/react";
import { star, walletOutline } from "ionicons/icons";
import { formatSatoshi } from "@/lib/units";
import { Satoshi } from "@/lib/types/units";
import { Avatar } from "@/Components/Avatar";


interface Props {
	sourceId: string;
	onClick: (s: SourceView) => void;
}
const SourceCard = ({ sourceId, onClick: onPick }: Props) => {
	const source = useSourceView(sourceId);
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);

	if (!source) return null;
	const pub = source.beaconName?.trim() || "";
	const label = source.label?.trim() || "";
	const title = pub || label || "Anonymous";
	const subtitle = pub && label && pub.toLowerCase() !== label.toLowerCase() ? label : "";
	const isFavorite = favoriteSourceId === source.sourceId;
	const ariaLabel = subtitle ? `Open source ${title}, ${subtitle}` : `Open source ${title}`;

	return (
		<button
			type="button"
			className="
				mb-3 flex w-full items-center gap-5 rounded-2xl border
				py-3 pl-5 pr-3 text-left
				border-[color-mix(in_srgb,var(--app-border)_80%,transparent)]
				bg-[var(--app-surface)] shadow-[var(--wallet-box-shadow)]
				transition-[background-color,transform] duration-150
				hover:bg-[var(--app-surface-hover)] active:scale-[0.99]
			"
			onClick={() => onPick(source)}
			aria-label={ariaLabel}
		>
			<Avatar
				id={source.sourceId}
				avatarUrl={source.beaconAvatarUrl}
				beacon={source.beaconStale}
				size="md"
			/>
			<div className="min-w-0 flex-1">
				<div className="flex min-w-0 items-center gap-1.5">
					<p className="m-0 min-w-0 truncate text-base font-semibold tracking-tight text-primary">
						{title}
					</p>
					{isFavorite ? (
						<IonIcon
							color="primary"
							className="shrink-0 text-sm"
							icon={star}
							aria-label="Favorite source"
						/>
					) : null}
				</div>
				<p className="m-0 mt-0.5 h-5 truncate text-sm leading-5 text-muted">
					{subtitle}
				</p>
				<p className="m-0 mt-1.5 flex items-center gap-1.5 text-sm text-muted tabular-nums">
					<IonIcon icon={walletOutline} className="shrink-0 text-[0.95rem] text-faint" aria-hidden />
					{formatSatoshi(source.balanceSats ?? 0 as Satoshi)} sats
				</p>
			</div>
		</button>
	);
};

export default SourceCard;
