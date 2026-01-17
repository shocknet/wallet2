import { convertSatsToFiat } from "@/lib/fiat";
import { formatFiat } from "@/lib/format";
import { Satoshi } from "@/lib/types/units";
import { selectFiatCurrency } from "@/State/scoped/backups/identity/slice";
import { useAppSelector } from "@/State/store/hooks";
import { useEffect, useState } from "react";

import { FiatCurrency } from "@/State/scoped/backups/identity/schema";
import { IonNote } from "@ionic/react";
import cn from "clsx";

interface FiatDisplayProps {
	className?: string;
	sats: Satoshi | null;
	sign?: string;
}

export const FiatDisplay = ({ sats, sign, className }: FiatDisplayProps) => {

	const currency = useAppSelector(selectFiatCurrency);
	const [fiatAmount, setFiatAmount] = useState("");

	useEffect(() => {
		let alive = true;
		const setFiat = async () => {
			if (!sats) {
				setFiatAmount("");
				return;
			}
			const fiat = await convertSatsToFiat(sats, currency);
			if (!alive) return;
			setFiatAmount(formatFiat(fiat, currency));
		}
		setFiat();
		return () => {
			alive = false;
		}
	}, [sats, currency]);

	if (!fiatAmount) return null;

	return (
		<IonNote className={cn("text-medium", className)}>
			{sign && <span>{sign}</span>}
			{fiatAmount}
		</IonNote>

	)

}

export const getFiatString = async (sats: Satoshi | null, currency: FiatCurrency) =>
	sats ? formatFiat((await convertSatsToFiat(sats, currency)), currency) : "";

