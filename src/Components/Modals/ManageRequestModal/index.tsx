import { useCallback, useEffect, useMemo, useState } from "react";
import { getNostrClient } from "@/Api/nostr";
import { Modal } from "../Modal";
import { NOSTR_RELAYS } from "@/constants";
import { nip19 } from "nostr-tools";
import styles from "./styles/index.module.scss";
import { BackCircleIcon, BanIcon, CrossIcon, ShieldIcon } from '@/Assets/SvgIconLibrary';
import classNames from "classnames";
import { refetchManageRequests, removeManageRequest } from "@/State/Slices/modalsSlice";
import { toast } from "react-toastify";
import Toast from "../../Toast";
import { getDebitAppNameAndAvatarUrl } from "../DebitRequestModal/helpers";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { selectHealthyNprofileViews } from "@/State/scoped/backups/sources/selectors";

const ManageRequestModal = () => {
	const healthyNprofileViews = useAppSelector(selectHealthyNprofileViews);
	const dispatch = useAppDispatch();

	const manageRequests = useAppSelector(state => state.modalsSlice.manageRequests || null)

	// Display requestor name and avatar
	const [requestorDomain, setRequestorDomain] = useState("");
	const [requestorAvatarUrl, setRequestorAvatarUrl] = useState("");

	const [isBanPrompt, setIsBanPrompt] = useState(false);




	const currentRequest = useMemo(() => {
		setIsBanPrompt(false);
		if (!manageRequests) return null;
		if (manageRequests.length > 0) {
			const req = manageRequests[0]; // take first request in the array; new requests are pushed to the end of the array. FIFO
			const view = healthyNprofileViews.find(v => v.sourceId === req.sourceId);
			if (!view) return null; // If the spend source was deleted ignore the request
			return { request: req.request, source: view }
		}
	}, [manageRequests, healthyNprofileViews])



	// when a request is received try to fetch a nip05 for the requestor pubkey and get the domain.
	// the domain will be used to supplement the data dispayed in the debit request modal, such as domain name and avatar
	useEffect(() => {
		const getAppNameAndAvatar = async () => {
			if (!currentRequest) return;

			// TODO: Have the request include a relay to fetch metadata from.
			// For now the code just uses the relay of the source receiving the nip68 request.
			// Note: SMART is supposed to handle this later
			const { requestorDomain: rd, avatarUrl } = await getDebitAppNameAndAvatarUrl(currentRequest.request.npub, currentRequest.source.relays || NOSTR_RELAYS)
			setRequestorDomain(rd)
			setRequestorAvatarUrl(avatarUrl)
		};

		getAppNameAndAvatar();

	}, [currentRequest])


	const authroizeRequest = useCallback(async () => {
		if (!currentRequest) return;
		const { source } = currentRequest;
		const res = await (await getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys)).AuthorizeManage({
			authorize_npub: currentRequest.request.npub,
			request_id: currentRequest.request.request_id,
			ban: false,
		});
		if (res.status !== "OK") {
			toast.error(<Toast title="Add linked app error" message={res.reason} />)
			return;
		}
		dispatch(removeManageRequest({ requestorNpub: currentRequest.request.npub, sourceId: source.sourceId }))
		dispatch(refetchManageRequests())
		toast.success("Linked app added successfuly")
	}, [dispatch, currentRequest]);


	const removeCurrentRequest = useCallback(() => {
		if (!currentRequest) return;
		dispatch(removeManageRequest({ requestorNpub: currentRequest.request.npub, sourceId: currentRequest.source.sourceId }))
		dispatch(refetchManageRequests())
	}, [dispatch, currentRequest])





	const substrinedNpub = useMemo(() => {
		if (!currentRequest) return "";
		const npub = nip19.npubEncode(currentRequest.request.npub);
		return `${npub.substring(0, 20)}...${npub.substring(npub.length - 20, npub.length)}`
	}, [currentRequest])


	const banRequest = useCallback(async () => {
		if (currentRequest) {
			const { source, request } = currentRequest;
			await (await getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys)).AuthorizeManage({
				authorize_npub: request.npub,
				request_id: request.request_id,
				ban: true
			});
			dispatch(removeManageRequest({ requestorNpub: request.npub, sourceId: source.sourceId }));
		}
	}, [currentRequest, dispatch])

	const handleDenyRequest = useCallback(() => {
		if (!currentRequest) return;
		if (isBanPrompt) {
			banRequest();
		} else {
			removeCurrentRequest();
		}
	}, [currentRequest, dispatch])

	const modalContent = currentRequest ? (
		<div className={styles["container"]}>
			<div className={styles["modal-header"]}>Incoming Request</div>
			<div className={styles["modal-body"]}>
				<div className={styles["requestor-container"]}>
					{
						requestorAvatarUrl
						&&
						<img src={requestorAvatarUrl} alt="Requestor avatar" height={55} width={55} />
					}
					{
						requestorDomain
						&&
						<span className={styles["app-name"]}>{requestorDomain}</span>
					}
					<span className={styles["npub"]}>{substrinedNpub}</span>
				</div>

				<>
					{
						isBanPrompt
							?
							<PromptBanApp banAppCallback={banRequest} dismissCallback={() => removeCurrentRequest()} />
							:
							<>
								<div className={styles["debit-info"]}>
									<span className={styles["orange-text"]}>Wants to create offers for you</span>
								</div>
								<div className={styles["buttons-container"]}>
									<button onClick={() => handleDenyRequest()}>
										<>
											<CrossIcon />
											Deny
										</>
									</button>
									<button onClick={() => authroizeRequest()}>
										<>
											<ShieldIcon />
											Allow
										</>
									</button>
								</div>
							</>
					}
				</>
			</div>

		</div>
	) : <></>;



	return <Modal isShown={!!currentRequest} hide={() => handleDenyRequest()} modalContent={modalContent} headerText={''} />
}

interface PromptBanAppProps {
	banAppCallback: () => Promise<void>;
	dismissCallback: () => void;
}

const PromptBanApp = ({ banAppCallback, dismissCallback }: PromptBanAppProps) => {
	return (
		<>
			<div className={classNames(styles["debit-info"], styles["ban-prompt-body"])}>
				<span>Ban this key?</span>
			</div>
			<div className={styles["buttons-container"]}>
				<button onClick={banAppCallback}>
					<>
						<BanIcon />
						BAN
					</>
				</button>
				<button onClick={dismissCallback}>
					<>
						<BackCircleIcon />
						DISMISS
					</>
				</button>
			</div>
		</>
	)
}

export default ManageRequestModal;
