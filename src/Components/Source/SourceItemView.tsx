import type { ReactNode } from "react";
import { IonIcon, IonItem } from "@ionic/react";
import { checkmarkCircle, star, walletOutline } from "ionicons/icons";
import cn from "clsx";
import { Avatar } from "@/Components/Avatar";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import type {
	NprofileView,
	SourceView,
} from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import { formatSatoshi } from "@/lib/units";

export type SourceItemViewProps = {
	source: SourceView;
	selected?: boolean;
	showFavorite?: boolean;
	showBalance?: boolean;
	showBeacon?: boolean;
	onClick?: () => void;
	end?: ReactNode;
	className?: string;
};


export function SourceItemView({
	source,
	selected = false,
	showFavorite = true,
	showBalance = true,
	showBeacon = true,
	onClick,
	end,
	className,
}: SourceItemViewProps) {
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const isFavorite = showFavorite && favoriteSourceId === source.sourceId;
	const label = sourceDisplayName(source);
	const interactive = typeof onClick === "function";
	const nprofile =
		source.type === SourceType.NPROFILE_SOURCE
			? (source as NprofileView)
			: null;

	const endSlot =
		end !== undefined ? (
			end
		) : selected ? (
			<IonIcon
				icon={checkmarkCircle}
				color="primary"
				className="text-xl"
				aria-label="Selected"
			/>
		) : null;

	return (
		<IonItem
			button={interactive}
			detail={false}
			onClick={onClick}
			aria-label={interactive ? `Select source ${label}` : label}
			aria-pressed={interactive ? selected : undefined}
			className={cn(
				"[--background:transparent]",
				selected &&
				"![--background:color-mix(in_srgb,var(--ion-color-primary)_10%,var(--ion-item-background,var(--app-surface)))]",
				className,
			)}
		>
			<div slot="start" className="self-center" aria-hidden>
				<Avatar
					id={source.sourceId}
					avatarUrl={nprofile?.beaconAvatarUrl}
					beacon={
						nprofile && showBeacon ? nprofile.beaconStale : undefined
					}
				/>
			</div>

			<div className="min-w-0 flex-1 py-2">
				<div className="flex min-w-0 items-center gap-1.5">
					<p className="m-0 min-w-0 truncate text-base font-semibold text-primary">
						{label}
					</p>
					{isFavorite ? (
						<IonIcon
							icon={star}
							color="primary"
							className="shrink-0 text-sm"
							aria-label="Favorite source"
						/>
					) : null}
				</div>
				{nprofile && showBalance ? (
					<p className="m-0 mt-1 flex items-center gap-1.5 text-sm text-muted tabular-nums">
						<IonIcon
							icon={walletOutline}
							className="shrink-0 text-[0.95rem] text-faint"
							aria-hidden
						/>
						<span>
							{formatSatoshi(nprofile.maxWithdrawableSats)} sats
						</span>
					</p>
				) : null}
			</div>

			{endSlot ? <div slot="end">{endSlot}</div> : null}
		</IonItem>
	);
}
