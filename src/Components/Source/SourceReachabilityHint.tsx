import { IonContent, IonIcon, IonPopover, IonSpinner } from "@ionic/react";
import { alertCircleOutline } from "ionicons/icons";
import cn from "clsx";
import { type BeaconHealth } from "@/State/scoped/backups/sources/selectors";
import { useSourceView } from "@/Hooks/useSourceView";
import moment from "moment";


export type SourceReachabilityHintProps = {
	sourceId: string;
	className?: string;
};

export type BeaconReachabilityHintProps = {
	id: string;
	beaconStale: BeaconHealth;
	beaconLastSeenAtMs: number;
	className?: string;
};

const SHORT: Record<Exclude<BeaconHealth, "fresh">, string> = {
	warmingUp: "Checking node…",
	stale: "Node may be unreachable",
};

const DETAIL: Record<Exclude<BeaconHealth, "fresh">, string> = {
	warmingUp:
		"Checking node reachability…",
	stale:
		"This Pub node might be down. Actions can still be attempted.",
};

function formatLastHeard(lastSeenAtMs: number): string | null {
	if (!lastSeenAtMs) return null;
	return moment(lastSeenAtMs).fromNow();
}

export function SourceReachabilityHint({
	sourceId,
	className,
}: SourceReachabilityHintProps) {
	const source = useSourceView(sourceId);
	if (!source) return null;

	return (
		<BeaconReachabilityHint
			id={source.sourceId}
			beaconStale={source.beaconStale}
			beaconLastSeenAtMs={source.beaconLastSeenAtMs}
			className={className}
		/>
	);
}

/** A probed node that is not a saved source yet */
export function BeaconReachabilityHint({
	id,
	beaconStale,
	beaconLastSeenAtMs,
	className,
}: BeaconReachabilityHintProps) {
	if (beaconStale === "fresh") return null;

	const triggerId = `source-reachability-${id}`;
	const lastHeard = formatLastHeard(beaconLastSeenAtMs);

	return (
		<div
			role="status"
			className={cn(
				"flex items-center justify-between gap-1.5 rounded-xl px-3 py-2 text-sm",
				"bg-[color-mix(in_srgb,var(--ion-color-warning)_14%,transparent)] text-[var(--ion-color-warning-shade)]",
				className,
			)}
		>
			{beaconStale === "warmingUp" ? (
				<IonSpinner name="dots" className="h-4 w-4 shrink-0" aria-hidden />
			) : null}
			<span className="leading-none">{SHORT[beaconStale]}</span>
			<button
				type="button"
				id={triggerId}
				className="inline-flex shrink-0 appearance-none border-0 bg-transparent p-0 text-[inherit]"
			>
				<IonIcon
					icon={alertCircleOutline}
					color="warning"
					className="text-base"
					aria-hidden
				/>
			</button>
			<IonPopover
				trigger={triggerId}
				triggerAction="click"
				side="bottom"
				alignment="start"
			>
				<IonContent className="ion-padding">
					<p className="m-0 text-sm leading-snug text-primary">
						{DETAIL[beaconStale]}
					</p>
					{lastHeard ? (
						<p className="m-0 mt-2 text-xs text-muted">
							Last heard {lastHeard}.
						</p>
					) : null}
				</IonContent>
			</IonPopover>
		</div>
	);
}
