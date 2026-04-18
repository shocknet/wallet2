import { useState } from "react";
import { getNostrClient } from "@/Api/nostr";
import PromptForActionModal, { ActionType } from "../../Components/Modals/PromptForActionModal";
import { toast } from "react-toastify";
import { NprofileView } from "@/State/scoped/backups/sources/selectors";

export const OpenChannel = ({ adminSource }: { adminSource: NprofileView }) => {
	const [openModal, setOpenModal] = useState<"addPeer" | "openChannel" | "">("");
	const [peerUri, setPeerUri] = useState<string>("");
	const [peerPubkey, setPeerPubkey] = useState<string>("");
	const [channelAmount, setChannelAmount] = useState<number>(0);
	const [satsPerVByte, setSatsPerVByte] = useState<number>(0);
	const addPeer = async () => {
		if (!peerUri) {
			toast.error("Please enter a valid peer uri");
			return;
		}
		const [pubkey, addr] = peerUri.split("@");
		if (!pubkey || !addr) {
			toast.error("Please enter a valid peer uri");
			return;
		}
		const [host, port] = addr.split(":");
		if (!host || !port || isNaN(+port)) {
			toast.error("Please enter a valid peer uri");
			return;
		}
		const client = await getNostrClient(
			{ pubkey: adminSource.lpk, relays: adminSource.relays },
			adminSource.keys
		);
		const res = await client.AddPeer({ pubkey, host, port: +port });
		if (res.status === "ERROR") {
			toast.error(res.reason);
			return;
		}
		toast.success("Peer added successfully");
	};

	const openChannel = async () => {
		if (!peerPubkey) {
			toast.error("Please enter a valid peer pubkey");
			return;
		}
		if (channelAmount <= 0) {
			toast.error("Please enter a valid channel amount");
			return;
		}
		if (satsPerVByte <= 0) {
			toast.error("Please enter a valid sats per vbyte");
			return;
		}
		const client = await getNostrClient(
			{ pubkey: adminSource.lpk, relays: adminSource.relays },
			adminSource.keys
		);
		const res = await client.OpenChannel({
			node_pubkey: peerPubkey,
			local_funding_amount: channelAmount,
			sat_per_v_byte: satsPerVByte,
		});
		if (res.status === "ERROR") {
			toast.error(res.reason);
			return;
		}
		toast.success("Channel opened successfully");
	};

	return (
		<div>
			<div className="Channels_open-actions">
				<button type="button" className="btn-lp" onClick={() => setOpenModal("addPeer")}>
					Add peer
				</button>
				<button type="button" className="btn-lp-out" onClick={() => setOpenModal("openChannel")}>
					Add channel
				</button>
			</div>
			{openModal === "addPeer" && (
				<PromptForActionModal
					title="Add Peer"
					actionText="Add Peer"
					actionType={ActionType.NORMAL}
					variant="lnpub"
					closeModal={() => {
						setOpenModal("");
					}}
					action={() => {
						void addPeer();
						setOpenModal("");
					}}
					jsx={
						<div className="lnpub-form-stack">
							<div className="lnpub-form-row">
								<label htmlFor="lnpub-peer-uri">Peer URI</label>
								<input
									id="lnpub-peer-uri"
									className="lnpub-input"
									type="text"
									autoComplete="off"
									placeholder="pubkey@address:port"
									value={peerUri}
									onChange={(e) => {
										setPeerUri(e.target.value);
									}}
								/>
							</div>
						</div>
					}
				/>
			)}
			{openModal === "openChannel" && (
				<PromptForActionModal
					title="Open Channel"
					actionText="Open Channel"
					actionType={ActionType.NORMAL}
					variant="lnpub"
					closeModal={() => {
						setOpenModal("");
					}}
					action={() => {
						void openChannel();
						setOpenModal("");
					}}
					jsx={
						<div className="lnpub-form-stack">
							<div className="lnpub-form-row">
								<label htmlFor="lnpub-peer-pubkey">Peer pubkey</label>
								<input
									id="lnpub-peer-pubkey"
									className="lnpub-input"
									type="text"
									autoComplete="off"
									placeholder="pubkey"
									value={peerPubkey}
									onChange={(e) => {
										setPeerPubkey(e.target.value);
									}}
								/>
							</div>
							<div className="lnpub-form-row">
								<label htmlFor="lnpub-channel-amount">Channel amount (sats)</label>
								<input
									id="lnpub-channel-amount"
									className="lnpub-input"
									type="text"
									inputMode="numeric"
									placeholder="amount"
									value={channelAmount || ""}
									onChange={(e) => {
										setChannelAmount(+e.target.value);
									}}
								/>
							</div>
							<div className="lnpub-form-row">
								<label htmlFor="lnpub-sats-vb">Sats per vbyte</label>
								<input
									id="lnpub-sats-vb"
									className="lnpub-input"
									type="text"
									inputMode="numeric"
									placeholder="sats per vbyte"
									value={satsPerVByte || ""}
									onChange={(e) => {
										setSatsPerVByte(+e.target.value);
									}}
								/>
							</div>
						</div>
					}
				/>
			)}
		</div>
	);
};
