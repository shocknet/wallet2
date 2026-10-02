export function sameArray<T>(
	a: readonly T[],
	b: readonly T[],
) {
	return a.length === b.length &&
		a.every((value, i) => value === b[i]);
}
