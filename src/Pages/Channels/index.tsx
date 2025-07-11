import React, { useEffect, useMemo, useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector } from "../../State/store";
import { getNostrClient } from "../../Api";
import { NostrKeyPair } from "../../Api/nostrHandler";
import PromptForActionModal, { ActionType } from "../../Components/Modals/PromptForActionModal";
import { OpenChannel } from "./OpenChannel";
import { EditChannel, SelectedChannel } from "./EditChannel";
import * as Types from '../../Api/pub/autogenerated/ts/types'
import moment from "moment";
interface OfflineChannel {
  id: number;
  avatar: string;
  name: string;
  subNode: string;
  timeStamp?: number;
  encumbered: number;
  channel: Types.OpenChannel
}

interface ActiveChannel {
  id: number;
  avatar: string;
  name: string;
  localSatAmount: number;
  RemoteSatAmount: number;
  channel: Types.OpenChannel
}



const Channels = ({ done }: { done: () => void }) => {
  const [maxBalance, setMaxBalance] = useState<number>(0);
  const [activeChannels, setActiveChannels] = useState<ActiveChannel[]>([]);
  const [offlineChannels, setOfflineChannels] = useState<OfflineChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Types.OpenChannel | null>(null);


  const spendSources = useSelector(state => state.spendSource)
  const selectedSource = useMemo(() => {
    return spendSources.order.find(p => !!spendSources.sources[p].adminToken)
  }, [spendSources])
  useEffect(() => {
    if (!selectedSource) {
      throw new Error("admin source not found")
    }
    const source = spendSources.sources[selectedSource]
    if (!source || !source.adminToken) {
      throw new Error("admin source not found")
    }
    fetchChannels(source.pasteField, source.keys)
  }, [selectedSource])
  const fetchChannels = async (nprofile: string, keys: NostrKeyPair) => {
    const client = await getNostrClient(nprofile, keys)
    const res = await client.ListChannels()
    if (res.status !== "OK") {
      throw new Error("error listing channels" + res.reason)
    }
    let max = 0
    const active: ActiveChannel[] = []
    const offline: OfflineChannel[] = []
    res.open_channels.forEach((c, i) => {
      if (c.local_balance > max) {
        max = c.local_balance
      }
      if (c.remote_balance > max) {
        max = c.remote_balance
      }
      if (c.active) {
        active.push({ avatar: "", id: i, name: c.label, localSatAmount: c.local_balance, RemoteSatAmount: c.remote_balance, channel: c })
      } else {
        offline.push({ avatar: "", id: i, name: c.label, encumbered: c.local_balance, timeStamp: c.inactive_since_unix, subNode: "Initiate force-close", channel: c })
      }
    })
    setMaxBalance(max)
    setActiveChannels(active)
    setOfflineChannels(offline)

  }


  const totalEncumbered: number = offlineChannels.reduce(
    (acc, obj) => acc + obj.encumbered,
    0
  );

  const totalRemoteSatAmount: number = activeChannels.reduce(
    (acc, obj) => acc + obj.RemoteSatAmount,
    0
  );

  const totalLocalSatAmount: number = activeChannels.reduce(
    (acc, obj) => acc + obj.localSatAmount,
    0
  );

  return (
    <div className="Channels">
      <div>
        <div className="Channels_offline-channels">
          <div className="section-title">
            <div>
              <div className="title">
                <span>🚨</span> Offline Channels
              </div>
              <div className="sub-title">
                {formatCryptoAmount(totalEncumbered)} Encumbered
              </div>
            </div>
            <div className="line" />
          </div>
          <div className="channel-group">
            {offlineChannels.map((channel: OfflineChannel, index: number) => (
              <div className="channel" key={index} onClick={() => { setSelectedChannel(channel.channel); }}>
                <div>
                  <div className="avatar">
                    <img
                      src={channel.avatar}
                      width={12}
                      height={12}
                      className=""
                      alt="avatar"
                    />
                    <div>{channel.name}</div>
                  </div>
                  {channel.subNode !== "" && (
                    <div className="sub-node">{channel.subNode}</div>
                  )}
                </div>
                <div>
                  <div className="amount">
                    {formatCryptoAmount(channel.encumbered)}
                  </div>
                  <div className="time">
                    <span>
                      last seen: {channel.timeStamp ? moment(channel.timeStamp * 1000).fromNow() : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="Channels_active-channels">
          <div className="section-title">
            <div>
              <div className="title">
                <span>
                  <img
                    src="/icons/lightning_yellow.png"
                    width={15}
                    height={15}
                    alt=""
                  />
                </span>{" "}
                Active Channels
              </div>
              <div className="sub-title">
                {`${formatCryptoAmount(
                  totalLocalSatAmount
                )} Local, ${formatCryptoAmount(totalRemoteSatAmount)}
              Remote`}
              </div>
            </div>
            <div className="line" />
          </div>
          <div className="channel-group">
            {activeChannels.map((channel: ActiveChannel, index: number) => (
              <div className="channel" key={index} onClick={() => { setSelectedChannel(channel.channel); }}>
                <div>
                  <div className="avatar">
                    <img
                      src={channel.avatar}
                      width={12}
                      height={12}
                      className=""
                      alt="avatar"
                    />
                    <div>{channel.name}</div>
                  </div>
                  <div className="amount">
                    {formatCryptoAmount(
                      channel.RemoteSatAmount + channel.localSatAmount
                    )}
                  </div>
                </div>
                <div className="progress">
                  <div>
                    <div>I</div>
                    <SatAmountBar
                      type="remote"
                      satAmount={channel.RemoteSatAmount}
                      totalSatAmount={maxBalance}
                    />
                  </div>
                  <div>
                    <div>O</div>
                    <SatAmountBar
                      type="local"
                      satAmount={channel.localSatAmount}
                      totalSatAmount={maxBalance}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <OpenChannel adminSource={spendSources.sources[selectedSource || ""]} />
      <EditChannel adminSource={spendSources.sources[selectedSource || ""]} selectedChannel={selectedChannel} deselect={() => setSelectedChannel(null)} />
      <button onClick={() => done()} className="Manage_save">
        Done
      </button>
      <div className="Channels_footer">
        Connected to <br />
        {spendSources.sources[selectedSource || ""].pasteField}
      </div>
    </div>
  );
};

interface ComponentProps {
  type: "remote" | "local";
  satAmount: number;
  totalSatAmount: number;
}

const SatAmountBar: React.FC<ComponentProps> = ({
  type,
  satAmount,
  totalSatAmount,
}) => {
  const r = satAmount / totalSatAmount;
  const percent: number = r < 0.01 ? 0.01 : r;
  return (
    <div
      style={{
        backgroundColor: `${type === "local" ? "#ff7700" : "#5912c7"}`,
        width: `calc(${percent} * 100%)`,
        textWrap: "nowrap",
      }}
    >
      {formatCryptoAmount(satAmount)}
    </div>
  );
};

const formatCryptoAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${amount / 1000000}M Sat`;
  } else if (amount >= 1000) {
    return `${amount / 1000}K Sat`;
  } else if (amount >= 100000000) {
    return `${amount.toFixed(2)} BTC`;
  } else {
    return `${amount} Sat`;
  }
};


export default Channels;