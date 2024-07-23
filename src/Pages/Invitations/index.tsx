import { Clipboard } from "@capacitor/clipboard";
import { toast } from "react-toastify";
import * as Icons from "../../Assets/SvgIconLibrary";

interface OneTimeLink {
  link: string;
  subNode: string;
  statu: "usable" | "expired";
}

export const Invitations = () => {
  const copyToClip = async (text: string) => {
    await Clipboard.write({
      string: text,
    });
    toast.success("Copied to clibpoard!");
  };

  const reusableLink: {
    link: string;
    subNode: string;
  } = {
    link: "shockwallet.app/invite/nprofile123shockwallet.app/invite/nprofile123shockwallet.app/invite/nprofile123...,",
    subNode: "Uncle Jim's Node",
  };

  const oneTimeLinks: OneTimeLink[] = [
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
  ];

  return (
    <div className="Invitations">
      <div className="Invitations_title">Invitations</div>
      <div className="Invitations_reusableLink">
        <div className="title">Reusable Link</div>
        <div className="content">
          <div className="link">{reusableLink.link}</div>
          <div className="subNode">{reusableLink.subNode}</div>
        </div>
        <button
          onClick={() => copyToClip(reusableLink.link)}
          className="clipboard-copy"
        >
          {Icons.copyWhite()}COPY
        </button>
      </div>
      <div className="Invitations_One-Time-Links">
        <div className="title">One-Time Links</div>
        <div className="link-group">
          {oneTimeLinks.map((link: OneTimeLink, index: number) => {
            return (
              <div key={index} className="content">
                <div className="text">
                  <div className="link">{link.link}</div>
                  <div className="subNode">{link.subNode}</div>
                </div>
                <button
                  onClick={() => copyToClip(link.link)}
                  className="iconButton"
                  disabled={link.statu === "expired"}
                >
                  {link.statu === "expired" ? (
                    Icons.check()
                  ) : (
                    <span>{Icons.copyWhite()}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
