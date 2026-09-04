import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AdminRpcSource } from "@/State/scoped/backups/sources/selectors";
import type { FeeTier } from "@/lib/fees";
import { useMempoolFeeTiers } from "./useMempoolFeeTiers";
import { connectPeer, openChannel, parseOpenPeer } from "./peerActions";

type ChannelOpenFormProps = {
	adminSource: AdminRpcSource;
	peerLocked?: string;
	initialPeer?: string;
	onOpened?: () => void;
};

export function ChannelOpenForm({ adminSource, peerLocked, initialPeer = "", onOpened }: ChannelOpenFormProps) {
	const { tiers, averageRate, failed, hostLabel } = useMempoolFeeTiers();
	const [peer, setPeer] = useState(peerLocked || initialPeer);
	const [amount, setAmount] = useState("");
	const [satsPerVByte, setSatsPerVByte] = useState("");
	const [busy, setBusy] = useState(false);
	const [feeTouched, setFeeTouched] = useState(false);
	const [feeTierKey, setFeeTierKey] = useState<FeeTier["key"] | null>(null);

	useEffect(() => {
		if (peerLocked) setPeer(peerLocked);
	}, [peerLocked]);

	useEffect(() => {
		if (averageRate == null || feeTouched) return;
		setSatsPerVByte(String(averageRate));
		setFeeTierKey("average");
	}, [averageRate, feeTouched]);

	const onSubmit = async () => {
		const parsed = parseOpenPeer(peer);
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
		setBusy(true);
		try {
			if (parsed.host && parsed.port != null) {
				const peerErr = await connectPeer(adminSource, {
					pubkey: parsed.pubkey,
					host: parsed.host,
					port: parsed.port,
				});
				if (peerErr) {
					toast.error(peerErr);
					return;
				}
			}
			const openErr = await openChannel(adminSource, {
				node_pubkey: parsed.pubkey,
				local_funding_amount: funding,
				sat_per_v_byte: fee,
			});
			if (openErr) {
				toast.error(openErr);
				return;
			}
			toast.success("Channel opening");
			setAmount("");
			if (!peerLocked) setPeer("");
			onOpened?.();
		} finally {
			setBusy(false);
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
					<p className="dash-field-hint">Pubkey plus address connects first, then opens.</p>
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
				<button type="button" className="dash-btn" disabled={busy} onClick={() => void onSubmit()}>
					{busy ? "Opening…" : "Open channel"}
				</button>
			</div>
		</>
	);
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
