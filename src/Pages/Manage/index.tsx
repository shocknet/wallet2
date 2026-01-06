import React, { useMemo, useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";
import { getNostrClient } from "@/Api/nostr";
import {
	IonContent,
	IonHeader,
	IonPage,
	useIonRouter,
	useIonLoading,
} from "@ionic/react";
import MetricsSubPageToolbar from "@/Layout2/Metrics/MetricsSubPageToolbar";
import { nip19 } from "nostr-tools";


import { useAppSelector } from "@/State/store/hooks";
import { selectAdminNprofileViews } from "@/State/scoped/backups/sources/selectors";
import { selectSelectedMetricsAdminSourceId } from "@/State/runtime/slice";

const Manage = () => {
	const router = useIonRouter();

	const [isShowQuestion, setIsShowQuestion] = useState<boolean>(false);
	const [isRevealed, setIsRevealed] = useState<boolean>(false);
	const [seed, setSeed] = useState<string[]>([])
	const [nodeName, setNodeName] = useState<string>("");
	const [specificNostr, setSpecificNostr] = useState<string>("");
	const [isNodeDiscover, setIsNodeDiscover] = useState<boolean>(true);
	const [isDefaultManage, setIsDefaultManage] = useState<boolean>(true);
	const [isAutoService, setIsAutoService] = useState<boolean>(true);
	const [isRecoveryKey, setIsRecoveryKey] = useState<boolean>(true);

	const [error, setError] = useState<string | null>(null);
	const [presentLoading, dismissLoading] = useIonLoading();


	const admins = useAppSelector(selectAdminNprofileViews);
	const selectedId = useAppSelector(selectSelectedMetricsAdminSourceId);
	const adminSource = useMemo(
		() => admins.find(a => a.sourceId === selectedId),
		[admins, selectedId]
	)!;

	const seeditems: string[] = [
		"albert",
		"biscuit",
		"carrot",
		"daisy",
		"elephant",
		"fruit",
		"albert",
		"biscuit",
		"carrot",
		"daisy",
		"elephant",
		"fruit",
		"albert",
		"biscuit",
		"carrot",
		"daisy",
		"elephant",
		"fruit",
		"albert",
		"fruit",
	];

	const fetchSeed = async () => {
		setError(null);


		if (isRevealed) {
			setIsRevealed(false);
			return;
		}

		setIsRevealed(true);

		await dismissLoading();
		await presentLoading("Fetching seed...");

		try {
			const client = await getNostrClient(
				{ pubkey: adminSource.lpk, relays: adminSource.relays },
				adminSource.keys!
			);

			const res = await client.GetSeed();
			if (res.status !== "OK") {
				setError(res.reason || "Failed to fetch seed");
				toast.error(
					<Toast
						title="Metrics Error"
						message={`failed to fetch seed ${res.reason}`}
					/>
				);
				return;
			}

			setSeed(res.seed);
		} catch (e) {
			console.error(e);
			const msg = e instanceof Error ? e.message : "Failed to fetch seed";
			setError(msg);
			toast.error(<Toast title="Metrics Error" message={`failed to fetch seed ${msg}`} />);
		} finally {
			await dismissLoading();
		}
	}

	const questionContent = (
		<React.Fragment>
			<div className="question-content">
				<div>
					Automation helps reduce the fees you pay by trusting peers temporarily
					until your node balance is sufficient to open a balanced Lightning
					channel.
				</div>
				<a
					href="https://docs.shock.network/"
					target="_blank"
					className="marked"
					rel="noreferrer"
				>
					Learn More
				</a>
				<div
					className="icon-button close-button"
					onClick={() => setIsShowQuestion(false)}
				>
					{Icons.closeQuestion()}
				</div>
			</div>
		</React.Fragment>
	);

	const onDone = () => {
		router.push("/metrics", "back")
	}
	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<MetricsSubPageToolbar title="Manage" />
			</IonHeader>
			<IonContent className="ion-padding">
				{error && (
					<div style={{ color: "red", padding: 12 }}>
						<div style={{ fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
						<div style={{ opacity: 0.85 }}>{error}</div>
					</div>
				)}

				<div className="Manage">
					<div className="Manage_settings">
						<div className="section-title">
							<div>
								<span>🌐</span> Nostr Settings
							</div>
							<div className="line" />
						</div>
						<div className="input-group">
							<div className="bg-over"></div>
							<span>Node name, seen by wallet users (Nostr):</span>
							<input type="text" placeholder="Nodey McNodeFace" value={nodeName} onChange={(e) => { setNodeName(e.target.value) }} />
						</div>
						<div className="checkbox">
							<div className="bg-over"></div>
							<input type="checkbox" id="nodeDiscoverable" checked={isNodeDiscover} onChange={() => { setIsNodeDiscover(!isNodeDiscover) }} />
							<div className="checkbox-shape"></div>
							<label htmlFor="nodeDiscoverable">
								Make node discoverable for public use. If unchecked, new users will
								require an invitation.
							</label>
						</div>
						<div className="hidden-part">
							<div className="bg-over"></div>
							<div className="input-group">
								<span>If you want to use a specific Nostr relay,</span>
								<input
									type="text"
									placeholder="wss://relay.lightning.pub"
									value={specificNostr}
									onChange={(e) => { setSpecificNostr(e.target.value) }}
								/>
							</div>
							<div className="checkbox">
								<input type="checkbox" id="managedRelay" checked={isDefaultManage} onChange={() => { setIsDefaultManage(!isDefaultManage) }} />
								<div className="checkbox-shape"></div>
								<label htmlFor="managedRelay">
									Use the default managed relay service and auto-pay 1000 sats per
									month to support developers
								</label>
							</div>
						</div>
					</div>
					<div className="Manage_automation">
						<div className="section-title">
							<div>
								<span>
									<img
										src="/icons/lightning_yellow.png"
										width={15}
										height={15}
										alt=""
									/>
								</span>{" "}
								Automation
							</div>
							<div className="line" />
						</div>
						<div className="checkbox">
							<div className="bg-over"></div>
							<input type="checkbox" id="automationService" checked={isAutoService} onChange={() => { setIsAutoService(!isAutoService) }} />
							<div className="checkbox-shape"></div>
							<label htmlFor="automationService" style={{ fontSize: 14 }}>
								Use Automation Service
							</label>
							<button
								className="Sources_question_mark"
								onClick={() => setIsShowQuestion(true)}
							>
								{Icons.questionMark()}
							</button>
						</div>
						{isShowQuestion && questionContent}
					</div>
					<div className="Manage_recoveryKeys">
						<div className="section-title">
							<div>
								<span>😰</span> Recovery Keys
							</div>
							<div className="line" />
						</div>
						<div className="checkbox">
							<div className="bg-over"></div>
							<input type="checkbox" id="channelBackup" checked={isRecoveryKey} onChange={() => { setIsRecoveryKey(!isRecoveryKey) }} />
							<div className="checkbox-shape"></div>
							<label htmlFor="channelBackup" style={{ fontSize: 14 }}>
								Channel Backup to Nostr Relay
							</label>
							<button
								className="Sources_question_mark"
								onClick={() =>
									window.open("https://docs.shock.network/pub/intro", "_blank")
								}
							>
								{Icons.questionMark()}
							</button>
						</div>
					</div>
					<div className="Manage_reveal-seed">
						<div
							onClick={() => setIsRevealed(true)}
							className={`text-box ${!isRevealed && "blur"}`}
						>
							{isRevealed
								? seed.map((item: string, index: number) => (
									<div key={index} className="item">{`${index + 1
										}. ${item}`}</div>
								))
								: seeditems.map((item: string, index: number) => (
									<div key={index} className="item">{`${index + 1
										}. ${item}`}</div>
								))}
						</div>
						<div onClick={() => fetchSeed()} className="reveal-button">
							{isRevealed ? "Click to hide seed" : "Click to reveal seed"}
						</div>
					</div>
					<button onClick={onDone} className="Manage_save">
						Done
					</button>
					<div className="Manage_footer">
						Connected to <br />
						{nip19.nprofileEncode({ pubkey: adminSource.lpk, relays: adminSource.relays })}
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};


export default Manage;
