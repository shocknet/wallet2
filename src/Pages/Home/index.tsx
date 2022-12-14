import React, { useEffect, useState } from "react";
import moment from 'moment'
import { SwItem } from "../../Components/SwItem";
import PriceDown from "../../Assets/Icons/PriceDown.svg";
import PriceUp from "../../Assets/Icons/PriceUp.svg";
import { PageProps } from "../../globalTypes";
import { nostr } from '../../Api'
interface sw_item {
  station?: string;
  changes?: string;
  stateIcon?: string;
  date?: string;
  priceImg?: string;
  price?: number;
}
export const Home: React.FC<PageProps> = ({ }): JSX.Element => {
  const [error, setError] = useState("")
  const [balance, setBalance] = useState(0)
  const [items, setItems] = useState<JSX.Element[]>([])
  useEffect(() => {
    nostr.GetUserInfo().then(res => {
      if (res.status !== 'OK') {
        setError(res.reason)
        return
      }
      setBalance(res.balance)
    })
  }, [])
  useEffect(() => {
    nostr.GetUserOperations({
      latestIncomingInvoice: 0,
      latestIncomingTx: 0,
      latestOutgoingInvoice: 0,
      latestOutgoingTx: 0
    }).then(res => {
      if (res.status !== 'OK') {
        setError(res.reason)
        return
      }
      const merged = [
        ...res.latestIncomingInvoiceOperations.operations,
        ...res.latestIncomingTxOperations.operations,
        ...res.latestOutgoingInvoiceOperations.operations,
        ...res.latestOutgoingTxOperations.operations
      ].sort((a, b) => b.paidAtUnix - a.paidAtUnix).map((o, i): JSX.Element => <SwItem
        stateIcon={'lighting'}
        station={o.type}
        changes={'~ $.10'}
        price={o.amount}
        priceImg={o.inbound ? PriceUp : PriceDown}
        date={moment.unix(o.paidAtUnix).fromNow()}
        key={i}
      />)
      setItems(merged)
    })
  }, [])

  let SwItemArray: sw_item[] = [];
  SwItemArray.push({
    priceImg: PriceUp,
    changes: '~ $.10',
    station: 'Lightning.Video Paywall',
    date: '3 days ago',
    price: 2100,
    stateIcon: 'lighting'
  });

  SwItemArray.push({
    priceImg: PriceUp,
    changes: '~ $.10',
    station: 'Lightning.Video Paywall',
    date: '3 days ago',
    price: 2100,
    stateIcon: 'lighting'
  });

  SwItemArray.push({
    priceImg: PriceUp,
    changes: '~ $.10',
    station: 'Lightning.Video Paywall',
    date: '3 days ago',
    price: 2100,
    stateIcon: 'lighting'
  });

  SwItemArray.push({
    priceImg: PriceUp,
    changes: '~ $.10',
    station: 'Lightning.Video Paywall',
    date: '3 days ago',
    price: 2100,
    stateIcon: 'lighting'
  });

  SwItemArray.push({
    priceImg: PriceUp,
    changes: '~ $.10',
    station: 'Lightning.Video Paywall',
    date: '3 days ago',
    price: 2100,
    stateIcon: 'lighting'
  });

  SwItemArray.push({
    priceImg: PriceUp,
    changes: '~ $.10',
    station: 'Lightning.Video Paywall',
    date: '3 days ago',
    price: 2100,
    stateIcon: 'lighting'
  });

  SwItemArray.push({
    priceImg: PriceUp,
    changes: '~ $.10',
    station: 'Lightning.Video Paywall',
    date: '3 days ago',
    price: 2100,
    stateIcon: 'lighting'
  });

  return (
    <div className="Home">
      <div className="Home_sats">
        <div className="Home_sats_amount">{balance}</div>
        <div className="Home_sats_name">sats</div>
        <div className="Home_sats_changes">~ $40,000.00</div>
      </div>
      <div className="Home_content scroller">
        {items}
      </div>
    </div>
  )
}