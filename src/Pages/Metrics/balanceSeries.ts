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
	const level = Math.max(Math.abs(last), Math.abs(lo), Math.abs(hi), 1)
	const span = hi - lo
	if (span <= level * 0.025) {
		return padAround(last, Math.max(level * 0.2, 1_000))
	}
	const pad = Math.max(span * 0.12, level * 0.02, 1_000)
	return { min: lo - pad, max: hi + pad }
}

function padAround(mid: number, pad: number): { min: number; max: number } {
	return { min: mid - pad, max: mid + pad }
}

export function xBounds(a: BalancePt[], b: BalancePt[]): { min: number; max: number } {
	const xs = [...a, ...b].map((p) => p.x)
	if (xs.length === 0) return { min: 0, max: 1 }
	const min = Math.min(...xs)
	const max = Math.max(...xs)
	return { min, max: max === min ? min + 1 : max }
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
