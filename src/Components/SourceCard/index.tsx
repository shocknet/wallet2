import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import { SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
import { useAppSelector } from "@/State/store/hooks";
import { IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonRow, IonText } from "@ionic/react";
import { star, walletOutline, personCircleOutline } from "ionicons/icons";
import "./styles/index.css";
import { formatSatoshi } from "@/lib/units";
import { Satoshi } from "@/lib/types/units";
import cn from "clsx";


interface Props {
	source: SourceView;
	onClick: (s: SourceView) => void;
	button?: boolean
}
const SourceCard = ({ source, onClick: onPick, button = true }: Props) => {

	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const isNprofile = source.type === SourceType.NPROFILE_SOURCE;





	const label = source.type === SourceType.NPROFILE_SOURCE
		? source.beaconName || source.label || "Unnamed source"
		: source.label || source.sourceId;


	return (
		<IonItem
			className="source-card-item"
			button={button}
			detail={false}
			onClick={() => onPick(source)}

			aria-label={`Open source ${source.label} `}
		>
			<div slot="start" className="relative">

				<IonIcon icon={personCircleOutline} className="text-6xl  block" />
				{
					isNprofile
					&&
					<div
						className={cn(
							"absolute w-3 h-3 rounded-full bottom-2 right-2",
							source.beaconStale === "stale" && "bg-red-600",
							source.beaconStale === "warmingUp" && "bg-orange-300",
							source.beaconStale === "fresh" && "bg-green-500"
						)}
					/>
				}

			</div>
			<IonLabel>
				<IonGrid>
					<IonRow className="ion-nowrap ion-align-items-center">
						<IonCol className="ion-text-start" style={{ flex: "1 1 0", minWidth: 0, paddingTop: "1.2rem" }}>
							<IonText className="source-card-item-title text-high">
								{label}
							</IonText>
						</IonCol>
						<IonCol size="auto" className="ion-text-end" style={{ flex: "0 0 auto", marginRight: "0.8rem" }} >
							{
								favoriteSourceId === source.sourceId
								&&
								<IonIcon color="primary" className="text-md" icon={star} />
							}
						</IonCol>
					</IonRow>
					<IonRow className="ion-nowrap ion-align-items-center ion-margin-top">
						<IonCol className="ion-text-start" style={{ flex: "1 1 0", minWidth: 0 }}>
							{
								isNprofile
								&&
								<IonText className="text-medium balance-row">
									<IonIcon icon={walletOutline} />
									{formatSatoshi(source.balanceSats ?? 0 as Satoshi)} sats
								</IonText>
							}
						</IonCol>
					</IonRow>
				</IonGrid>
			</IonLabel>
		</IonItem>
	);
};

export default SourceCard;
