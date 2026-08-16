import { IonButton, IonIcon } from "@ionic/react";
import { caretDownSharp, walletOutline } from "ionicons/icons";
import cn from "clsx";
import { SourceAvatar } from "@/Components/Source/SourceAvatar";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import type { SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/backups/sources/schema";
import { formatSatoshi } from "@/lib/units";

export type SourceSelectionViewProps = {
	source: SourceView;
	onClick: () => void;
	className?: string;
	showBalance?: boolean;
	showTapToSwitch?: boolean;
	showCaret?: boolean;
};

export function SourceSelectionView({
	source,
	onClick,
	className,
	showBalance = true,
	showTapToSwitch = true,
	showCaret = true,
}: SourceSelectionViewProps) {
	const label = sourceDisplayName(source);
	const isNprofile = source.type === SourceType.NPROFILE_SOURCE;
	const showBalanceLine = showBalance && isNprofile;

	return (
		<IonButton
			expand="block"
			fill="clear"
			onClick={onClick}
			aria-label={`Change source, currently ${label}`}
			className={cn(
				"m-0 h-auto min-h-0 w-full normal-case tracking-normal",
				"[--border-radius:1rem]",
				"[--box-shadow:var(--wallet-box-shadow)]",
				"[--background:var(--app-surface)]",
				"[--padding-top:0.75rem] [--padding-bottom:0.75rem]",
				"[--padding-start:0.75rem] [--padding-end:0.75rem]",
				className,
			)}
		>
			<span className="flex w-full min-w-0 items-center gap-3 text-left">
				<SourceAvatar source={source} size="md" />
				<span className="min-w-0 flex-1">
					<span className="block truncate text-base font-semibold tracking-tight text-primary">
						{label}
					</span>
					{showBalanceLine ? (
						<span className="mt-0.5 flex items-center gap-1.5 text-sm font-normal normal-case text-muted tabular-nums">
							<IonIcon
								icon={walletOutline}
								className="shrink-0 text-[0.95rem] text-faint"
								aria-hidden
							/>
							{formatSatoshi(source.maxWithdrawableSats)} sats available
						</span>
					) : null}
					{showTapToSwitch ? (
						<span className="mt-0.5 block text-xs font-normal normal-case text-faint">
							Tap to switch source
						</span>
					) : null}
				</span>
				{showCaret ? (
					<IonIcon
						icon={caretDownSharp}
						className="shrink-0 text-base text-muted"
						aria-hidden
					/>
				) : null}
			</span>
		</IonButton>
	);
}
