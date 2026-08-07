import { useMemo, useState } from "react";
import {
	IonButton,
	IonContent,
	IonHeader,
	IonPage,
	IonToggle,
} from "@ionic/react";
import {
	AmountField,
	type AmountFieldChange,
} from "@/Components/AmountField";
import type { Satoshi } from "@/lib/types/units";
import RootPageToolbar from "@/Layout2/RootPageToolbar";

const sats = (n: number) => n as Satoshi;


export default function AmountFieldPlayground() {
	const [change, setChange] = useState<AmountFieldChange>({
		sats: null,
		error: undefined,
	});
	const [withLimits, setWithLimits] = useState(true);
	const [allowUnitToggle, setAllowUnitToggle] = useState(true);
	const [showFiat, setShowFiat] = useState(true);
	const [fixedSats, setFixedSats] = useState<Satoshi | null>(null);
	const [fieldKey, setFieldKey] = useState(0);
	const [maxBalance, setMaxBalance] = useState(50_000);

	const limits = useMemo(
		() =>
			withLimits
				? { min: sats(1), max: sats(maxBalance) }
				: null,
		[withLimits, maxBalance],
	);

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<RootPageToolbar title="AmountField playground" />
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-4">
					<section className="flex flex-col gap-3">
						<p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
							Field
						</p>
						<AmountField
							key={fieldKey}
							className="filled-input"
							fill="solid"
							mode="md"
							labelPlacement="stacked"
							limits={limits}
							fixedSats={fixedSats}
							allowUnitToggle={allowUnitToggle}
							showFiat={showFiat}
							onChange={setChange}
						/>
					</section>

					<section className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 font-mono text-sm">
						<p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
							onChange
						</p>
						<pre className="m-0 mt-2 whitespace-pre-wrap text-secondary">
							{JSON.stringify(
								{
									sats: change.sats,
									error: change.error ?? null,
									fixedSats,
									limits,
								},
								null,
								2,
							)}
						</pre>
					</section>

					<section className="flex flex-col gap-3">
						<p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
							Controls
						</p>
						<IonToggle
							checked={withLimits}
							onIonChange={(e) => setWithLimits(e.detail.checked)}
						>
							Limits (min 1 / max {maxBalance.toLocaleString()})
						</IonToggle>
						{withLimits ? (
							<div className="grid grid-cols-3 gap-2">
								{[10_000, 50_000, 100_000].map((n) => (
									<IonButton
										key={n}
										size="small"
										fill={maxBalance === n ? "solid" : "outline"}
										onClick={() => setMaxBalance(n)}
									>
										max {n / 1000}k
									</IonButton>
								))}
							</div>
						) : null}
						<IonToggle
							checked={allowUnitToggle}
							onIonChange={(e) => setAllowUnitToggle(e.detail.checked)}
						>
							Allow unit toggle
						</IonToggle>
						<IonToggle
							checked={showFiat}
							onIonChange={(e) => setShowFiat(e.detail.checked)}
						>
							Show fiat helper
						</IonToggle>
						<div className="grid grid-cols-2 gap-2">
							<IonButton
								expand="block"
								fill="outline"
								disabled={fixedSats !== null}
								onClick={() => setFixedSats(sats(21_000))}
							>
								Lock 21k (invoice)
							</IonButton>
							<IonButton
								expand="block"
								fill="outline"
								disabled={fixedSats === null}
								onClick={() => setFixedSats(null)}
							>
								Unlock
							</IonButton>
							<IonButton
								expand="block"
								fill="outline"
								onClick={() => setFieldKey((n) => n + 1)}
							>
								Remount (key++)
							</IonButton>
							<IonButton
								expand="block"
								fill="outline"
								onClick={() => setFixedSats(sats(99_000))}
							>
								Lock 99k
							</IonButton>
						</div>
					</section>
				</div>
			</IonContent>
		</IonPage>
	);
}
