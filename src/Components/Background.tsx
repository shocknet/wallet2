import React, { useCallback, useEffect, useRef, useState } from "react";
import { selectNostrSpends, useDispatch, useSelector } from "../State/store";
import { addAsset } from '../State/Slices/generatedAssets';
import { addNotification } from "../State/Slices/notificationSlice";
import { Destination, InputClassification, decodeLnurl, parseBitcoinInput } from "../constants";
import { useIonRouter } from "@ionic/react";
import { Modal } from "./Modals/Modal";
import { UseModal } from "../Hooks/UseModal";
import { truncateString } from '../Hooks/truncateString';
import * as icons from '../Assets/SvgIconLibrary';
import { Clipboard } from '@capacitor/clipboard';
import { editSpendSources } from "../State/Slices/spendSourcesSlice";
import axios, { isAxiosError } from "axios";
import { SubscriptionsBackground } from "./BackgroundJobs/subscriptions";
import { HealthCheck } from "./BackgroundJobs/HealthCheck";
import { LnAddressCheck } from "./BackgroundJobs/LnAddressCheck";
import { NewSourceCheck } from "./BackgroundJobs/NewSourceCheck";
import { NodeUpCheck } from "./BackgroundJobs/NodeUpCheck";
import { toast } from "react-toastify";
import Toast from "./Toast";
import { useHistory } from "react-router";
import { RemoteBackup } from "./BackgroundJobs/RemoteBackup";
import { App } from "@capacitor/app";
import { DebitRequestHandler } from "./BackgroundJobs/DebitRequestHandler";




export const Background = () => {
	const history = useHistory();
	const router = useIonRouter();

	const savedAssets = useSelector(state => state.generatedAssets.assets)
	const spendSource = useSelector((state) => state.spendSource)
	const nostrSpends = useSelector(selectNostrSpends);
	const paySource = useSelector((state) => state.paySource)
	const backupState = useSelector(state => state.backupStateSlice)
	const nodedUp = useSelector(state => state.nostrPrivateKey);
	const dispatch = useDispatch();
	const [parsedClipboard, setParsedClipbaord] = useState<Destination>({
		type: InputClassification.UNKNOWN,
		data: "",
	});
	const [refresh, setRefresh] = useState<number | null>(null);
	const { isShown, toggle } = UseModal();
	const isShownRef = useRef(false);

	useEffect(() => {
		isShownRef.current = isShown;
	}, [isShown])


	window.onbeforeunload = function () { return null; };

	useEffect(() => {
		const handleBeforeUnload = () => {
			// Call your function here
			localStorage.setItem("userStatus", "offline");
			return false;
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			return window.removeEventListener('beforeunload', handleBeforeUnload);
		}
	}, []);


	useEffect(() => {
		const otherPaySources = Object.values(paySource.sources).filter((e) => !e.pubSource);
		const otherSpendSources = Object.values(spendSource.sources).filter((e) => !e.pubSource);

		if ((nostrSpends.length !== 0 && nostrSpends[0].balance !== "0") || (otherPaySources.length > 0 || otherSpendSources.length > 0)) {
			if (localStorage.getItem("isBackUp") === "1" || backupState.subbedToBackUp) {
				return;
			}
			dispatch(addNotification({
				header: 'Reminder',
				icon: '⚠️',
				desc: 'Back up your credentials!',
				date: Date.now(),
				link: '/auth',
			}))
			localStorage.setItem("isBackUp", "1")
			toast.warn(
				<Toast
					title="Reminder"
					message="Please back up your credentials"
				/>,
				{
					onClick: () => router.push("/auth")
				}
			)
		}
	}, [paySource, spendSource, dispatch, router])




	// reset spend for lnurl
	useEffect(() => {
		const sources = Object.values(spendSource.sources);
		sources.filter(s => !s.disabled).forEach(async source => {
			if (!source.pubSource) {
				try {
					const lnurlEndpoint = decodeLnurl(source.pasteField);
					const response = await axios.get(lnurlEndpoint);
					const updatedSource = { ...source };
					const amount = Math.round(response.data.maxWithdrawable / 1000).toString()
					if (amount !== updatedSource.balance) {
						updatedSource.balance = amount;
						updatedSource.maxWithdrawable = amount;
						dispatch(editSpendSources(updatedSource));
					}
				} catch (err) {
					if (isAxiosError(err) && err.response) {
						dispatch(addNotification({
							header: 'Spend Source Error',
							icon: '⚠️',
							desc: `Spend source ${source.label} is saying: ${err.response.data.reason}`,
							date: Date.now(),
							link: `/sources?sourceId=${source.id}`,
						}))
						// update the erroring source
						dispatch({
							type: "spendSources/editSpendSources",
							payload: { ...source, disabled: err.response.data.reason },
							meta: { skipChangelog: true }
						});
					} else if (err instanceof Error) {
						toast.error(<Toast title="Source Error" message={err.message} />)
					} else {
						console.log("Unknown error occured", err);
					}
				}
			}
		})
	}, [router, dispatch])

	const checkClipboard = useCallback(async () => {
		window.onbeforeunload = null;
		let text = '';
		document.getElementById('focus_div')?.focus();
		if (document.hidden) {
			window.focus();
		}
		// don't prompt found clipboard before noding up
		if (!nodedUp) {
			return
		}
		if (isShownRef.current) {
			return;
		}
		try {
			const { type, value } = await Clipboard.read();
			if (type === "text/plain") {
				text = value;
			}
		} catch {
			return console.error("Cannot read clipboard");
		}

		if (savedAssets?.includes(text)) {
			return;
		}
		if (!text.length) {
			return
		}

		let parsed: Destination | null = null;

		try {
			parsed = await parseBitcoinInput(text);
		} catch (err: any) {
			console.log(err)
			return;
		}

		if (
			parsed.type === InputClassification.BITCOIN_ADDRESS
			||
			parsed.type === InputClassification.LN_INVOICE
			||
			parsed.type === InputClassification.LN_ADDRESS
			||
			(parsed.type === InputClassification.LNURL && parsed.lnurlType === "payRequest")
			||
			parsed.type === InputClassification.NOFFER
		) {
			setParsedClipbaord(parsed);
			toggle()
		}

	}, [savedAssets, nodedUp]);

	useEffect(() => {
		const listener = App.addListener("appStateChange", (state) => {
			if (state.isActive) {
				checkClipboard();
				setRefresh(Math.random());
			}
		})

		return () => {
			listener.remove();
		};
	}, [checkClipboard])

	useEffect(() => {
		checkClipboard();
	}, [checkClipboard])



	const clipBoardContent = <React.Fragment>
		<div className='Home_modal_header'>Clipboard Detected</div>
		<div className='Home_modal_discription'>Would you like to use it?</div>
		<div className='Home_modal_clipboard'>{truncateString(parsedClipboard.data, 30)}</div>
		<div className="Home_add_btn">
			<div className='Home_add_btn_container'>
				<button onClick={() => { toggle(); dispatch(addAsset({ asset: parsedClipboard.data })); }}>
					{icons.Close()}NO
				</button>
			</div>
			<div className='Home_add_btn_container'>
				<button onClick={() => {
					dispatch(addAsset({ asset: parsedClipboard.data }));
					toggle();
					history.push({
						pathname: "/send",
						state: parsedClipboard
					})
				}}>
					{icons.clipboard()}YES
				</button>
			</div>
		</div>
	</React.Fragment>;

	return <div id="focus_div">
		<SubscriptionsBackground />
		<HealthCheck />
		<NewSourceCheck />
		<LnAddressCheck />
		<NodeUpCheck />
		<RemoteBackup />
		<DebitRequestHandler />
		<Modal isShown={isShown} hide={() => { toggle() }} modalContent={clipBoardContent} headerText={''} />
	</div>
}