import React, { useEffect, useMemo, useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector } from "../../State/store";
import { getNostrClient } from "../../Api";
import { NostrKeyPair } from "../../Api/nostrHandler";
import PromptForActionModal, { ActionType } from "../../Components/Modals/PromptForActionModal";
interface OfflineChannel {
  id: number;
  avatar: string;
  name: string;
  subNode: string;
  timeStamp?: number;
  satAmount: number;
}

interface ActiveChannel {
  id: number;
  avatar: string;
  name: string;
  localSatAmount: number;
  RemoteSatAmount: number;
}

export const Channels = () => {
  const [maxBalance, setMaxBalance] = useState<number>(0);
  const [activeChannels, setActiveChannels] = useState<ActiveChannel[]>([]);
  const [offlineChannels, setOfflineChannels] = useState<OfflineChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<{ id: number, name: string } | null>(null);
  const [openModal, setOpenModal] = useState<'addPeer' | 'openChannel' | 'closeChannel' | ''>('');
  const [peerUri, setPeerUri] = useState<string>('');

  const spendSources = useSelector(state => state.spendSource)
  const selectedSource = useMemo(() => {
    return spendSources.order.find(p => !!spendSources.sources[p].adminToken)
  }, [spendSources])
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
        active.push({ avatar: "", id: i, name: c.label, localSatAmount: c.local_balance, RemoteSatAmount: c.remote_balance })
      } else {
        offline.push({ avatar: "", id: i, name: c.label, satAmount: c.capacity, timeStamp: c.lifetime, subNode: "Initiate force-close" })
      }
    })
    setMaxBalance(max)
    setActiveChannels(active)
    setOfflineChannels(offline)

  }

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
  const totalSatAmount: number = offlineChannels.reduce(
    (acc, obj) => acc + obj.satAmount,
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
                {formatCryptoAmount(totalSatAmount)} Encumbered
              </div>
            </div>
            <div className="line" />
          </div>
          <div className="channel-group">
            {offlineChannels.map((channel: OfflineChannel, index: number) => (
              <div className="channel" key={index} onClick={() => { setSelectedChannel({ id: channel.id, name: channel.name }); setOpenModal('closeChannel') }}>
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
                    {formatCryptoAmount(channel.satAmount)}
                  </div>
                  <div className="time">
                    <span>
                      {`${channel.timeStamp
                        ? channel.timeStamp > 1000
                          ? "💀 Last seen 10 days ago"
                          : "🔍 Last seen 2 hours ago"
                        : "🔗 Pending Force Close"
                        }`}
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
              <div className="channel" key={index} onClick={() => { setSelectedChannel({ id: channel.id, name: channel.name }); setOpenModal('closeChannel') }}>
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
      <div>
        <button onClick={() => setOpenModal('addPeer')}>ADD PEER</button>
        <button onClick={() => setOpenModal('openChannel')}>ADD CHANNEL</button>

      </div>
      <div className="Channels_footer">
        Connected to <br />
        {spendSources.sources[selectedSource || ""].pasteField}
      </div>
      {openModal === 'addPeer' && <PromptForActionModal title="Add Peer"
        actionText="Add Peer"
        actionType={ActionType.NORMAL}
        closeModal={() => { setOpenModal('') }}
        action={() => { setOpenModal('') }}
        jsx={<><input type="text" placeholder="pubkey@address:port"></input></>}
      />}
      {openModal === 'openChannel' && <PromptForActionModal title="Open Channel"
        actionText="Open Channel"
        actionType={ActionType.NORMAL}
        closeModal={() => { setOpenModal('') }}
        action={() => { setOpenModal('') }}
        jsx={<><input type="text" placeholder="pubkey"></input>
          <input type="text" placeholder="amount"></input>
          <input type="text" placeholder="satsPerVByte"></input></>}
      />}
      {openModal === 'closeChannel' && selectedChannel && <PromptForActionModal title="Close Channel"
        actionText="Close Channel"
        actionType={ActionType.NORMAL}
        closeModal={() => { setOpenModal('') }}
        action={() => { setOpenModal('') }}
        jsx={<><p>closing channel: {selectedChannel.id}</p><input type="text" placeholder="satsPerVByte"></input></>}
      />}
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
