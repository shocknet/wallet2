import { selectSpendsTotalBalance, useSelector } from "@/State/store";
import { useEffect, useState } from "react";
import styles from "./styles/index.module.scss";
import { IonButton, IonNote, IonRippleEffect, IonText } from "@ionic/react";
import { usePreferredAmountUnit } from "@/lib/hooks/usePreferredAmountUnit";
import { formatBitcoin, formatSatoshi, satsToBtc } from "@/lib/units";
import { convertSatsToFiat } from "@/lib/fiat";
import { formatFiat } from "@/lib/format";



const BalanceCard = () => {

	const { unit, setUnit } = usePreferredAmountUnit();


	const { url, currency } = useSelector(state => state.prefs.FiatUnit)
	const balance = useSelector(selectSpendsTotalBalance);
	const [money, setMoney] = useState("");
	const [displayBalance, setDisplayBalance] = useState(unit === "sats" ? formatSatoshi(balance) : formatBitcoin(satsToBtc(balance)));


	useEffect(() => {
		if (unit === "BTC") {
			setDisplayBalance(formatBitcoin(satsToBtc(balance)));
		}
		else {
			setDisplayBalance(formatSatoshi(balance));
		}
	}, [unit, balance]);

	useEffect(() => {
		setDisplayBalance(formatSatoshi(balance));
		const setFiat = async () => {
			const fiat = await convertSatsToFiat(balance, currency, url);
			setMoney(formatFiat(fiat, currency));
		}
		setFiat();
	}, [balance, currency, url]);



	const toggleUnit = () => {
		const newUnit = unit === "BTC" ? "sats" : "BTC";
		setUnit(newUnit);

	}

	return (
		<div className={`${styles["balance-card"]} ion-activatable`}>
			<IonRippleEffect></IonRippleEffect>
			<IonText color="light" className={styles["amount"]}>{displayBalance}</IonText>
			<IonButton onClick={toggleUnit} fill="clear" className="ion-no-margin">{unit}</IonButton>
			{
				money && <IonNote>~ {money}</IonNote>
			}
		</div>
	);
};

export default BalanceCard;