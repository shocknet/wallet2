import type { ReactNode } from "react";
import { IonIcon, IonItem } from "@ionic/react";
import { checkmarkCircle, star, walletOutline } from "ionicons/icons";
import cn from "clsx";
import { Avatar } from "@/Components/Avatar";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import { useAppSelector } from "@/State/store/hooks";
import { useSourceView } from "@/Hooks/useSourceView";
import { formatSatoshi } from "@/lib/units";
import { SourceView } from "@/State/scoped/backups/sources/selectors";

export type SourceItemViewProps = {
	sourceId: string;
	selected?: boolean;
	showFavorite?: boolean;
	showBalance?: boolean;
	showBeacon?: boolean;
	onClick?: () => void;
	end?: ReactNode;
	className?: string;
};

export function SourceItemView({
	sourceId,
	selected = false,
	showFavorite = true,
	showBalance = true,
	showBeacon = true,
	onClick,
	end,
	className,
}: SourceItemViewProps) {
	const source = useSourceView(sourceId);

	if (!source) return null;
	return <SourceItemViewInner
		sourceId={sourceId}
		source={source}
		selected={selected}
		showFavorite={showFavorite}
		showBalance={showBalance}
		showBeacon={showBeacon}
		onClick={onClick}
		end={end}
		className={className}
	/>;

}

function SourceItemViewInner({
	sourceId,
	selected,
	showFavorite,
	showBalance,
	showBeacon,
	onClick,
	end,
	className,
	source,
}: SourceItemViewProps & { source: SourceView }) {
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const isFavorite = showFavorite && favoriteSourceId === sourceId;
	const label = sourceDisplayName(source);
	const interactive = typeof onClick === "function";

	const detailParts: string[] = [];
	if (showBalance) {
		detailParts.push(`${formatSatoshi(source.maxWithdrawableSats)} sats`);
	}
	const detail = detailParts.join(" · ");
	const showWalletIcon = showBalance && detail.length > 0;

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
					avatarUrl={source.beaconAvatarUrl}
					beacon={showBeacon ? source.beaconStale : undefined}
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
				{detail ? (
					<p className="m-0 mt-1 flex items-center gap-1.5 text-sm text-muted tabular-nums">
						{showWalletIcon ? (
							<IonIcon
								icon={walletOutline}
								className="shrink-0 text-[0.95rem] text-faint"
								aria-hidden
							/>
						) : null}
						<span>{detail}</span>
					</p>
				) : null}
			</div>

			{endSlot ? <div slot="end">{endSlot}</div> : null}
		</IonItem>
	);
}
