import { Line } from 'react-chartjs-2'
import { useMemo, useState } from 'react'
import { decodeListTLV, parseTLV } from "./tlv";
import { BundleDataPoint, MetricsDataEntry } from "./statsApi";
import { bytesToHex } from "@noble/hashes/utils";

type Props = { fetchPage: (page: number) => Promise<Uint8Array>, bundleId: string, bundleMetrics: MetricsDataEntry<BundleDataPoint> }
export const z = (n: number) => n < 10 ? `0${n}` : `${n}`
export const BundleGraph = ({ fetchPage, bundleId, bundleMetrics }: Props) => {
    const [shownPage, setShownPage] = useState<number>(-1)
    const [pagesData, setPagesData] = useState<Record<number, BundleDataPoint[]>>({})
    const { datasets, labels, from, to } = useMemo(() => {
        const labels = [] as string[]
        const data = [] as number[]

        const pageData = shownPage === -1 ? bundleMetrics.entries : pagesData[shownPage] || []
        let min = Number.MAX_SAFE_INTEGER
        let max = 0
        pageData.forEach(metric => {
            if (metric.unix < min) min = metric.unix
            if (metric.unix > max) max = metric.unix
            const d = new Date(metric.unix * 1000)
            const date = `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`
            labels.push(date)
            data.push(metric.v)
        })
        const datas = [{ label: bundleId, data: data, color: '#66c2a5' }]
        const datasets = datas.filter(({ data }) => data.length > 0).map((d, i) => ({
            label: d.label,
            data: d.data,
            backgroundColor: d.color,
            borderColor: d.color,
            color: d.color,
        }))
        const minTime = new Date(min * 1000)
        const from = `${minTime.getFullYear()}-${z(minTime.getMonth() + 1)}-${z(minTime.getDate())} ${z(minTime.getHours())}:${z(minTime.getMinutes())}:${z(minTime.getSeconds())}`
        const maxTime = new Date(max * 1000)
        const to = `${maxTime.getFullYear()}-${z(maxTime.getMonth() + 1)}-${z(maxTime.getDate())} ${z(maxTime.getHours())}:${z(maxTime.getMinutes())}:${z(maxTime.getSeconds())}`
        return { datasets, labels, from, to }
    }, [shownPage, pagesData])

    const loadMore = async (page: number) => {
        console.log("loading page", page, shownPage)
        if (shownPage === page) return
        setShownPage(page)
        const pageData = await fetchPage(page)
        const dataList = decodeListTLV(parseTLV(pageData))
        const data = dataList.map(decoded => {
            const ts = decoded.slice(0, 4)
            const unix = parseInt(bytesToHex(ts), 16)
            const val = decoded.slice(4, 8)
            const v = parseInt(bytesToHex(val), 16)
            return { unix, v }
        })
        const moreData = {
            ...pagesData, [page]: data
        }
        setPagesData(moreData)
    }

    return <div key={bundleId} style={{ width: 600, border: '1px solid black', textAlign: 'center' }}>
        <h2>{bundleId}</h2>
        <p>{from} -- {to}</p>
        <Line data={{
            labels,
            datasets,
        }} />
        <div>
            {bundleMetrics.allPages.map(p =>
                <span style={{ margin: '2px', textDecoration: p === shownPage ? 'underline' : ' none' }}
                    onClick={() => loadMore(p)} key={p}
                >{p}</span>
            )}
            <span style={{ margin: '2px', textDecoration: -1 === shownPage ? 'underline' : ' none' }}
                onClick={() => loadMore(-1)} key={-1}>(last 100)</span>
        </div>
    </div>
}
