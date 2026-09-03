type DashErrorBannerProps = {
	message: string;
	onRetry?: () => void;
	onChangeSource?: () => void;
	changeLabel?: string;
};

export function DashErrorBanner({
	message,
	onRetry,
	onChangeSource,
	changeLabel = "Change source",
}: DashErrorBannerProps) {
	return (
		<div className="dash-error" role="alert">
			<h6>Something went wrong</h6>
			<p>{message}</p>
			<div className="dash-error-actions">
				{onRetry && (
					<button type="button" className="dash-btn" onClick={onRetry}>
						Retry
					</button>
				)}
				{onChangeSource && (
					<button type="button" className="dash-btn dash-btn-ghost" onClick={onChangeSource}>
						{changeLabel}
					</button>
				)}
			</div>
		</div>
	);
}
