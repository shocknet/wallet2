import { IonButton, IonText } from "@ionic/react";
import cn from "clsx";
import { Avatar } from "@/Components/Avatar";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import type { NprofileView } from "@/State/scoped/backups/sources/selectors";

export type SourceIdentityStripProps = {
	source: NprofileView;
	onClick: () => void;
	className?: string;
};

export function SourceIdentityStrip({
	source,
	onClick,
	className,
}: SourceIdentityStripProps) {
	const label = sourceDisplayName(source);

	return (
		<IonButton
			expand="block"
			fill="clear"
			onClick={onClick}
			aria-label={`Change source, currently ${label}`}
			className={cn(
				"m-0 h-auto min-h-0 w-full normal-case tracking-normal",
				"[--border-radius:0]",
				"[--background:transparent]",
				"[--padding-top:0.75rem] [--padding-bottom:0.75rem]",
				"[--padding-start:1rem] [--padding-end:1rem]",
				"[&::part(native)]:justify-start",
				className,
			)}
		>
			<div className="flex w-full min-w-0 items-center gap-3 text-left">
				<Avatar
					id={source.sourceId}
					avatarUrl={source.beaconAvatarUrl}
					beacon={source.beaconStale}
				/>
				<div className="min-w-0 flex-1">
					<IonText className="block truncate text-base font-semibold tracking-tight text-primary">
						{label}
					</IonText>
					<p className="m-0 mt-0.5 text-xs font-normal normal-case text-muted">
						Tap to switch source
					</p>
				</div>
			</div>
		</IonButton>
	);
}
