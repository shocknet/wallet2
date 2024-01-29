import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, registerables, Legend } from 'chart.js';
import { Bar, Line, Pie, Chart } from 'react-chartjs-2'
ChartJS.register(...registerables, Legend);
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector, useDispatch } from '../../State/store';
import { useIonRouter } from '@ionic/react';
import { getHttpClient } from '../../Api';
import { BarGraph, LineGraph, LndGraphs, PieGraph, processData, processLnd } from './dataProcessor';
import styles from "./styles/index.module.scss";
import classNames from 'classnames';
import moment from 'moment';

const trimText = (text: string) => {
	return text.length < 10 ? text : `${text.substring(0, 5)}...${text.substring(text.length - 5, text.length)}`
}

const getTimeAgo = (secondsAgo: number) => {
	return moment().subtract(secondsAgo, 'seconds').fromNow();
}



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
		console.log({lndGraphs})
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
    <div className={styles["metrics-container"]}>

      <div  className={classNames(styles["section"], styles["chart"])}>
        <Line
					data={lndGraphsData.balanceEvents}
					options={{
						responsive: true,
						maintainAspectRatio: true,
						aspectRatio: 16/9,
						plugins: {
							legend: {
								display: true,
								position: "chartArea",
								align: "start",
								fullSize: false,
								maxWidth: 12,
								labels: {
									boxWidth: 10,
									boxHeight: 10
								}
							} 
						},
						scales: {
							x: {
								grid: {
									color: "#383838"
								}
							},
							y: {
								grid: {
									color: "#383838"
								}
							}
						},
					}}
				/>
      </div>
			<div className={styles["section"]}>
				<div className={styles["between"]}>
					<div className={styles["center"]} style={{opacity: 0}}>
						<div className={classNames(styles["center"], styles["box"])}>
							<span style={{ color: "#a012c7" }}>{Icons.Automation()}</span>
							<span>This Week</span>
						</div>
						<div className={styles["arrows"]}>
							Arrows
						</div>
					</div>
					<div className={classNames(styles["box"], styles["border"])}>
						Manage
					</div>

				</div>
			</div>
      <div className={styles["section"]}><span className={styles["separator"]}></span></div>
      <div className={styles["section"]}>
        <h3 className={styles["sub-title"]}>Events</h3>
        <div className={styles["column-flex"]}>
          {channelsInfo.openChannels.map(v => <>
            <div className={styles["event-item"]}><span> {Icons.lightningIcon()} Channel Opened</span> <span>{getTimeAgo(v)}</span></div>
          </>)}
          {channelsInfo.closeChannels.map(v => <>
            <div className={styles["event-item"]}><span> {Icons.Automation()} Channel Closed</span> <span>At block {v}</span></div>
          </>)}
        </div>
      </div>
      <div className={styles["section"]}>
        <h3 className={styles["sub-title"]}>Highlights</h3>
        <div className={styles["cards-container"]}>
          <div className={classNames(styles["card"], styles["net"])}>
            <div className={styles["top"]}>    
              <h4 className={styles["card-label"]}>Net</h4>
              <span className={styles["number"]}> {
								new Intl.NumberFormat('fr-FR').format(appsInfo.totalBalance)
							}</span>
            </div>
          </div>
					<div className={classNames(styles["card"], styles["channels"])}>
						<div className={styles["top"]}>
							<h4 className={styles["card-label"]}>Channels</h4>
						</div>
						<div className={classNames(styles["bot"], styles["channels-grid"])}>
							<div className={styles["channel"]}><span className={styles["dot"]}></span><span>{channelsInfo.onlineChannels} online</span></div>
							<div className={styles["channel"]}><span className={styles["dot"]}></span><span>{channelsInfo.pendingChannels} pending</span></div>
							<div className={styles["channel"]}><span className={styles["dot"]}></span><span>{channelsInfo.offlineChannels} offline</span></div>
							<div className={styles["channel"]}><span className={styles["dot"]}></span><span>{channelsInfo.closingChannels} closing</span></div>
						</div>
					</div>
					<div className={classNames(styles["card"], styles["top-channels"])}>
						<div className={styles["top"]}>
							<h4 className={styles["card-label"]}>Top Channels</h4>
						</div>
						<div className={classNames(styles["bot"], styles["top-channels"])}>
							<div className={styles["row"]}>
								<span className={styles["label"]}>In:&nbsp;</span>
								<span>{trimText(channelsInfo.bestLocalChan)}</span>
							</div>
							<div className={styles["row"]}>
								<span className={styles["label"]}>Out:&nbsp;</span>
								<span> {trimText(channelsInfo.bestRemoteChan)}</span>
							</div>
						</div>
					</div>
					<div className={classNames(styles["card"], styles["top-channels"], styles["routing"])}>
						<div className={styles["top"]}>
							<h4 className={styles["card-label"]}>Routing</h4>
						</div>
						<div className={classNames(styles["bot"], styles["top-channels"])}>
							<div className={styles["row"]}>
								{lndGraphsData.forwardedEvents} forwards
							</div>
							<div className={styles["row"]}>
								{lndGraphsData.forwardRevenue} sats
							</div>
						</div>
					</div>
					{
						appsInfo.appsUsers.map(app => (
							<div key={app.appName} className={classNames(styles["card"], styles["top-channels"])}>
								<div className={styles["top"]}>
									<h4 className={styles["card-label"]}>{app.appName}</h4>
								</div>
								<div className={classNames(styles["bot"], styles["top-channels"])}>
									<div className={styles["row"]}>
										{app.users} users
									</div>
									<div className={styles["row"]}>
										invoices
									</div>
								</div>
							</div>
						))
					}
        </div>
      </div>
    </div>
  </div>
}