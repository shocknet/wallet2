import { useState } from "react";
import { getNostrClient } from "@/Api/nostr";
import PromptForActionModal, { ActionType } from "../../Components/Modals/PromptForActionModal";
import type { SpendFrom } from "../../globalTypes";
import { toast } from "react-toastify";

export const OpenChannel = ({ adminSource }: { adminSource: SpendFrom }) => {
  const [openModal, setOpenModal] = useState<'addPeer' | 'openChannel' | ''>('');
  const [peerUri, setPeerUri] = useState<string>('');
  const [peerPubkey, setPeerPubkey] = useState<string>('');
  const [channelAmount, setChannelAmount] = useState<number>(0);
  const [satsPerVByte, setSatsPerVByte] = useState<number>(0);
  const addPeer = async () => {
    if (!peerUri) {
      toast.error('Please enter a valid peer uri')
      return
    }
    const [pubkey, addr] = peerUri.split('@')
    if (!pubkey || !addr) {
      toast.error('Please enter a valid peer uri')
      return
    }
    const [host, port] = addr.split(':')
    if (!host || !port || isNaN(+port)) {
      toast.error('Please enter a valid peer uri')
      return
    }
    const client = await getNostrClient(adminSource.pasteField, adminSource.keys)
    const res = await client.AddPeer({ pubkey, host, port: +port })
    if (res.status === 'ERROR') {
      toast.error(res.reason)
      return
    }
    toast.success('Peer added successfully')
  }

  const openChannel = async () => {
    if (!peerPubkey) {
      toast.error('Please enter a valid peer pubkey')
      return
    }
    if (channelAmount <= 0) {
      toast.error('Please enter a valid channel amount')
      return
    }
    if (satsPerVByte <= 0) {
      toast.error('Please enter a valid sats per vbyte')
      return
    }
    const client = await getNostrClient(adminSource.pasteField, adminSource.keys)
    const res = await client.OpenChannel({ node_pubkey: peerPubkey, local_funding_amount: channelAmount, sat_per_v_byte: satsPerVByte })
    if (res.status === 'ERROR') {
      toast.error(res.reason)
      return
    }
    toast.success('Channel opened successfully')
  }

  return (
    <div>
      <div>
        <button onClick={() => setOpenModal('addPeer')}>ADD PEER</button>
        <button onClick={() => setOpenModal('openChannel')}>ADD CHANNEL</button>

      </div>
      {openModal === 'addPeer' && <PromptForActionModal title="Add Peer"
        actionText="Add Peer"
        actionType={ActionType.NORMAL}
        closeModal={() => { setOpenModal('') }}
        action={() => { addPeer(); setOpenModal('') }}
        jsx={<>
          <label>Peer Uri:</label>
          <input type="text" style={{ backgroundColor: 'black' }} placeholder="pubkey@address:port" value={peerUri} onChange={e => { setPeerUri(e.target.value) }}></input></>}
      />}
      {openModal === 'openChannel' && <PromptForActionModal title="Open Channel"
        actionText="Open Channel"
        actionType={ActionType.NORMAL}
        closeModal={() => { setOpenModal('') }}
        action={() => { openChannel(); setOpenModal('') }}
        jsx={<>
          <div>
            <label>Peer Pubkey:</label>
            <input type="text" style={{ backgroundColor: 'black' }} placeholder="pubkey" value={peerPubkey} onChange={e => { setPeerPubkey(e.target.value) }}></input>
          </div>
          <div>
            <label>Channel Amount:</label>
            <input type="text" style={{ backgroundColor: 'black' }} placeholder="amount" value={channelAmount} onChange={e => { setChannelAmount(+e.target.value) }}></input>
          </div>
          <div>
            <label>Sats Per VByte:</label>
            <input type="text" style={{ backgroundColor: 'black' }} placeholder="satsPerVByte" value={satsPerVByte} onChange={e => { setSatsPerVByte(+e.target.value) }}></input>
          </div>
        </>}
      />}
    </div>
  );
};
