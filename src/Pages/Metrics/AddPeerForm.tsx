import { useState } from "react";
import { toast } from "react-toastify";
import { parsePeerUri } from "@/lib/parsePeerUri";
import { AdminRpcSource } from "@/State/scoped/backups/sources/selectors";
import { connectPeer } from "./peerActions";

export function AddPeerForm({ adminSource, onAdded }: { adminSource: AdminRpcSource; onAdded?: () => void }) {
	const [uri, setUri] = useState("");
	const [busy, setBusy] = useState(false);

	const onSubmit = async () => {
		const parsed = parsePeerUri(uri);
		if ("error" in parsed) {
			toast.error(parsed.error);
			return;
		}
		setBusy(true);
		try {
			const err = await connectPeer(adminSource, parsed);
			if (err) {
				toast.error(err);
				return;
			}
			toast.success("Peer connected");
			setUri("");
			onAdded?.();
		} finally {
			setBusy(false);
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
			<button type="submit" className="dash-btn" disabled={busy}>
				{busy ? "Connecting…" : "Connect"}
			</button>
		</form>
	);
}
