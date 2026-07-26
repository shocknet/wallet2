import { IonSkeletonText } from "@ionic/react";

type MetricsProbeSkeletonProps = {
	variant?: "banner" | "page";
};

function SkeletonBlock({ width, height = 12 }: { width: string; height?: number }) {
	return (
		<IonSkeletonText
			animated
			style={{
				width,
				height,
				borderRadius: 6,
				margin: 0,
			}}
		/>
	);
}

/** Placeholder while Pub dashboard capability is being probed. */
export function MetricsProbeSkeleton({ variant = "banner" }: MetricsProbeSkeletonProps) {
	if (variant === "banner") {
		return (
			<div
				style={{
					padding: 12,
					marginBottom: 12,
					background: "var(--ion-color-light)",
					borderRadius: "8px",
					border: "1px solid var(--ion-color-medium-tint)",
					display: "flex",
					flexDirection: "column",
					gap: 8,
				}}
			>
				<SkeletonBlock width="40%" height={14} />
				<SkeletonBlock width="85%" />
				<SkeletonBlock width="55%" />
			</div>
		);
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
			<div
				style={{
					padding: 12,
					background: "var(--ion-color-light)",
					borderRadius: "8px",
					display: "flex",
					flexDirection: "column",
					gap: 10,
				}}
			>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<SkeletonBlock width="30%" height={16} />
					<SkeletonBlock width="72px" height={28} />
				</div>
				<SkeletonBlock width="100%" height={28} />
				<div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
					<SkeletonBlock width="40%" />
					<SkeletonBlock width="40%" />
				</div>
				<SkeletonBlock width="60%" />
			</div>
			<div
				style={{
					padding: 12,
					background: "var(--ion-color-light)",
					borderRadius: "8px",
					display: "flex",
					flexDirection: "column",
					gap: 10,
				}}
			>
				<SkeletonBlock width="35%" height={16} />
				<SkeletonBlock width="100%" height={48} />
				<SkeletonBlock width="100%" height={48} />
				<SkeletonBlock width="70%" height={48} />
			</div>
		</div>
	);
}
