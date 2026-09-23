import { useState } from "react";
import { toast } from "react-toastify";
import { parsePeerUri } from "@/lib/parsePeerUri";
import type { AppApiError } from "@/State/api/api";
import { useDashboardSource } from "./DashboardSourceContext";
import { useAddPeerMutation } from "./pubDashApi";

export function AddPeerForm() {
	const { sourceId } = useDashboardSource();
	const [uri, setUri] = useState("");
	const [addPeer, { isLoading }] = useAddPeerMutation();

	const onSubmit = async () => {
		const parsed = parsePeerUri(uri);
		if ("error" in parsed) {
			toast.error(parsed.error);
			return;
		}
		try {
			await addPeer({ sourceId, ...parsed }).unwrap();
			toast.success("Peer connected");
			setUri("");
		} catch (e) {
			toast.error((e as AppApiError).message || "Could not connect peer");
		}
	};

	return (
		<form
			className="dash-inline-form"
			onSubmit={(e) => {
				e.preventDefault();
				void onSubmit();
			}}
		>
			<div className="dash-field">
				<label htmlFor="add-peer-uri">Add peer</label>
				<input
					id="add-peer-uri"
					type="text"
					spellCheck={false}
					placeholder="pubkey@host:port"
					value={uri}
					onChange={(e) => setUri(e.target.value)}
				/>
			</div>
			<button type="submit" className="dash-btn" disabled={isLoading}>
				{isLoading ? "Connecting…" : "Connect"}
			</button>
		</form>
	);
}
