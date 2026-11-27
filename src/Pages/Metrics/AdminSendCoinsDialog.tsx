import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { FeeTier } from "@/lib/fees";
import { DashDialog } from "@/Layout2/Metrics/DashDialog";
import type { AppApiError } from "@/State/api/api";
import { SatPerVbyteField } from "./ChannelOpenForm";
import { useDashboardSource } from "./DashboardSourceContext";
import { formatTableAmount } from "./metricsDataTable";
import { useAdminSendCoinsMutation } from "./pubDashApi";
import { useMempoolFeeTiers } from "./useMempoolFeeTiers";

type AdminSendCoinsDialogProps = {
	onClose: () => void;
};

type Step = "form" | "confirm";

export function AdminSendCoinsDialog({ onClose }: AdminSendCoinsDialogProps) {
	const { sourceId } = useDashboardSource();
	const { tiers, averageRate, failed, hostLabel } = useMempoolFeeTiers();
	const [address, setAddress] = useState("");
	const [amount, setAmount] = useState("");
	const [sendAll, setSendAll] = useState(false);
	const [satsPerVByte, setSatsPerVByte] = useState("");
	const [feeTouched, setFeeTouched] = useState(false);
	const [feeTierKey, setFeeTierKey] = useState<FeeTier["key"] | null>(null);
	const [step, setStep] = useState<Step>("form");
	const [send, { isLoading }] = useAdminSendCoinsMutation();

	useEffect(() => {
		if (averageRate == null || feeTouched) return;
		setSatsPerVByte(String(averageRate));
		setFeeTierKey("average");
	}, [averageRate, feeTouched]);

	const parsedAmount = Number(amount.replace(/\s/g, ""));
	const amountOk = sendAll || (Number.isFinite(parsedAmount) && parsedAmount > 0 && Number.isInteger(parsedAmount));
	const addressOk = address.trim().length > 0;
	const feeNum = Number(satsPerVByte);
	const feeOk = satsPerVByte.trim() === "" || (Number.isFinite(feeNum) && feeNum > 0);
	const canReview = addressOk && amountOk && feeOk;

	const goConfirm = () => {
		if (!addressOk) {
			toast.error("Enter a destination address");
			return;
		}
		if (!sendAll && !amountOk) {
			toast.error("Enter a positive whole number of sats, or enable send all");
			return;
		}
		if (!feeOk) {
			toast.error("Enter a positive sat/vbyte, or leave blank to let Pub estimate");
			return;
		}
		setStep("confirm");
	};

	const onSubmit = async () => {
		try {
			const res = await send({
				sourceId,
				address: address.trim(),
				...(sendAll
					? { send_all: true }
					: { amount: parsedAmount }),
				...(satsPerVByte.trim() !== "" ? { sat_per_v_byte: feeNum } : {}),
			}).unwrap();
			toast.success(
				`Sent ${formatTableAmount(res.amount)} sats · fee ${formatTableAmount(res.network_fee)} · ${res.tx_id.slice(0, 10)}…`,
			);
			onClose();
		} catch (e) {
			toast.error((e as AppApiError).message || "Could not send on-chain");
		}
	};

	if (step === "confirm") {
		return (
			<DashDialog
				title="Confirm on-chain send"
				onClose={onClose}
				footer={
					<>
						<button type="button" className="dash-btn dash-btn-ghost" onClick={() => setStep("form")} disabled={isLoading}>
							Back
						</button>
						<button type="button" className="dash-btn" disabled={isLoading} onClick={() => void onSubmit()}>
							{isLoading ? "Sending…" : "Send on-chain"}
						</button>
					</>
				}
			>
				<p className="dash-field-hint">
					Spends <strong>node on-chain funds</strong> (LND SendCoins). This does not debit any user ledger balance.
				</p>
				<dl className="dash-policy">
					<div className="dash-policy-row">
						<dt>Address</dt>
						<dd style={{ wordBreak: "break-all" }}>{address.trim()}</dd>
					</div>
					<div className="dash-policy-row">
						<dt>Amount</dt>
						<dd>{sendAll ? "Send all confirmed" : `${formatTableAmount(parsedAmount)} sats`}</dd>
					</div>
					<div className="dash-policy-row">
						<dt>Sat / vbyte</dt>
						<dd>{satsPerVByte.trim() || "Pub estimate"}</dd>
					</div>
				</dl>
			</DashDialog>
		);
	}

	return (
		<DashDialog
			title="Send on-chain"
			onClose={onClose}
			footer={
				<>
					<button type="button" className="dash-btn dash-btn-ghost" onClick={onClose}>
						Cancel
					</button>
					<button type="button" className="dash-btn" disabled={!canReview} onClick={goConfirm}>
						Review
					</button>
				</>
			}
		>
			<p className="dash-field-hint">
				Sends from the node wallet. Not a user PayAddress — liabilities stay unchanged.
			</p>
			<div className="dash-field">
				<label htmlFor="admin-send-address">Address</label>
				<input
					id="admin-send-address"
					type="text"
					spellCheck={false}
					autoComplete="off"
					placeholder="bc1…"
					value={address}
					onChange={(e) => setAddress(e.target.value)}
				/>
			</div>
			<div className="dash-field">
				<label htmlFor="admin-send-amount">Amount (sats)</label>
				<input
					id="admin-send-amount"
					type="number"
					min={1}
					step={1}
					inputMode="numeric"
					placeholder="50000"
					value={amount}
					disabled={sendAll}
					onChange={(e) => setAmount(e.target.value)}
				/>
			</div>
			<label className="dash-field" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
				<input
					type="checkbox"
					checked={sendAll}
					onChange={(e) => {
						setSendAll(e.target.checked);
						if (e.target.checked) setAmount("");
					}}
				/>
				<span>Send all confirmed balance</span>
			</label>
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
		</DashDialog>
	);
}
