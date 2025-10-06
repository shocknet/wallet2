import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import { SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
import { useAppSelector } from "@/State/store/hooks";
import { IonAvatar, IonBadge, IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonNote, IonRow, IonText } from "@ionic/react";
import { chevronForward, star, cloudOfflineOutline, copyOutline, flashOutline, globeOutline, linkOutline, radioOutline, starOutline, trash, walletOutline } from "ionicons/icons";
interface Props {
	source: SourceView;
	onClick: (s: SourceView) => void;
}
const SourceCard = ({ source, onClick }: Props) => {
	return <Inner source={source} onClick={onClick} />

}


const fmtSats = (n: number | undefined) =>
	(+(n ?? 0)).toLocaleString() + " sats";

const truncate = (s: string, n = 24) =>
	s.length > n ? s.slice(0, n - 3) + "…" : s;

export const Inner = ({ source, onClick }: Props) => {

	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const isNprofile = source.type === SourceType.NPROFILE_SOURCE;

	const leftIcon =
		source.type === SourceType.NPROFILE_SOURCE
			? radioOutline
			: source.type === SourceType.LIGHTNING_ADDRESS_SOURCE
				? flashOutline
				: globeOutline;


	const label = source.type === SourceType.NPROFILE_SOURCE
		? source.beaconName || source.label || "Unnamed source"
		: source.sourceId;

	const subtitle =
		source.type === SourceType.NPROFILE_SOURCE
			? `${source.beaconName
				? source.label
					? `${source.label}`
					: ""
				: ""
			} • ${source.relays.length} relays`
			: ""



	return (
		<IonItem
			className="card-item"
			button
			detail={false}
			onClick={onClick}

			aria-label={`Open source ${source.label} `}
		>

			<IonAvatar slot="start" aria-hidden="true" style={{ width: 36, height: 36, marginLeft: "0.8rem" }}>
				<IonIcon icon={leftIcon} style={{ fontSize: 28 }} />
			</IonAvatar>

			<IonLabel>
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

					{/* Details row (nprofile only) */}
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
			</IonLabel>
		</IonItem>
	);
};

export default SourceCard;
