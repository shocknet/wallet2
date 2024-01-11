import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar, Line, Pie, Chart } from 'react-chartjs-2'
ChartJS.register(...registerables);
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector, useDispatch } from '../../State/store';
import { useIonRouter } from '@ionic/react';
import { getHttpClient } from '../../Api';
import { BarGraph, LineGraph, LndGraphs, PieGraph, processData, processLnd } from './dataProcessor';

type Creds = { url: string, metricsToken: string }
type ChannelsInfo = {
  offlineChannels: number
  onlineChannels: number
  pendingChannels: number
  closingChannels: number
  openChannels: number[]
  closeChannels: number[]
  bestLocalChan: string
  bestRemoteChan: string
}
type AppsInfo = {
  totalBalance: number
  appsUsers: { appName: string, users: number }[]
}
const saveCreds = (creds: Creds) => {
  localStorage.setItem("metrics-creds", JSON.stringify(creds))
}
const getCreds = () => {
  const v = localStorage.getItem("metrics-creds")
  if (!v) {
    return null
  }
  return JSON.parse(v) as Creds
}
export const Metrics = () => {
  const [url, setUrl] = useState("")
  const [metricsToken, setMetricsToken] = useState("")
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lndGraphsData, setLndGraphsData] = useState<LndGraphs>()
  const [channelsInfo, setChannelsInfo] = useState<ChannelsInfo>()
  const [appsInfo, setAppsInfo] = useState<AppsInfo>()

  const fetchMetrics = async (fromCache?: boolean) => {
    if (!url || !metricsToken) {
      console.log("token or url missing")
      return
    }
    setLoading(true)
    const client = getHttpClient(url, { metricsToken })
    const usage = await client.GetUsageMetrics()
    const apps = await client.GetAppsMetrics({ include_operations: true })
    const lnd = await client.GetLndMetrics({})
    if (usage.status !== 'OK') throw new Error(usage.reason)
    if (apps.status !== 'OK') throw new Error(apps.reason)
    if (lnd.status !== 'OK') throw new Error(lnd.reason)
    if (!fromCache) saveCreds({ url, metricsToken })
    const lndGraphs = processLnd(lnd)
    setLndGraphsData(lndGraphs)
    const bestLocal = { n: "", v: 0 }
    const bestRemote = { n: "", v: 0 }
    const openChannels = lnd.nodes[0].open_channels.map(c => {
      if (c.remote_balance > bestRemote.v) {
        bestRemote.v = c.remote_balance; bestRemote.n = c.channel_id
      }
      if (c.local_balance > bestLocal.v) {
        bestLocal.v = c.remote_balance; bestLocal.n = c.channel_id
      }
      return c.lifetime
    })
    setChannelsInfo({
      closingChannels: lnd.nodes[0].closing_channels,
      offlineChannels: lnd.nodes[0].offline_channels,
      onlineChannels: lnd.nodes[0].online_channels,
      pendingChannels: lnd.nodes[0].pending_channels,
      closeChannels: lnd.nodes[0].closed_channels.map(c => c.closed_height),
      openChannels,
      bestLocalChan: bestLocal.n,
      bestRemoteChan: bestRemote.n
    })
    let totalAppsBalance = 0
    const appsUsers = apps.apps.map(app => {
      totalAppsBalance += app.app.balance
      return { appName: app.app.name, users: app.users.total }
    })
    setAppsInfo({
      totalBalance: totalAppsBalance,
      appsUsers
    })
    setReady(true)
  }
  useEffect(() => {
    const creds = getCreds()
    if (!creds) {
      return
    }
    setUrl(creds.url)
    setMetricsToken(creds.metricsToken)
    fetchMetrics(true)
  }, [])
  if (loading && !ready) {
    return <div className=''>
      loading...

    </div>
  }
  if (!ready) {
    return <div className=''>
      <label htmlFor="">URL</label>
      <input type="text" value={url} onChange={e => setUrl(e.target.value)} />
      <label htmlFor="">Metrics Token</label>
      <input type="text" value={metricsToken} onChange={e => setMetricsToken(e.target.value)} />
      <button onClick={() => fetchMetrics()}>fetch</button>
      <div >

      </div>
    </div>
  }
  if (!lndGraphsData || !channelsInfo || !appsInfo) {
    return <div style={{ color: 'red' }}>
      something went wrong

    </div>
  }
  return <div>
    <div >

      <div style={{ height: 400, width: "800px" }}>
        <Line data={lndGraphsData.balanceEvents} />
      </div>
      <h3>Events</h3>
      {channelsInfo.openChannels.map(v => <>
        <div style={{ border: "2px solid #73AD21", borderRadius: "10px" }}>Channel Opened {v} seconds ago</div>
      </>)}
      {channelsInfo.closeChannels.map(v => <>
        <div style={{ border: "2px solid #73AD21", borderRadius: "10px" }}>Channel Closed at block {v}</div>
      </>)}
      <h3>Highlights</h3>
      <div style={{ border: "2px solid #73AD21", borderRadius: "10px" }}>
        <h4>Net</h4>
        <p>{appsInfo.totalBalance}sats</p>
      </div>
      <div style={{ border: "2px solid #73AD21", borderRadius: "10px" }}>
        <h4>Channels</h4>
        <p>{channelsInfo.offlineChannels} offline</p>
        <p>{channelsInfo.onlineChannels} online</p>
        <p>{channelsInfo.pendingChannels} pending</p>
        <p>{channelsInfo.closingChannels} closing</p>
      </div>
      <div style={{ border: "2px solid #73AD21", borderRadius: "10px" }}>
        <h4>Top Channels</h4>
        <p>Local: {channelsInfo.bestLocalChan}</p>
        <p>Remote: {channelsInfo.bestRemoteChan}</p>
      </div>
      <div style={{ border: "2px solid #73AD21", borderRadius: "10px" }}>
        <h4>Routing</h4>
        <p>{lndGraphsData.forwardedEvents} forwards</p>
        <p>{lndGraphsData.forwardRevenue} sats</p>
      </div>
      {appsInfo.appsUsers.map(app => <div style={{ border: "2px solid #73AD21", borderRadius: "10px" }}>
        <h4>{app.appName}</h4>
        <p>{app.users} users</p>
      </div>)}
    </div>
  </div>
}