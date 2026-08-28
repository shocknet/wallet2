import { IonContent, IonIcon, IonPopover } from "@ionic/react";
import { helpCircleOutline } from "ionicons/icons";
import type { Satoshi } from "@/lib/types/units";
import { formatSatoshi } from "@/lib/units";

export function FeeReserveHint({
	sourceId,
	balanceSats,
	availableSats,
	reserveSats,
}: {
	sourceId: string;
	balanceSats: Satoshi;
	availableSats: Satoshi;
	reserveSats: Satoshi;
}) {
	if (reserveSats <= 0) return null;

	const triggerId = `fee-reserve-${sourceId}`;

	return (
		<div className="px-3">
			<button
				type="button"
				id={triggerId}
				className="inline-flex max-w-full items-center gap-1 appearance-none border-0 bg-transparent p-0 text-left text-sm text-muted"
				aria-label="About fee reserve"
			>
				<span>
					{formatSatoshi(reserveSats)} sats reserved for fees
				</span>
				<IonIcon
					icon={helpCircleOutline}
					className="shrink-0 text-base text-muted"
					aria-hidden
				/>
			</button>
			<IonPopover
				trigger={triggerId}
				triggerAction="click"
				reference="trigger"
				side="bottom"
				alignment="start"
				arrow
				className="[--max-width:18rem] [--offset:6px] [--width:18rem]"
			>
				<IonContent className="ion-padding">
					<p className="m-0 text-sm font-medium tracking-tight text-primary">
						Fee reserve
					</p>
					<p className="m-0 mt-1.5 text-sm leading-5 text-secondary">
						Lightning fees grow with the amount you send, so this Pub holds a
						fee budget. You can spend the rest of your balance.
					</p>
					<dl className="m-0 mt-3 flex flex-col gap-1.5 border-t border-[var(--app-border)] pt-3 text-xs tabular-nums">
						<div className="flex justify-between gap-4 text-muted">
							<dt>Balance</dt>
							<dd className="m-0">{formatSatoshi(balanceSats)} sats</dd>
						</div>
						<div className="flex justify-between gap-4 text-muted">
							<dt>Reserved</dt>
							<dd className="m-0">{formatSatoshi(reserveSats)} sats</dd>
						</div>
						<div className="flex justify-between gap-4 text-secondary">
							<dt>Available</dt>
							<dd className="m-0">{formatSatoshi(availableSats)} sats</dd>
						</div>
					</dl>
				</IonContent>
			</IonPopover>
		</div>
	);
}
