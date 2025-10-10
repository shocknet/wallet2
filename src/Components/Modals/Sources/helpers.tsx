import { RelayManager } from "@/Components/RelayManager";
import { BeaconDiscoveryResult, fetchBeaconDiscovery } from "@/helpers/remoteBackups";
import { truncateTextMiddle } from "@/lib/format";
import {
	IonButton,
	IonContent,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonPopover,
	IonSkeletonText,
	IonText,
	IonToggle
} from "@ionic/react";
import classNames from "classnames";
import { closeOutline } from "ionicons/icons";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "./styles/index.module.scss";
import CardishList from "@/Components/CardishList";

export const PubSourceStatus = ({ pubkey, relays }: { pubkey: string, relays: string[] }) => {
	const [beaconData, setBeaconData] = useState<BeaconDiscoveryResult | undefined>(null);

	useEffect(() => {
		fetchBeaconDiscovery(pubkey, relays, 2 * 60).then(result => setBeaconData(result))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pubkey]);

	return (
		<IonList

			lines="none"
			style={{ borderRadius: "12px", marginTop: "0.5rem" }}

		>

			<IonListHeader className="text-medium" style={{ fontWeight: "600", fontSize: "1rem" }} lines="full">
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
							beaconData.stale
								?
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
											Online
										</IonContent>

									</IonPopover>
								</>

								:
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
				</>
			}

		</IonList>
	)
}

interface BasicSourceInfoEditProps {
	label: string;
	setLabel: Dispatch<SetStateAction<string>>;
	relays?: string[];
	setRelays?: Dispatch<SetStateAction<string[]>>;
	bridgeUrl?: string;
	setBridgeUrl?: Dispatch<SetStateAction<string>>;
	isNDebitDiscoverable?: boolean;
	setIsNDebitDiscoverable?: Dispatch<SetStateAction<boolean>>
}
export const BasicSourceInfoEdit = ({
	label,
	setLabel,
	relays,
	setRelays,
	bridgeUrl,
	setBridgeUrl,
	isNDebitDiscoverable,
	setIsNDebitDiscoverable
}: BasicSourceInfoEditProps) => {
	const [isEditingRelays, setIsEditingRelays] = useState(false);
	return (
		<>
			<CardishList listHeader="Source Info" className={classNames(styles["edit-list"], "ion-margin-top")} lines="none">
				<IonItem className={classNames(styles["edit-item-input"], "ion-margin-top")}>

					<IonInput
						placeholder="My savings source"
						color="primary"
						labelPlacement="stacked"
						label="Label"
						value={label}
						onIonInput={(e) => setLabel(e.detail.value ?? "")}
						mode="md"
						fill="outline"
						style={{ "--padding-end": "50px" }}
						className="ion-margin-top"

					/>
				</IonItem>
				{
					(bridgeUrl && setBridgeUrl)
					&&
					<IonItem>
						<IonInput
							color="primary"
							label="Bridge URL"
							labelPlacement="stacked"
							inputmode="url"
							placeholder="https://…"
							value={bridgeUrl}
							onIonInput={(e) => setBridgeUrl(e.detail.value ?? "")}
							mode="md"
							fill="outline"
							className="ion-margin-top"
							style={{ "--padding-end": "50px" }}
						/>
					</IonItem>
				}
				{
					(isNDebitDiscoverable !== undefined && setIsNDebitDiscoverable)
					&&
					<IonItem lines="none" className="ion-margin-top">
						<IonToggle checked={isNDebitDiscoverable} onIonChange={(e) => setIsNDebitDiscoverable(e.detail.checked)}>
							<IonText className="text-medium">ndebit discoverable</IonText>
						</IonToggle>
					</IonItem>
				}

			</CardishList>
			{
				(relays && setRelays)
				&&
				<div>
					<IonList

						lines="none"
						style={{ borderRadius: "12px", marginTop: "0.5rem" }}

					>
						<IonListHeader className="text-medium" style={{ fontWeight: "600", fontSize: "1rem" }} lines="full">
							<IonLabel >Relays</IonLabel>
							{
								isEditingRelays
									?
									<IonButton style={{ marginRight: "0.5rem" }} onClick={() => setIsEditingRelays(false)}>
										<IonIcon icon={closeOutline} slot="icon-only" />
									</IonButton>
									:
									<IonButton style={{ marginRight: "0.5rem" }} onClick={() => setIsEditingRelays(true)}>
										Edit
									</IonButton>
							}
						</IonListHeader>
						{
							isEditingRelays
								? (
									<>
										<IonItem>
											<IonLabel color="warning">
												<IonText>
													Your node should be listening on relays you add here
												</IonText>
											</IonLabel>
										</IonItem>
										<RelayManager relays={relays} setRelays={setRelays} />
									</>
								)
								: relays.map(r => (
									<IonItem key={r}>
										<IonText className="text-medium text-weight-medium" style={{ textDecoration: "underline" }}>
											{r}
										</IonText>
									</IonItem>
								))
						}
					</IonList>
				</div>
			}
		</>
	)
}
