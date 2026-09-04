export type OverviewEvent = {
	eventType: "🚨" | "⚡️" | "🔗"
	unix: number
	message: string
	open?: OpenChan
	closed?: ClosedChan
	root?: RootOp
}
export type PeriodRange = { from_unix: number; to_unix: number }

type GraphPt = { x: number }
export type OpenChan = {
	channel_id: string
	label: string
	channel_point?: string
	capacity?: number
	local_balance?: number
	remote_balance?: number
	active?: boolean
	inactive_since_unix?: number
}
type ClosedChan = { channel_id: string; close_tx_timestamp: number; closed_height: number; capacity?: number }
type RootOp = { op_type: string; amount: number; created_at_unix: number; op_id: string }

export function buildOverviewEvents(
	node: {
		open_channels: OpenChan[]
		closed_channels: ClosedChan[]
		root_ops: RootOp[]
		chain_balance: GraphPt[]
		channel_balance: GraphPt[]
		external_balance: GraphPt[]
	},
	range: PeriodRange | undefined,
): OverviewEvent[] {
	const blocks = graphBlockRange(node)
	const openedLive = node.open_channels
		.filter((c) => openInPeriod(scidHeight(c.channel_id), range, blocks))
		.map((c): OverviewEvent => ({
			eventType: "🔗",
			unix: unixAtHeight(scidHeight(c.channel_id), blocks),
			message: `Channel opened · ${displayPeerName(c.label, c.channel_id)}`,
			open: c,
		}))
	const openedClosed = node.closed_channels
		.filter((c) => openInPeriod(scidHeight(c.channel_id), range, blocks))
		.map((c): OverviewEvent => ({
			eventType: "🔗",
			unix: unixAtHeight(scidHeight(c.channel_id), blocks),
			message: `Channel opened · ${displayPeerName(undefined, c.channel_id)}`,
			closed: c,
		}))
	const closed = node.closed_channels
		.filter((c) => closeInPeriod(c, range, blocks))
		.map((c): OverviewEvent => ({
			eventType: "🚨",
			unix: c.close_tx_timestamp || unixAtHeight(c.closed_height, blocks),
			message: `Channel closed · ${displayPeerName(undefined, c.channel_id)}`,
			closed: c,
		}))
	const ops = node.root_ops
		.filter((o) => o.created_at_unix <= 0 || inPeriod(o.created_at_unix, range))
		.map((o): OverviewEvent => ({
			eventType: "⚡️",
			unix: o.created_at_unix,
			message: `${rootOpTitle(o.op_type)} · ${o.amount} sats`,
			root: o,
		}))
	return [...openedLive, ...openedClosed, ...closed, ...ops].sort((a, b) => b.unix - a.unix)
}

export function scidHeight(chanId: string): number {
	try {
		const id = BigInt(chanId)
		if (id <= 0n) return 0
		return Number(id >> 40n)
	} catch {
		return 0
	}
}

export function displayPeerName(label: string | undefined, channelId: string): string {
	return firstAlias(label) || trimId(channelId)
}

export function firstAlias(...candidates: (string | undefined)[]): string {
	for (const raw of candidates) {
		const name = raw?.trim()
		if (name && !isNodePubkey(name)) return name
	}
	return ""
}

export function isNodePubkey(value: string): boolean {
	return /^(02|03)[0-9a-fA-F]{64}$/.test(value)
}

export function chainTxFromOpId(opId: string): string | undefined {
	return opId.split(":").find((part) => /^[0-9a-fA-F]{64}$/.test(part))
}

export function explorerTxUrl(mempoolUrl: string, txid: string): string {
	try {
		return `${new URL(mempoolUrl).origin}/tx/${txid}`
	} catch {
		return `https://mempool.space/tx/${txid}`
	}
}

function rootOpTitle(opType: string): string {
	if (opType === "INVOICE_OP") return "Invoice credit"
	return "On-chain credit"
}

function graphBlockRange(node: {
	chain_balance: GraphPt[]
	channel_balance: GraphPt[]
	external_balance: GraphPt[]
}): { min: number; max: number } | undefined {
	const xs = [
		...node.chain_balance.map((p) => p.x),
		...node.channel_balance.map((p) => p.x),
		...node.external_balance.map((p) => p.x),
	]
	if (xs.length === 0) return undefined
	return { min: Math.min(...xs), max: Math.max(...xs) }
}

function openInPeriod(
	height: number,
	range: PeriodRange | undefined,
	blocks: { min: number; max: number } | undefined,
): boolean {
	if (height <= 0) return false
	if (!range) return true
	return inBlockRange(height, blocks)
}

function closeInPeriod(
	c: ClosedChan,
	range: PeriodRange | undefined,
	blocks: { min: number; max: number } | undefined,
): boolean {
	if (inPeriod(c.close_tx_timestamp, range)) return true
	if (inBlockRange(c.closed_height, blocks)) return true
	return !range && c.closed_height > 0
}

function inBlockRange(height: number, blocks: { min: number; max: number } | undefined): boolean {
	if (!blocks || height <= 0) return false
	return height >= blocks.min && height <= blocks.max
}

function inPeriod(unix: number, range: PeriodRange | undefined): boolean {
	if (unix <= 0) return false
	if (!range) return true
	return unix >= range.from_unix && unix <= range.to_unix
}

export function unixAtHeight(
	height: number,
	blocks: { min: number; max: number } | undefined,
	nowUnix = Math.floor(Date.now() / 1000),
): number {
	if (height <= 0 || !blocks) return 0
	return nowUnix - Math.max(0, blocks.max - height) * 600
}

function trimId(text: string): string {
	return text.length < 10 ? text : `${text.substring(0, 5)}...${text.substring(text.length - 5)}`
}
