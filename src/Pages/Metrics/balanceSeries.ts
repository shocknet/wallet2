export type BalancePt = { x: number; y: number }

export function alignBalanceSeries(chain: BalancePt[], chans: BalancePt[]): {
	chain: BalancePt[]
	chans: BalancePt[]
} {
	const xs = uniqueXs(chain, chans)
	return { chain: holdAt(xs, chain), chans: holdAt(xs, chans) }
}

export function axisRange(data: BalancePt[]): { min: number; max: number } {
	const ys = data.map((p) => p.y)
	if (ys.length === 0) return { min: 0, max: 1 }
	const lo = Math.min(...ys)
	const hi = Math.max(...ys)
	const last = ys[ys.length - 1]
	const span = hi - lo
	if (span === 0) {
		const level = Math.max(Math.abs(last), 1)
		return padAround(last, Math.max(level * 0.2, 1_000))
	}
	const pad = Math.max(span * 0.12, 1_000)
	return { min: lo - pad, max: hi + pad }
}

export function pairAxisRanges(chain: BalancePt[], chans: BalancePt[]): {
	chain: { min: number; max: number }
	chans: { min: number; max: number }
} {
	if (isFlat(chain) && isFlat(chans)) {
		return { chain: placeLine(chain, 0.32), chans: placeLine(chans, 0.68) }
	}
	return { chain: axisRange(chain), chans: axisRange(chans) }
}

export function fillBlockGaps(pts: BalancePt[], maxSpan = 2500): BalancePt[] {
	if (pts.length < 2) return pts
	const sorted = [...pts].sort((a, b) => a.x - b.x)
	const start = sorted[0].x
	const end = sorted[sorted.length - 1].x
	if (end - start > maxSpan) return sorted
	const byX = new Map(sorted.map((p) => [p.x, p.y]))
	const out: BalancePt[] = []
	let y = sorted[0].y
	for (let x = start; x <= end; x++) {
		const next = byX.get(x)
		if (next !== undefined) y = next
		out.push({ x, y })
	}
	return out
}

function isFlat(data: BalancePt[]): boolean {
	if (data.length === 0) return true
	const ys = data.map((p) => p.y)
	return Math.max(...ys) === Math.min(...ys)
}

function placeLine(data: BalancePt[], at: number): { min: number; max: number } {
	const y = data[data.length - 1]?.y ?? 0
	const level = Math.max(Math.abs(y), 1)
	const span = Math.max(level * 0.4, 2_000)
	return { min: y - at * span, max: y + (1 - at) * span }
}

function padAround(mid: number, pad: number): { min: number; max: number } {
	return { min: mid - pad, max: mid + pad }
}

function uniqueXs(a: BalancePt[], b: BalancePt[]): number[] {
	return [...new Set([...a, ...b].map((p) => p.x))].sort((l, r) => l - r)
}

function holdAt(xs: number[], series: BalancePt[]): BalancePt[] {
	if (series.length === 0 || xs.length === 0) return []
	const byX = new Map(series.map((p) => [p.x, p.y]))
	let y = series[0].y
	const start = series[0].x
	return xs
		.filter((x) => x >= start)
		.map((x) => {
			const next = byX.get(x)
			if (next !== undefined) y = next
			return { x, y }
		})
}
