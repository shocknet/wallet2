import { useEffect, useState } from "react";
import { useAppSelector } from "@/State/store/hooks";
import { feeHostLabel, getFeeTiers, resolveFeeUrl, type FeeTier } from "@/lib/fees";

export function useMempoolFeeTiers() {
	const mempoolUrl = useAppSelector((s) => s.prefs.mempoolUrl);
	const url = resolveFeeUrl(mempoolUrl);
	const [tiers, setTiers] = useState<FeeTier[]>([]);
	const [averageRate, setAverageRate] = useState<number | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setFailed(false);
		getFeeTiers(url)
			.then((next) => {
				if (cancelled) return;
				setTiers(next);
				const average = next.find((tier) => tier.key === "average");
				setAverageRate(average?.rate ?? next[1]?.rate ?? null);
			})
			.catch(() => {
				if (cancelled) return;
				setTiers([]);
				setAverageRate(null);
				setFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [url]);

	return { tiers, averageRate, failed, hostLabel: feeHostLabel(url) };
}
