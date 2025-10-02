import { SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
import { IonAvatar, IonBadge, IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonGrid, IonIcon, IonItem, IonLabel, IonNote, IonRow, IonText } from "@ionic/react";
import { chevronForward, cloudOfflineOutline, copyOutline, flashOutline, globeOutline, linkOutline, radioOutline, trash, walletOutline } from "ionicons/icons";
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
	const isNprofile = source.type === SourceType.NPROFILE_SOURCE;

	const leftIcon =
		source.type === SourceType.NPROFILE_SOURCE
			? radioOutline
			: source.type === SourceType.LIGHTNING_ADDRESS_SOURCE
				? flashOutline
				: globeOutline;

	const subtitle =
		source.type === SourceType.NPROFILE_SOURCE
			? `Lightning.Pub ${source.beaconName ? `- ${source.beaconName}` : ""} • ${source.relays.length} relays`
			: source.type === SourceType.LIGHTNING_ADDRESS_SOURCE
				? `Lightning Address • ${truncate(source.sourceId)}`
				: `LNURL-Pay • ${truncate(source.sourceId)}`;

	return (
		<IonItem
			className="card-item"
			button
			detail={false}
			/* onClick={onClick} */

			aria-label={`Open source ${source.label}`}
		>
			{/* Left glyph */}
			<IonAvatar slot="start" aria-hidden="true" style={{ width: 36, height: 36 }}>
				<IonIcon icon={leftIcon} style={{ fontSize: 28 }} />
			</IonAvatar>

			<IonLabel>
				<IonGrid>
					{/* Top row: label + chevron + optional stale badge */}
					<IonRow className="ion-nowrap">
						<IonCol size="8" sizeXs="6" className="ion-text-start">
							<IonText className="text-medium text-weight-high">
								{source.label}
							</IonText>
							{true ? (
								<IonBadge color="warning" style={{ marginLeft: 8, textTransform: "none" }}>
									<IonIcon icon={cloudOfflineOutline} className="ion-margin-end" />
									stale
								</IonBadge>
							) : null}
						</IonCol>
						<IonCol size="4" sizeXs="6">
							<IonRow className="ion-justify-content-end ion-nowrap ion-align-items-center">
								<IonCol size="auto" style={{ marginLeft: "1rem" }}>
									<IonIcon color="medium" icon={chevronForward}></IonIcon>
								</IonCol>
							</IonRow>
						</IonCol>


					</IonRow>

					{/* Subtitle */}
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
