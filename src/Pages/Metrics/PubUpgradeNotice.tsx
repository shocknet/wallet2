import { IonButton } from "@ionic/react";

type PubUpgradeNoticeProps = {
	onRecheck?: () => void;
	checking?: boolean;
	featureLabel?: string;
};

export function PubUpgradeNotice({
	onRecheck,
	checking = false,
	featureLabel = "the new dashboard",
}: PubUpgradeNoticeProps) {
	return (
		<div
			style={{
				padding: 12,
				marginBottom: 12,
				background: "var(--ion-color-warning-tint)",
				borderRadius: "8px",
				color: "var(--ion-color-warning-shade)",
				border: "1px solid var(--ion-color-warning)",
			}}
		>
			<div style={{ fontWeight: 700, marginBottom: 8 }}>Pub update required</div>
			<div style={{ marginBottom: onRecheck ? 12 : 0, opacity: 0.95 }}>
				This Pub does not support {featureLabel}. Upgrade Lightning.Pub, then check again.
			</div>
			{onRecheck && (
				<IonButton size="small" onClick={onRecheck} disabled={checking}>
					{checking ? "Checking..." : "Check again"}
				</IonButton>
			)}
		</div>
	);
}
