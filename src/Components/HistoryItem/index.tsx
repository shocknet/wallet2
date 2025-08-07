import type { SourceActualOperation, SourceOperation } from "@/State/history/types";
import { IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonNote, IonRow, IonText } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { getOperationDisplayData } from "./getDisplayData";
import { useSelector } from "@/State/store";
import styles from "./styles/index.module.scss";
import { usePreferredAmountUnit } from "@/lib/hooks/usePreferredAmountUnit";
import { formatBitcoin, formatSatoshi, satsToBtc } from "@/lib/units";
import { convertSatsToFiat } from "@/lib/fiat";
import { formatFiat } from "@/lib/format";




interface HistoryItemProps {
	operation: SourceOperation & { sourceId: string };
	handleSelectOperation: (operation: SourceOperation) => void;
}

const HistoryItem = ({ operation, handleSelectOperation }: HistoryItemProps) => {
	const [_tick, setTick] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => {
			setTick(t => t + 1);
		}, 60 * 1000);
		return () => clearInterval(interval);
	}, []);


	const { unit } = usePreferredAmountUnit();

	const { url, currency } = useSelector(state => state.prefs.FiatUnit)
	const [displayAmount, setDisplayAmount] = useState("");




	const { label, date, typeIcon, typeIconColor, color, directionIcon, sign } = getOperationDisplayData(operation);

	const [fiatAmount, setFiatAmount] = useState<string | null>(null);

	useEffect(() => {

		const convertedValue = unit === "BTC"

			? formatBitcoin(satsToBtc(operation.amount))
			: formatSatoshi(operation.amount);
		setDisplayAmount(convertedValue);

		const setFiat = async () => {
			const fiat = await convertSatsToFiat(operation.amount, currency, url);
			setFiatAmount(formatFiat(fiat, currency));

		}
		setFiat();
	}, [operation, currency, url, unit]);







	const handleItemClick = () => {
		handleSelectOperation(operation);
	}

	return (


		<IonItem lines="full" className={styles["history-item"]} detail={false} button onClick={handleItemClick}>
			<IonIcon
				slot="start"
				icon={typeIcon}
				style={{ color: typeIconColor, margin: "10px", alignSelf: "start" }}
			></IonIcon>
			<IonLabel color="primary" >
				<IonGrid>
					<IonRow className="ion-nowrap">
						<IonCol size="8" sizeXs="6" className="ion-text-start" >
							<h2>{label || <span style={{ opacity: 0.8 }}>&lt;no label&gt;</span>}</h2>
						</IonCol>
						<IonCol size="4" sizeXs="6">
							<IonRow className="ion-text-end ion-nowrap">
								<IonCol size="auto" style={{ marginLeft: "auto" }}>
									<IonIcon
										icon={directionIcon}
										color={color}
										aria-label={operation.inbound ? "Received" : "Sent"}
										className={styles["amount"]}
										style={{ marginRight: "4px" }}
									/>
								</IonCol>
								<IonCol size="auto">
									<IonText className={styles["amount"]} color={color}>{sign}{displayAmount}</IonText>
								</IonCol>
							</IonRow>
						</IonCol>
					</IonRow>
					<IonRow>
						<IonCol>
							<IonNote className="text-low">{date}</IonNote>
						</IonCol>
						<IonCol size="auto">
							{fiatAmount &&
								(<IonNote className="text-low">
									{sign}{fiatAmount}
								</IonNote>)}
						</IonCol>
					</IonRow>
				</IonGrid>
			</IonLabel>
		</IonItem>


	);
}

HistoryItem.displayName = "HistoryItem";

export default React.memo(HistoryItem, areEqual);





function areEqual(prevProps: HistoryItemProps, nextProps: HistoryItemProps) {

	if (prevProps.handleSelectOperation !== nextProps.handleSelectOperation) return false;


	if ("optimistic" in prevProps.operation && prevProps.operation.optimistic) return false; // If prev is optimistic always rerender

	const prev = prevProps.operation as SourceActualOperation;
	const next = nextProps.operation as SourceActualOperation;

	if (prev.memo !== next.memo) return false;

	if (prev.paidAtUnix !== next.paidAtUnix) return false;


	if (prev.type === "INVOICE" && next.type === "INVOICE") {
		if (prev.internal && next.internal) {
			if (prev.serviceFee !== next.serviceFee) return false;
		} else {
			if (prev.networkFee !== next.networkFee) return false;
		}
	}
	return true;
}
