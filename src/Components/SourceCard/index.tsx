import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import { SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
import { useAppSelector } from "@/State/store/hooks";
import { IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonRow, IonText } from "@ionic/react";
import { star, walletOutline, personCircleOutline } from "ionicons/icons";
import "./styles/index.css";
import { formatSatoshi } from "@/lib/units";
import { Satoshi } from "@/lib/types/units";

interface Props {
	source: SourceView;
	onClick: (s: SourceView) => void;
}
const SourceCard = ({ source, onClick: onPick }: Props) => {

	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const isNprofile = source.type === SourceType.NPROFILE_SOURCE;

	const label = source.type === SourceType.NPROFILE_SOURCE
		? source.beaconName || source.label || "Unnamed source"
		: source.sourceId;

	return (
		<IonItem
			className="source-card-item"
			button
			detail={false}
			onClick={() => onPick(source)}

			aria-label={`Open source ${source.label} `}
		>
			<IonIcon slot="start" icon={personCircleOutline} className="source-card-icon" />
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

			{/* <div slot="end">

				<IonGrid slot="end">
					<IonRow className="ion-align-items-start">
						<IonCol size="7">

						</IonCol>
						<IonCol size="7">
							<IonIcon icon={starOutline} />
						</IonCol>
					</IonRow>
				</IonGrid>
			</div> */}
			{/* 			<IonIcon slot="end" icon={starOutline} /> */}

			{/* <IonLabel>
				<IonGrid>
					<IonRow className="ion-nowrap ion-align-items-center">
						<IonCol size="8" sizeXs="6" className="ion-text-start">
							<IonRow className="ion-justify-content-start ion-nowrap">
								<IonCol size="auto">
									<IonText className="ion-text-start text-medium text-lg text-weight-high ellipse-two-lines">
										{label}
									</IonText>
								</IonCol>
								<IonCol size="auto">
									{(source.type === SourceType.NPROFILE_SOURCE && source.beaconStale) ? (
										<IonBadge color="warning" style={{ marginLeft: 8, textTransform: "none" }}>
											<IonIcon icon={cloudOfflineOutline} className="ion-margin-end" />
											stale
										</IonBadge>
									) : null}
								</IonCol>
							</IonRow>

						</IonCol>

						<IonCol size="4" sizeXs="6">
							<IonRow className="ion-justify-content-end  ion-nowrap ion-align-items-center">
								{
									favoriteSourceId === source.sourceId
									&&
									<IonCol size="auto" style={{ marginRight: "0.4rem" }}>

										<IonIcon color="primary" className="text-md" icon={star} />

									</IonCol>
								}
								<IonCol size="auto" >

									<IonIcon color="medium" icon={chevronForward}></IonIcon>
								</IonCol>
							</IonRow>
						</IonCol>


					</IonRow>

					<IonRow className="ion-nowrap" style={{ marginTop: "0.4rem" }}>
						<IonCol>
							<IonBadge color="light" className="wallet-box-shadow">

								{
									source.type === SourceType.NPROFILE_SOURCE
										? "Lightning.Pub"
										: "Lightning Address"
								}


							</IonBadge>

						</IonCol>
					</IonRow>
					<IonRow className="ion-nowrap ion-margin-top">
						<IonCol>
							<IonText className="text-medium text-md">{subtitle}</IonText>
						</IonCol>
					</IonRow>


					{isNprofile && (
						<IonRow className="ion-nowrap ion-margin-top ion-align-items-center" style={{ gap: 12 }}>
							<IonCol size="auto" className="ion-no-padding">
								<IonText className="text-medium" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
									<IonIcon icon={walletOutline} />
									{fmtSats(source.balanceSats)}
								</IonText>
							</IonCol>
							<IonCol size="auto" className="ion-no-padding">
								<IonText className="text-medium" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
									<IonIcon icon={linkOutline} />
									Spendable: {fmtSats(source.maxWithdrawableSats)}
								</IonText>
							</IonCol>
						</IonRow>
					)}
				</IonGrid>
			</IonLabel> */}
		</IonItem>
	);
};

export default SourceCard;
