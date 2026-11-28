export function sameSet<T>(a: readonly T[], b: readonly T[]): boolean {
	const sa = new Set(a);
	const sb = new Set(b);

	if (sa.size !== sb.size) return false;

	for (const value of sa) {
		if (!sb.has(value)) return false;
	}

	return true;
}

export function sameSetWithOrder<T>(a: readonly T[], b: readonly T[]): boolean {
	const da = [...new Set(a)];
	const db = [...new Set(b)];

	if (da.length !== db.length) return false;

	return da.every((value, i) => Object.is(value, db[i]));
}
