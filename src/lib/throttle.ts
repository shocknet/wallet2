export function throttle<F extends (...a: any[]) => void>(fn: F): F {
	let frame = 0;
	let lastArgs: any;
	const wrapped = (...args: any[]) => {
		lastArgs = args;
		if (frame === 0) {
			frame = requestAnimationFrame(() => {
				frame = 0;
				fn(...(lastArgs as any));
			});
		}
	};
	return wrapped as F;
}
