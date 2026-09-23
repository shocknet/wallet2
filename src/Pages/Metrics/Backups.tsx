import { DashBoardPageChrome } from "@/Layout2/Metrics/DashBoardPageChrome";

export default function Backups() {
	return (
		<DashBoardPageChrome title="Backups">
			<div className="dash-card">
				<h2 className="mt-0">Node backups</h2>
				<p className="dash-field-hint mb-0">
					Backup status and recovery controls will appear here once the node
					backup API is available.
				</p>
			</div>
		</DashBoardPageChrome>
	);
}
