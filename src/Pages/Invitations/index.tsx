import { Clipboard } from "@capacitor/clipboard";
import { toast } from "react-toastify";
import { useEffect, useMemo } from "react";
import { useDispatch } from "../../State/store/store";
import Toast from "../../Components/Toast";
import { getNostrClient } from "@/Api/nostr";
import { addInvitation, setInvitationToUsed } from "../../State/Slices/oneTimeInviteLinkSlice";
import { WALLET_URL } from "../../constants";
import { toggleLoading } from "../../State/Slices/loadingOverlay";
import { check, copyWhite } from "@/Assets/SvgIconLibrary";
import { useAppSelector } from "@/State/store/hooks";
import { selectHealthyNprofileViews } from "@/State/scoped/backups/sources/selectors";
import { nip19 } from "nostr-tools";
import QrCode from "@/Components/QrCode";


const Invitations = () => {
	const dispatch = useDispatch();
	const healthyNprofileSourceViews = useAppSelector(selectHealthyNprofileViews);
	const invitations = useAppSelector(state => state.oneTimeInviteLinkSlice);

	const selectedSource = useMemo(() => {
		const source = healthyNprofileSourceViews.find(p => !!p.adminToken)
		if (!source) {
			return null
		}
		return source;

	}, [healthyNprofileSourceViews])

	useEffect(() => {
		setUpLinks();
	}, [])


	const setUpLinks = async () => {
		if (!selectedSource) {
			toast.error(
				<Toast
					title="Not an admin"
					message="No admin source found"
				/>
			)
			return;
		}

		const client = await getNostrClient({ pubkey: selectedSource.lpk, relays: selectedSource.relays }, selectedSource.keys)
		for (const inv of invitations.invitations) {
			const res = await client.GetInviteLinkState({ invite_token: inv.inviteToken })
			if (res.status === "OK" && res.used) {
				dispatch(setInvitationToUsed(inv.inviteToken));
			}
		}
	}

	const copyToClip = async (text: string) => {
		await Clipboard.write({
			string: text,
		});
		toast.success("Copied to clibpoard!");
	};



	const newInviteLink = async () => {
		dispatch(toggleLoading({ loadingMessage: "Loading..." }))
		if (!selectedSource) {
			dispatch(toggleLoading({ loadingMessage: "" }))
			return
		}

		const client = await getNostrClient({ pubkey: selectedSource.lpk, relays: selectedSource.relays }, selectedSource.keys);
		const res = await client.CreateOneTimeInviteLink({});
		if (res.status !== "OK") {
			dispatch(toggleLoading({ loadingMessage: "" }))
			return;
		}
		dispatch(addInvitation({
			inviteToken: res.invitation_link,
			creationTimestamp: Date.now(),
			amount: null,
			used: false
		}))
		dispatch(toggleLoading({ loadingMessage: "" }))
	}


	const nprofile = useMemo(() => selectedSource ? nip19.nprofileEncode({ pubkey: selectedSource.lpk, relays: selectedSource.relays }) : "", [selectedSource])

	const reusableLink = selectedSource ? {
		link: `${WALLET_URL}/sources?addSource=${nprofile}`,
		subNode: selectedSource.label,
	} : null;

	const oneTimeLinksRender = useMemo(() => {
		return (
			<div className="link-group">
				{invitations.invitations &&
					invitations.invitations.map(inv => {
						const link = `${WALLET_URL}/sources?addSource=${nprofile}&inviteToken=${inv.inviteToken}`
						return (
							<div key={inv.inviteToken} className="content">
								<div className="row">
									<div className="text">
										<div className="link">{link}</div>
										<div className="subNode">{selectedSource?.label}</div>
									</div>
									<button
										type="button"
										onClick={() => copyToClip(link)}
										className="iconButton"
										disabled={inv.used}
									>
										{inv.used ? (
											check()
										) : (
											<span>{copyWhite()}</span>
										)}
									</button>
								</div>
								<div className="qr-wrap">
									<QrCode value={link} uppercase={false} />
								</div>
							</div>
						)
					})
				}
			</div>
		)
	}, [invitations.invitations, nprofile, selectedSource])

	return (
		<div className="Invitations">
			<div className="Invitations_title">Invitations</div>
			<div className="Invitations_reusableLink">
				<div className="title">Reusable Link</div>
				{
					reusableLink
					&&
					<>
						<div className="content">
							<div className="link">
								{reusableLink.link}
							</div>
							<div className="subNode">
								{reusableLink.subNode}
							</div>
						</div>
						<button
							type="button"
							onClick={() => copyToClip(reusableLink.link)}
							className="clipboard-copy"
						>
							{copyWhite()}COPY
						</button>
						<div className="qr-wrap">
							<QrCode value={reusableLink.link} uppercase={false} />
						</div>
					</>
				}
			</div>
			<div className="Invitations_One-Time-Links">
				<div className="title">One-Time Links</div>
				{reusableLink && (
					<div className="create-row">
						<button
							type="button"
							onClick={() => newInviteLink()}
							className="clipboard-copy"
						>
							Create one-time link
						</button>
					</div>
				)}
				{oneTimeLinksRender}
				<div className="gift-note">Gift links coming soon.</div>
			</div>
		</div>
	);
};

export default Invitations;
