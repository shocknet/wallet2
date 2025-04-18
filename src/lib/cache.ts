const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getCache = (cacheKey: string) => {
	const cached = localStorage.getItem(cacheKey);
	if (!cached) return null;

	const { data, timestamp } = JSON.parse(cached);
	const age = Date.now() - timestamp;

	return age < CACHE_TTL ? data : null;
};

export const setCache = (cacheKey: string, data: any) => {
	const entry = {
		data,
		timestamp: Date.now()
	};
	localStorage.setItem(cacheKey, JSON.stringify(entry));
}