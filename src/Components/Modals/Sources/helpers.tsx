import { BeaconDiscoveryResult, fetchBeaconDiscovery } from "@/helpers/remoteBackups";
import { truncateTextMiddle } from "@/lib/format";
import { useBeaconState } from "@/lib/hooks/useBeaconState";
import {
	IonContent,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonPopover,
	IonSkeletonText,
	IonText,
} from "@ionic/react";
import moment from "moment";
import { useEffect, useState } from "react";

interface PubSourceStatusProps {
	pubkey: string;
	relays: string[];
	passedBeacon?: BeaconDiscoveryResult
}
export const PubSourceStatus = ({ pubkey, relays, passedBeacon }: PubSourceStatusProps) => {

	const [beaconData, setBeaconData] = useState<BeaconDiscoveryResult | undefined>(passedBeacon || null);
	const beaconState = useBeaconState(beaconData?.beaconLastSeenAtMs ?? 0);

	useEffect(() => {
		if (passedBeacon === undefined) {
			fetchBeaconDiscovery(pubkey, relays).then(result => setBeaconData(result));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pubkey]);

	return (
		<IonList
			lines="none"
			style={{ borderRadius: "12px", marginTop: "0.5rem" }}
		>

			<IonListHeader className="text-medium font-semibold text-base" lines="full">
				{
					beaconData === undefined
					&&
					<IonSkeletonText animated style={{ width: '60%', height: '16px' }} />
				}
				{
					beaconData === null &&
					<IonText className="text-low">Unreachable</IonText>
				}
				{
					beaconData
					&&
					<>
						<IonLabel>{beaconData.name}</IonLabel>
						{
							beaconState === "stale"
							&&
							<>
								<span
									id="status-dot"
									tabIndex={0}
									role="button"
									aria-haspopup="dialog"
									aria-label="Online status"
									style={{
										backgroundColor: "var(--ion-color-danger)",
										width: "10px",
										height: "10px",
										borderRadius: "50%",
										marginRight: "1rem"
									}}
								/>
								<IonPopover

									trigger="status-dot"
									triggerAction="click"
									side="bottom"
									alignment="start"

									className="hinty-popover"
								>
									<IonContent className="ion-padding">
										Offline
									</IonContent>

								</IonPopover>
							</>

						}
						{
							beaconState === "healthy"
							&&
							<>
								<span
									id="online-dot"
									style={{
										backgroundColor: "var(--ion-color-success)",
										width: "10px",
										height: "10px",
										borderRadius: "50%",
										marginRight: "1rem"
									}}
								/>
								<IonPopover
									showBackdrop={false}
									dismissOnSelect
									trigger="online-dot"
									triggerAction="click"
									reference="trigger"
									side="bottom"
									alignment="start"

									className="hinty-popover"
								>
									<IonContent className="ion-padding">
										Online
									</IonContent>

								</IonPopover>
							</>
						}

						{
							beaconState === "semi-stale"
							&&
							<>
								<span
									id="online-dot"
									style={{
										backgroundColor: "var(--ion-color-warning)",
										width: "10px",
										height: "10px",
										borderRadius: "50%",
										marginRight: "1rem"
									}}
								/>
								<IonPopover
									showBackdrop={false}
									dismissOnSelect
									trigger="online-dot"
									triggerAction="click"
									reference="trigger"
									side="bottom"
									alignment="start"

									className="hinty-popover"
								>
									<IonContent className="ion-padding">
										Maybe stale
									</IonContent>

								</IonPopover>
							</>
						}
					</>
				}
			</IonListHeader>
			{
				beaconData === undefined
				&&

				<IonItem>
					<IonLabel>
						<IonSkeletonText animated style={{ width: '10%', height: '16px' }} />
						<IonSkeletonText animated style={{ width: '40%', height: '16px' }} />
					</IonLabel>
				</IonItem>

			}

			{
				beaconData === null
				&&
				<IonItem>
					<IonLabel color="warning">
						No beacon was found for this nprofile
					</IonLabel>
				</IonItem>
			}

			{
				beaconData
				&&
				<>
					<IonItem className="ion-margin-top">
						<IonLabel>
							<IonText className="text-medium">
								Pubkey
							</IonText>
							<IonText
								id="pub-source-lpk"
								className="text-low code-string ion-text-wrap ion-margin"
								style={{ display: "block", width: "fit-content", marginTop: "0.7rem" }}
							>
								{truncateTextMiddle(pubkey)}
							</IonText>
							<IonPopover
								showBackdrop={false}
								dismissOnSelect
								trigger="pub-source-lpk"
								triggerAction="click"
								side="bottom"

								alignment="start"

								className="hinty-popover"
							>
								<IonContent className="ion-padding">
									{pubkey}
								</IonContent>

							</IonPopover>
						</IonLabel>
					</IonItem>
					<IonItem className="ion-margin-top">
						<IonLabel>

							<IonText
								id="pub-source-lpk"
								className="text-low code-string ion-text-wrap ion-margin"
								style={{ display: "block", width: "fit-content", marginTop: "0.7rem" }}
							>
								Last beacon: {moment(beaconData.beaconLastSeenAtMs).fromNow()}
							</IonText>

						</IonLabel>
					</IonItem>

				</>
			}

		</IonList>
	)
}
