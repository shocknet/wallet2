import React, { useEffect, useMemo, useState } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector } from "../../State/store";
import { getNostrClient } from "../../Api";
import { NostrKeyPair } from "../../Api/nostrHandler";
import PromptForActionModal, { ActionType } from "../../Components/Modals/PromptForActionModal";
import { SpendFrom } from "../../globalTypes";
import * as Types from '../../Api/pub/autogenerated/ts/types'
import { toast } from "react-toastify";
import Checkbox from "../../Components/Checkbox";
export type SelectedChannel = { id: number, name: string }
export const EditChannel = ({ adminSource, selectedChannel, deselect }: { adminSource: SpendFrom, selectedChannel: Types.OpenChannel | null, deselect: () => void }) => {
  const [openModal, setOpenModal] = useState<'showPolicy' | 'updatePolocy' | 'closeChannel'>('showPolicy');
  const [baseFeeMsat, setBaseFeeMsat] = useState<number>();
  const [feeRatePpm, setFeeRatePpm] = useState<number>(0);
  const [maxHtlcMsat, setMaxHtlcMsat] = useState<number>(0);
  const [minHtlcMsat, setMinHtlcMsat] = useState<number>(0);
  const [timeLockDelta, setTimeLockDelta] = useState<number>(0);
  const [satsPerVByte, setSatsPerVByte] = useState<number>(0);
  const [force, setForce] = useState<boolean>(false);
  useEffect(() => {
    if (selectedChannel && selectedChannel.policy) {
      setBaseFeeMsat(selectedChannel.policy.base_fee_msat)
      setFeeRatePpm(selectedChannel.policy.fee_rate_ppm)
      setMaxHtlcMsat(selectedChannel.policy.max_htlc_msat)
      setMinHtlcMsat(selectedChannel.policy.min_htlc_msat)
      setTimeLockDelta(selectedChannel.policy.timelock_delta)
    }
  }, [selectedChannel])
  const updatePolicy = async () => {
    if (!selectedChannel) {
      toast.error('No channel selected')
      return
    }
    if (!baseFeeMsat || !feeRatePpm || !maxHtlcMsat || !minHtlcMsat || !timeLockDelta) {
      toast.error('Please enter all fields')
      return
    }
    const client = await getNostrClient(adminSource.pasteField, adminSource.keys)
    const res = await client.UpdateChannelPolicy({
      policy: { base_fee_msat: baseFeeMsat, fee_rate_ppm: feeRatePpm, max_htlc_msat: maxHtlcMsat, min_htlc_msat: minHtlcMsat, timelock_delta: timeLockDelta },
      update: { type: Types.UpdateChannelPolicyRequest_update_type.CHANNEL_POINT, channel_point: selectedChannel.channel_point }
    })
    if (res.status === 'ERROR') {
      toast.error(res.reason)
      return
    }
    toast.success('Policy updated successfully')
  }
  const closeChannel = async () => {
    if (!selectedChannel) {
      toast.error('No channel selected')
      return
    }
    if (satsPerVByte <= 0) {
      toast.error('Please enter a valid sats per vbyte')
      return
    }
    const client = await getNostrClient(adminSource.pasteField, adminSource.keys)
    const [txid, output] = selectedChannel.channel_point.split(':')
    const res = await client.CloseChannel({
      funding_txid: txid,
      output_index: +output,
      force: force,
      sat_per_v_byte: satsPerVByte
    })
    if (res.status === 'ERROR') {
      toast.error(res.reason)
      return
    }
    toast.success('Channel closed successfully')
  }
  if (!selectedChannel) {
    return null
  }

  if (openModal === 'showPolicy') {
    return <PromptForActionModal title="Channel Policy"
      actionText="OK"
      actionType={ActionType.NORMAL}
      closeModal={() => { deselect() }}
      action={() => { deselect() }}
      jsx={<>
        {selectedChannel.policy && <div>
          <p>Base fee Msat: {selectedChannel.policy.base_fee_msat}</p>
          <p>Fee rate Ppm: {selectedChannel.policy.fee_rate_ppm}</p>
          <p>Max HTLC Msat: {selectedChannel.policy.max_htlc_msat}</p>
          <p>Min HTLC Msat: {selectedChannel.policy.min_htlc_msat}</p>
          <p>Time Lock Delta: {selectedChannel.policy.timelock_delta}</p>
          <button onClick={e => { setOpenModal('updatePolocy') }}>EDIT POLICY</button>
          <button onClick={e => { setOpenModal('closeChannel') }}>CLOSE CHANNEL</button>
        </div>}
        {!selectedChannel.policy && <div>No Policy found for channel</div>}
      </>}
    />
  }
  if (openModal === 'updatePolocy') {
    return <PromptForActionModal title="Update Policy"
      actionText="Update Policy"
      actionType={ActionType.NORMAL}
      closeModal={() => { setOpenModal('showPolicy') }}
      action={() => { updatePolicy(); setOpenModal('showPolicy') }}
      jsx={<>
        {selectedChannel.policy && <div>
          <div>
            <label>Base Fee Msat:</label>
            <input type="text" style={{ backgroundColor: 'black' }} placeholder="baseFeeMsat" value={baseFeeMsat} onChange={e => { setBaseFeeMsat(+e.target.value) }}></input>
          </div>
          <div>
            <label>Fee Rate Ppm:</label>
            <input type="text" style={{ backgroundColor: 'black' }} placeholder="feeRatePpm" value={feeRatePpm} onChange={e => { setFeeRatePpm(+e.target.value) }}></input>
          </div>
          <div>
            <label>Max HTLC Msat:</label>
            <input type="text" style={{ backgroundColor: 'black' }} placeholder="maxHtlcMsat" value={maxHtlcMsat} onChange={e => { setMaxHtlcMsat(+e.target.value) }}></input>
          </div>
          <div>
            <label>Min HTLC Msat:</label>
            <input type="text" style={{ backgroundColor: 'black' }} placeholder="minHtlcMsat" value={minHtlcMsat} onChange={e => { setMinHtlcMsat(+e.target.value) }}></input>
          </div>
          <div>
            <label>Time Lock Delta:</label>
            <input type="text" style={{ backgroundColor: 'black' }} placeholder="timeLockDelta" value={timeLockDelta} onChange={e => { setTimeLockDelta(+e.target.value) }}></input>
          </div>
        </div>}
      </>}
    />
  }
  if (openModal === 'closeChannel') {
    return <PromptForActionModal title="Close Channel"
      actionText={force ? "Force Close Channel" : "Close Channel"}
      actionType={ActionType.NORMAL}
      closeModal={() => { setOpenModal('showPolicy') }}
      action={() => { closeChannel(); setOpenModal('showPolicy') }}
      jsx={<>
        <p>Are you sure you want to close the channel?</p>
        <div>
          <label >Sats per VByte:</label>
          <input type="text" style={{ backgroundColor: 'black' }} placeholder="satPerVByte" value={satsPerVByte} onChange={e => { setSatsPerVByte(+e.target.value) }}></input>
        </div>
        <div>
          <label >Force:</label>
          <Checkbox state={force} setState={(e) => { setForce(e.target.checked) }} id="forceClose" />
        </div>
      </>}
    />
  }

  return null
};