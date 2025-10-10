import { z } from "zod";

const ClockSchema = z.strictObject({
	v: z.number().int().nonnegative(),
	by: z.string().min(20)
});
export type Clock = z.infer<typeof ClockSchema>;

export const LwwSchema = <T extends z.ZodType>(value: T) =>
	z.strictObject({ clock: ClockSchema, value });
export type Lww<T> = { clock: Clock, value: T };

export const newLww = <T extends string | number | boolean | null>(value: T, by: string): Lww<T> => ({ clock: { v: 0, by }, value });


export const LwwFlagSchema = z.strictObject({ clock: ClockSchema, present: z.boolean() });
export type LwwFlag = z.infer<typeof LwwFlagSchema>;

export const newflag = (present: boolean, by: string): LwwFlag => ({ clock: { v: 0, by }, present });



function chooseByClock<A extends { clock: Clock }>(a: A, b: A): A {
	if (a.clock.v !== b.clock.v) return a.clock.v > b.clock.v ? a : b;
	return a.clock.by > b.clock.by ? a : b;

}

export function bump<T>(prev: Lww<T> | undefined, value: T, by: string): Lww<T> {
	return { clock: { v: (prev?.clock.v ?? 0) + 1, by }, value };
}

export function bumpFlag(prev: LwwFlag | undefined, present: boolean, by: string): LwwFlag {
	return { clock: { v: (prev?.clock.v ?? 0) + 1, by }, present };
}

export function mergeLww<T>(a: Lww<T>, b: Lww<T>): Lww<T> {
	if (!a) return b;
	if (!b) return a;
	return chooseByClock(a, b);
}

export function mergeFlags(
	a: Record<string, LwwFlag> = {},
	b: Record<string, LwwFlag> = {}
): Record<string, LwwFlag> {
	const out: Record<string, LwwFlag> = {};
	for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
		const av = a[k], bv = b[k];
		if (!av) { out[k] = bv!; continue; }
		if (!bv) { out[k] = av!; continue; }
		out[k] = chooseByClock(av, bv);
	}
	return out;
}


export function eqLww<T>(a: Lww<T>, b: Lww<T>) {
	return a.clock.v === b.clock.v && a.clock.by === b.clock.by && Object.is(a.value, b.value);
}
export function eqFlags(a: Record<string, LwwFlag>, b: Record<string, LwwFlag>) {
	const ka = Object.keys(a), kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	for (const k of ka) {
		const x = a[k], y = b[k];
		if (!y) return false;
		if (x.clock.v !== y.clock.v || x.clock.by !== y.clock.by || x.present !== y.present) return false;
	}
	return true;
}
