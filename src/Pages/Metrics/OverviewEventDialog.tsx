import moment from "moment";
import { DashDialog } from "@/Layout2/Metrics/DashDialog";
import {
	OverviewEvent,
	chainTxFromOpId,
	displayPeerName,
	explorerTxUrl,
} from "./overviewEvents";

export function OverviewEventDialog({
	event,
	mempoolUrl,
	onClose,
}: {
	event: OverviewEvent
	mempoolUrl: string
	onClose: () => void
}) {
	if (event.open) {
		return <OpenEventDialog event={event} mempoolUrl={mempoolUrl} onClose={onClose} />
	}
	if (event.closed) {
		return <ClosedEventDialog event={event} onClose={onClose} />
	}
	if (event.root) {
		return <RootEventDialog event={event} mempoolUrl={mempoolUrl} onClose={onClose} />
	}
	return null
}

function OpenEventDialog({
	event,
	mempoolUrl,
	onClose,
}: {
	event: OverviewEvent
	mempoolUrl: string
	onClose: () => void
}) {
	const channel = event.open
	if (!channel) return null
	const peer = displayPeerName(channel.label, channel.channel_id)
	const fundingTx = fundingTxid(channel.channel_point)
	const txUrl = fundingTx ? explorerTxUrl(mempoolUrl || "https://mempool.space", fundingTx) : undefined
	return (
		<DashDialog
			title={peer}
			onClose={onClose}
			footer={
				txUrl ? (
					<a className="dash-btn" href={txUrl} target="_blank" rel="noreferrer">
						View funding tx
					</a>
				) : undefined
			}
		>
			<dl className="dash-policy">
				<InfoRow label="Peer" value={peer} />
				<InfoRow label="Status" value={channel.active ? "Online" : "Offline"} />
				<InfoRow label="Capacity" value={sats(channel.capacity)} />
				<InfoRow label="Local" value={sats(channel.local_balance)} />
				<InfoRow label="Remote" value={sats(channel.remote_balance)} />
				<InfoRow label="Channel id" value={channel.channel_id} />
				{channel.channel_point && <InfoRow label="Channel point" value={channel.channel_point} />}
				{!channel.active && channel.inactive_since_unix ? (
					<InfoRow label="Last seen" value={moment(channel.inactive_since_unix * 1000).fromNow()} />
				) : null}
			</dl>
		</DashDialog>
	)
}

function ClosedEventDialog({ event, onClose }: { event: OverviewEvent; onClose: () => void }) {
	const closed = event.closed
	if (!closed) return null
	return (
		<DashDialog title={event.message} onClose={onClose}>
			<dl className="dash-policy">
				<InfoRow label="Channel id" value={closed.channel_id} />
				{closed.capacity != null && closed.capacity > 0 && (
					<InfoRow label="Capacity" value={`${closed.capacity} sats`} />
				)}
				{closed.closed_height > 0 && (
					<InfoRow label="Close height" value={String(closed.closed_height)} />
				)}
				{event.unix > 0 && (
					<InfoRow label="When" value={moment(event.unix * 1000).format("ll LT")} />
				)}
			</dl>
		</DashDialog>
	)
}

function RootEventDialog({
	event,
	mempoolUrl,
	onClose,
}: {
	event: OverviewEvent
	mempoolUrl: string
	onClose: () => void
}) {
	const root = event.root
	if (!root) return null
	const txid = chainTxFromOpId(root.op_id)
	const txUrl = txid ? explorerTxUrl(mempoolUrl || "https://mempool.space", txid) : undefined
	return (
		<DashDialog
			title={event.message}
			onClose={onClose}
			footer={
				txUrl ? (
					<a className="dash-btn" href={txUrl} target="_blank" rel="noreferrer">
						View transaction
					</a>
				) : undefined
			}
		>
			<dl className="dash-policy">
				<InfoRow label="Type" value={root.op_type === "INVOICE_OP" ? "Invoice" : "On-chain"} />
				<InfoRow label="Amount" value={`${root.amount} sats`} />
				{event.unix > 0 && (
					<InfoRow label="When" value={moment(event.unix * 1000).format("ll LT")} />
				)}
				{txid && <InfoRow label="Transaction" value={txid} />}
				{!txid && root.op_id && <InfoRow label="Id" value={root.op_id} />}
			</dl>
		</DashDialog>
	)
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="dash-policy-row">
			<dt>{label}</dt>
			<dd>{value}</dd>
		</div>
	)
}

function sats(n: number | undefined): string {
	return `${(n ?? 0).toLocaleString()} sats`
}

function fundingTxid(channelPoint: string | undefined): string | undefined {
	const txid = channelPoint?.split(":")[0]
	if (txid && /^[0-9a-fA-F]{64}$/.test(txid)) return txid
	return undefined
}
