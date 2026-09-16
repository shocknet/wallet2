import { useDashboardSourceSwitch } from "./DashboardSourceContext";

type DashErrorBannerProps = {
	message: string;
	onRetry?: () => void;
};

export function DashErrorBanner({
	message,
	onRetry,
}: DashErrorBannerProps) {
	const { open, canSwitch } = useDashboardSourceSwitch();
	const hasActions = onRetry || canSwitch;

	return (
		<div className="dash-error" role="alert">
			<h6>Something went wrong</h6>
			<p>{message}</p>
			{hasActions && (
				<div className="dash-error-actions">
					{onRetry && (
						<button type="button" className="dash-btn" onClick={onRetry}>
							Retry
						</button>
					)}
					{canSwitch && (
						<button type="button" className="dash-btn dash-btn-ghost" onClick={open}>
							Change source
						</button>
					)}
				</div>
			)}
		</div>
	);
}
