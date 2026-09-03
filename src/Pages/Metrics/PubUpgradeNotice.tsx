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
		<div className="dash-callout" role="status">
			<h6>Pub update required</h6>
			<p>
				This Pub does not support {featureLabel}. Upgrade Lightning.Pub, then check again.
			</p>
			{onRecheck && (
				<IonButton size="small" onClick={onRecheck} disabled={checking}>
					{checking ? "Checking..." : "Check again"}
				</IonButton>
			)}
		</div>
	);
}
