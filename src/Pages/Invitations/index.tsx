import { Clipboard } from "@capacitor/clipboard";
import { toast } from "react-toastify";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "../../State/store";
import Toast from "../../Components/Toast";
import { getNostrClient } from "../../Api";
import { addInvitation, setInvitationToUsed } from "../../State/Slices/oneTimeInviteLinkSlice";
import { WALLET_URL } from "../../constants";
import { toggleLoading } from "../../State/Slices/loadingOverlay";




export const Invitations = () => {
  const dispatch = useDispatch();
  const spendSources = useSelector(state => state.spendSource)
  const invitations = useSelector(state => state.oneTimeInviteLinkSlice);

  const selectedSource = useMemo(() => {
    const sourceId = spendSources.order.find(p => !!spendSources.sources[p].adminToken)
    if (!sourceId) {
      return null
    }
    return spendSources.sources[sourceId];

  }, [spendSources])

  useEffect(() => {
    setUpLinks();
  }, [])


  const setUpLinks = async () => {
    if (!selectedSource) {
      toast.error(
        <Toast
          title="Not an amdin"
          message="No admin source found"
        />
      )
      return;
    }

    const client = await getNostrClient(selectedSource.pasteField, selectedSource.keys!) // TODO: write migration to remove type override;
    for (const inv of invitations.invitations) {
      const res = await client.GetInviteLinkState({ invite_token: inv.inviteToken })
      if (res.status === "OK") {
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

    const client = await getNostrClient(selectedSource.pasteField, selectedSource.keys);
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


  

  const reusableLink = selectedSource ? {
    link: `${WALLET_URL}/#/sources?addSource=${selectedSource.pasteField}`,
    subNode: selectedSource.label,
  } : null;

/*   const oneTimeLinks: OneTimeLink[] = [
    {
      link: "shockwallet.app/invite/nprofile123shockwallet.app/invite/nprofile123shockwallet.app/invite/nprofile123...",
      subNode: "01/01/2024 16:20 | steakhouse tip | 5000 sats",
      statu: "usable",
    },
    {
      link: "shockwallet.app/invite/nprofile123shockwallet.app/invite/nprofile123shockwallet.app/invite/nprofile123...",
      subNode: "01/01/2024 16:20 | steakhouse tip | 5000 sats",
      statu: "expired",
    },
    {
      link: "shockwallet.app/invite/nprofile123shockwallet.app/invite/nprofile123shockwallet.app/invite/nprofile123...",
      subNode: "01/01/2024 16:20 | steakhouse tip | 5000 sats",
      statu: "expired",
    },
  ]; */


  const oneTimeLinksRender = useMemo(() => {
    return (
      <div className="link-group">
        {
          invitations.invitations.map(inv => {
            const link = `${WALLET_URL}/#/sources?addSource=${selectedSource?.pasteField}&inviteToken=${inv.inviteToken}`
            return (
            <div key={inv.inviteToken} className="content">
                <div className="text">
                  <div className="link">{link}</div>
                  <div className="subNode">{selectedSource?.label}</div>
                </div>
                <button
                  onClick={() => copyToClip(link)}
                  className="iconButton"
                  disabled={inv.used}
                >
                  {inv.used ? (
                    Icons.check()
                  ) : (
                    <span>{Icons.copyWhite()}</span>
                  )}
                </button>
              </div>
            )
         })
        }
      </div>
    )
  }, [invitations.invitations])

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
              onClick={() => copyToClip(reusableLink.link)}
              className="clipboard-copy"
            >
              {Icons.copyWhite()}COPY
            </button>
          </>
        }
      </div>
      <div className="Invitations_One-Time-Links">
        <div className="title">One-Time Links</div>
        {oneTimeLinksRender}
      </div>
      <div className="Invitations_reusableLink">
        <button
          onClick={() => newInviteLink()}
          className="clipboard-copy"
        >
          {Icons.copyWhite()}Create New
        </button>
      </div>
    </div>
  );
};
