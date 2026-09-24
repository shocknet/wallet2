import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { FeeTier } from "@/lib/fees";
import { parsePeerInput, type ParsedPeerInput } from "@/lib/parsePeerUri";
import { useMempoolFeeTiers } from "./useMempoolFeeTiers";
import { useDashboardSource } from "./DashboardSourceContext";
import { useAddPeerMutation, useListPeersQuery, useOpenChannelMutation } from "./pubDashApi";
import type { AppApiError } from "@/State/api/api";

type ChannelOpenFormProps = {
	peerLocked?: string;
	initialPeer?: string;
	onOpened?: () => void;
};

export function ChannelOpenForm({ peerLocked, initialPeer = "", onOpened }: ChannelOpenFormProps) {
	const { sourceId } = useDashboardSource();
	const { tiers, averageRate, failed, hostLabel } = useMempoolFeeTiers();
	const [peer, setPeer] = useState(peerLocked || initialPeer);
	const [amount, setAmount] = useState("");
	const [satsPerVByte, setSatsPerVByte] = useState("");
	const [feeTouched, setFeeTouched] = useState(false);
	const [feeTierKey, setFeeTierKey] = useState<FeeTier["key"] | null>(null);
	const connect = usePeerConnect(sourceId, peer);
	const [openChannel, openChannelState] = useOpenChannelMutation();
	const busy = connect.connecting || openChannelState.isLoading;

	useEffect(() => {
		if (peerLocked) setPeer(peerLocked);
	}, [peerLocked]);

	useEffect(() => {
		if (averageRate == null || feeTouched) return;
		setSatsPerVByte(String(averageRate));
		setFeeTierKey("average");
	}, [averageRate, feeTouched]);

	const onSubmit = async () => {
		const parsed = parsePeerInput(peer);
		if ("error" in parsed) {
			toast.error(parsed.error);
			return;
		}
		const funding = Number(amount);
		const fee = Number(satsPerVByte);
		if (!Number.isFinite(funding) || funding <= 0) {
			toast.error("Enter a channel amount in sats");
			return;
		}
		if (!Number.isFinite(fee) || fee <= 0) {
			toast.error("Enter sats per vbyte");
			return;
		}
		if (parsed.host && !connect.online) return;
		const listedKey = await connect.confirmListed(parsed.pubkey);
		if (parsed.host && !listedKey) {
			toast.error("Peer is not online");
			return;
		}
		try {
			await openChannel({
				sourceId,
				node_pubkey: listedKey || parsed.pubkey,
				local_funding_amount: funding,
				sat_per_v_byte: fee,
			}).unwrap();
			toast.success("Channel opening");
			setAmount("");
			if (!peerLocked) setPeer("");
			onOpened?.();
		} catch (e) {
			toast.error((e as AppApiError).message || "Could not open channel");
		}
	};

	return (
		<>
			{!peerLocked && (
				<div className="dash-field">
					<label htmlFor="open-peer">Peer</label>
					<input
						id="open-peer"
						type="text"
						spellCheck={false}
						placeholder="pubkey@host:port"
						value={peer}
						onChange={(e) => setPeer(e.target.value)}
					/>
					<PeerConnectHint connecting={connect.connecting} online={connect.online} hasUri={connect.hasUri} error={connect.error} />
				</div>
			)}
			<div className="dash-field">
				<label htmlFor="open-amount">Amount (sats)</label>
				<input
					id="open-amount"
					type="number"
					min={1}
					inputMode="numeric"
					placeholder="1000000"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
				/>
			</div>
			<SatPerVbyteField
				value={satsPerVByte}
				selectedKey={feeTierKey}
				onChange={(v) => {
					setFeeTouched(true);
					setFeeTierKey(null);
					setSatsPerVByte(v);
				}}
				onPick={(tier) => {
					setFeeTouched(true);
					setFeeTierKey(tier.key);
					setSatsPerVByte(String(tier.rate));
				}}
				tiers={tiers}
				failed={failed}
				hostLabel={hostLabel}
			/>
			<div className="dash-form-actions">
				<button type="button" className="dash-btn" disabled={busy || !connect.online} onClick={() => void onSubmit()}>
					{openChannelState.isLoading ? "Opening…" : "Open channel"}
				</button>
			</div>
		</>
	);
}

function usePeerConnect(sourceId: string, peer: string) {
	const peers = useListPeersQuery({ sourceId });
	const [addPeer, addState] = useAddPeerMutation();
	const [onlineKey, setOnlineKey] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [waiting, setWaiting] = useState(false);
	const attempt = useRef("");
	const target = connectTarget(peer);
	const pubkey = target?.pubkey ?? "";
	const host = target?.host ?? "";
	const port = target?.port ?? 0;
	const listed = peers.data?.some((row) => row.pubkey.toLowerCase() === pubkey.toLowerCase()) ?? false;

	useEffect(() => {
		if (!pubkey || !host || !port) {
			setOnlineKey(null);
			setError(null);
			setWaiting(false);
			return;
		}
		if (peers.isLoading || peers.isUninitialized) return;
		if (listed) {
			setOnlineKey(pubkey);
			setError(null);
			setWaiting(false);
			return;
		}
		const id = `${pubkey}@${host}:${port}`;
		if (attempt.current === id) return;
		attempt.current = id;
		setOnlineKey(null);
		setError(null);
		setWaiting(true);
		let stop = false;
		void waitUntilListed({
			id,
			pubkey,
			connect: () => addPeer({ sourceId, pubkey, host, port }).unwrap(),
			refetch: () => peers.refetch(),
			isStopped: () => stop || attempt.current !== id,
		}).then((result) => {
			if (stop || attempt.current !== id) return;
			setWaiting(false);
			if (result === "online") setOnlineKey(pubkey);
			else setError(result);
		});
		return () => { stop = true; };
	}, [pubkey, host, port, listed, peers.isLoading, peers.isUninitialized, peers, sourceId, addPeer]);

	const confirmListed = async (key: string) => {
		const res = await peers.refetch();
		const row = res.data?.find((peerRow) => peerRow.pubkey.toLowerCase() === key.toLowerCase());
		if (row) setOnlineKey(row.pubkey);
		else setOnlineKey(null);
		return row?.pubkey ?? null;
	};

	return {
		connecting: Boolean(pubkey) && (waiting || addState.isLoading) && !listed,
		online: !pubkey || onlineKey === pubkey,
		hasUri: Boolean(pubkey),
		error,
		confirmListed,
	};
}

async function waitUntilListed(args: {
	id: string;
	pubkey: string;
	connect: () => Promise<unknown>;
	refetch: () => Promise<{ data?: { pubkey: string }[] }>;
	isStopped: () => boolean;
}): Promise<"online" | string> {
	try {
		await args.connect();
	} catch (e: unknown) {
		if (args.isStopped()) return "online";
		return (e as AppApiError).message || "Could not connect peer";
	}
	for (let i = 0; i < 20; i++) {
		if (args.isStopped()) return "online";
		const res = await args.refetch();
		const found = res.data?.some((row) => row.pubkey.toLowerCase() === args.pubkey.toLowerCase());
		if (found) return "online";
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	return "Peer is not online";
}

function connectTarget(peer: string): ParsedPeerInput | null {
	const parsed = parsePeerInput(peer);
	if ("error" in parsed || !parsed.host || parsed.port == null) return null;
	return parsed;
}

function PeerConnectHint({ connecting, online, hasUri, error }: { connecting: boolean; online: boolean; hasUri: boolean; error: string | null }) {
	if (connecting) {
		return (
			<p className="dash-field-hint dash-connect-hint">
				<span className="dash-spin" aria-hidden />
				Connecting…
			</p>
		);
	}
	if (error) return <p className="dash-field-hint">{error}</p>;
	if (hasUri && online) return <p className="dash-field-hint">Peer online.</p>;
	return <p className="dash-field-hint">Paste pubkey@host:port. Open stays off until the peer is online.</p>;
}

export function SatPerVbyteField({
	value,
	selectedKey,
	onChange,
	onPick,
	tiers,
	failed,
	hostLabel,
}: {
	value: string;
	selectedKey: FeeTier["key"] | null;
	onChange: (v: string) => void;
	onPick: (tier: FeeTier) => void;
	tiers: FeeTier[];
	failed: boolean;
	hostLabel: string;
}) {
	return (
		<div className="dash-field">
			<label htmlFor="sat-vbyte">Sat / vbyte</label>
			<input
				id="sat-vbyte"
				type="number"
				min={1}
				inputMode="numeric"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			{tiers.length > 0 && (
				<div className="dash-fee-chips">
					{tiers.map((tier) => (
						<button
							key={tier.key}
							type="button"
							className={`dash-fee-chip${selectedKey === tier.key ? " is-on" : ""}`}
							onClick={() => onPick(tier)}
						>
							{tier.label} {tier.rate}
						</button>
					))}
				</div>
			)}
			<p className="dash-field-hint">
				{failed ? `Could not load fees from ${hostLabel}. Enter a rate.` : `Average from ${hostLabel}.`}
			</p>
		</div>
	);
}
