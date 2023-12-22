import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar, Line, Pie, Chart } from 'react-chartjs-2'
ChartJS.register(...registerables);
import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector, useDispatch } from '../../State/store';
import { useIonRouter } from '@ionic/react';
import { getHttpClient } from '../../Api';
import { BarGraph, LineGraph, PieGraph, processData } from './dataProcessor';

type Creds = { url: string, metricsToken: string }
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
  const [requestsPerTimeData, setRequestsPerTimeData] = useState<BarGraph>()
  const [requestsPerMethodData, setRequestsPerMethodData] = useState<BarGraph>()
  const [handleTimePerMethodData, setHandleTimePerMethodData] = useState<BarGraph>()
  const [chainBalanceEventsData, setChainBalanceEventsData] = useState<LineGraph>()
  const [localChanBalanceEventsData, setLocalChanBalanceEventsData] = useState<LineGraph>()
  const [remoteChanBalanceEventsData, setRemoteChanBalanceEventsData] = useState<LineGraph>()
  const [appsBalancesData, setAppsBalancesData] = useState<PieGraph>()
  const [serviceFeesData, setServiceFeesData] = useState<BarGraph>()
  const [movingSatsData, setMovingSatsData] = useState<BarGraph>()
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
    const { requestsPerMethod, requestsPerTime, handleTimePerMethod, chainBalanceEvents, locaChanBalanceEvent, remoteChanBalanceEvents, appsBalances, feesPaid, movingSats } = processData({ usage, apps, lnd }, { type: '5min', ms: 300000 })
    setRequestsPerTimeData(requestsPerTime)
    setRequestsPerMethodData(requestsPerMethod)
    setHandleTimePerMethodData(handleTimePerMethod)
    setChainBalanceEventsData(chainBalanceEvents)
    setRemoteChanBalanceEventsData(remoteChanBalanceEvents)
    setLocalChanBalanceEventsData(locaChanBalanceEvent)
    setAppsBalancesData(appsBalances)
    setServiceFeesData(feesPaid)
    setMovingSatsData(movingSats)
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
  if (!requestsPerTimeData || !requestsPerMethodData || !handleTimePerMethodData || !chainBalanceEventsData || !remoteChanBalanceEventsData || !localChanBalanceEventsData || !appsBalancesData || !serviceFeesData || !movingSatsData) {
    return <div style={{ color: 'red' }}>
      something went wrong

    </div>
  }
  return <div style={{ overflow: 'scroll' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', }}>
      <div style={{ height: 400, width: "800px" }}>
        <Bar data={requestsPerTimeData} />
      </div>
      <div style={{ height: 400, width: "800px" }}>
        <Bar data={requestsPerMethodData} />
      </div>
      <div style={{ height: 400, width: "800px" }}>
        <Bar data={handleTimePerMethodData} />
      </div>
      <div style={{ height: 400, width: "800px" }}>
        <Line data={chainBalanceEventsData} />
      </div>
      <div style={{ height: 400, width: "800px" }}>
        <Line data={remoteChanBalanceEventsData} />
      </div>
      <div style={{ height: 400, width: "800px" }}>
        <Line data={localChanBalanceEventsData} />
      </div>
      <div style={{ height: 400, width: "800px" }}>
        <Pie data={appsBalancesData} />
      </div>
      <div style={{ height: 400, width: "800px" }}>
        <Bar data={serviceFeesData} />
      </div>
      <div style={{ height: 400, width: "800px" }}>
        <Bar data={movingSatsData} />
      </div>
    </div>
  </div>
}