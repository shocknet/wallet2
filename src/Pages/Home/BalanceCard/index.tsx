import { useRef, } from "react";
import { IonButton, IonNote, IonRippleEffect, IonText } from "@ionic/react";
import { usePreferredAmountUnit } from "@/lib/hooks/usePreferredAmountUnit";
import { formatBitcoin, formatSatoshi, satsToBtc } from "@/lib/units";

import { useToast } from "@/lib/contexts/useToast";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { selectTotalBalance } from "@/State/scoped/backups/sources/selectors";
import { fetchAllSourcesHistory } from "@/State/scoped/backups/sources/history/thunks";
import { FiatDisplay } from "@/Components/FiatDisplay";



const BalanceCard = () => {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();

	const { unit, setUnit } = usePreferredAmountUnit();


	const balance = useAppSelector(selectTotalBalance);
	const displayBalance = unit === "sats" ? formatSatoshi(balance) : formatBitcoin(satsToBtc(balance))

	const holdTimer = useRef<NodeJS.Timeout | null>(null);
	const handlePointerDown = () => {
		holdTimer.current = setTimeout(async () => {
			showToast({
				message: "Resetting history cursors and fetching history",
				color: "tertiary"
			})
			dispatch(sourcesActions.resetAllCursors());
			await dispatch(fetchAllSourcesHistory());
		}, 4000);
	};
	const clearHoldTimer = () => {
		if (holdTimer.current) {
			clearTimeout(holdTimer.current);
			holdTimer.current = null;
		}
	};



	const toggleUnit = () => {
		const newUnit = unit === "BTC" ? "sats" : "BTC";
		setUnit(newUnit);

	}

	return (
		<div
			className="ion-activatable w-[93%] mx-auto h-44 border-2 border-primary
			flex flex-col justify-center items-center rounded-md bg-light
			"
			onPointerDown={handlePointerDown}
			onPointerUp={clearHoldTimer}
			onPointerLeave={clearHoldTimer}
			style={{ marginBottom: "1rem" }}
		>
			<IonRippleEffect></IonRippleEffect>
			<IonText className="text-3xl font-bold text-[color:var(--ion-text-color-step-100)]">{displayBalance}</IonText>
			<IonButton onClick={toggleUnit} fill="clear" className="ion-no-margin">{unit}</IonButton>
			<IonNote className="text-medium">

				<FiatDisplay sign="~" className="text-medium" sats={balance} />
			</IonNote>
		</div>
	);
};

export default BalanceCard;
