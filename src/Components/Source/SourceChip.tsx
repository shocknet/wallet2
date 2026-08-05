import { IonButton } from "@ionic/react";
import cn from "clsx";
import { Avatar } from "@/Components/Avatar";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import type { NprofileView } from "@/State/scoped/backups/sources/selectors";

export type SourceChipProps = {
	source: NprofileView;
	onClick: () => void;
	className?: string;
};

export function SourceChip({ source, onClick, className }: SourceChipProps) {
	const label = sourceDisplayName(source);

	return (
		<IonButton
			fill="clear"
			onClick={onClick}
			aria-label={`Change source, currently ${label}`}
			className={cn(
				"m-0 h-auto min-h-0 max-w-full normal-case tracking-normal",
				"[--border-radius:9999px]",
				"[--background:var(--app-surface-muted)]",
				"[--padding-top:0.375rem] [--padding-bottom:0.375rem]",
				"[--padding-start:0.5rem] [--padding-end:0.5rem]",
				"[--border-width:1px] [--border-style:solid]",
				"[--border-color:color-mix(in_srgb,var(--app-border)_75%,transparent)]",
				"[&::part(native)]:justify-start",
				className,
			)}
		>
			<span className="inline-flex max-w-full min-w-0 items-center gap-2 text-left">
				<Avatar
					id={source.sourceId}
					avatarUrl={source.beaconAvatarUrl}
					beacon={source.beaconStale}
					size="sm"
				/>
				<span className="min-w-0 truncate text-sm font-semibold tracking-tight text-primary">
					{label}
				</span>
			</span>
		</IonButton>
	);
}
