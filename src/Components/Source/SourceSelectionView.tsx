import { IonButton, IonIcon } from "@ionic/react";
import { caretDownSharp, walletOutline } from "ionicons/icons";
import cn from "clsx";
import { Avatar } from "@/Components/Avatar";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import {
	useNestedSourceSelectModal,
	useSourceSelectModal,
} from "@/Components/Source/SourceSelectSheet";
import { formatSatoshi } from "@/lib/units";
import { selectLiveSourceIds } from "@/State/scoped/backups/sources/selectors";
import { useLiveSourceView } from "@/Hooks/useSourceView";
import { useAppSelector } from "@/State/store/hooks";

export type SourceSelectionViewProps = {
	sourceId: string;
	onSourceId: (sourceId: string) => void;
	title?: string;
	className?: string;
	showBalance?: boolean;
	showTapToSwitch?: boolean;
	showCaret?: boolean;
	nested?: boolean;
};

export function SourceSelectionView({
	sourceId,
	onSourceId,
	title = "Select source",
	className,
	showBalance = true,
	showTapToSwitch = true,
	showCaret = true,
	nested = false,
}: SourceSelectionViewProps) {
	const source = useLiveSourceView(sourceId);
	const sourceIds = useAppSelector(selectLiveSourceIds);
	const openSheet = useSourceSelectModal();
	const openNestedSheet = useNestedSourceSelectModal();

	const label = sourceDisplayName(source);
	const open = nested ? openNestedSheet : openSheet;

	return (
		<IonButton
			expand="block"
			fill="clear"
			onClick={() => {
				void open({
					sourceIds,
					selectedSourceId: sourceId,
					title,
					showBalance,
				}).then((result) => {
					if (result.role !== "confirm") return;
					onSourceId(result.data);
				});
			}}
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
				<Avatar
					id={source.sourceId}
					avatarUrl={source.beaconAvatarUrl}
					beacon={source.beaconStale}
					size="md"
				/>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-base font-semibold tracking-tight text-primary">
						{label}
					</span>
					{showBalance ? (
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
