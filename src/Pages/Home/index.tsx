import React, { useEffect, useState } from "react";
import moment from 'moment'
import { SwItem } from "../../Components/SwItem";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";

import { PageProps, sw_item } from "../../globalTypes";
import { nostr } from '../../Api'
import { useSelector } from "react-redux";

export const Home: React.FC<PageProps> = (): JSX.Element => {
  const price = useSelector((state:any) => state.usdToBTC);
  console.log(price, "price");
  
  const [error, setError] = useState("")
  const [balance, setBalance] = useState('0.00')
  const [items, setItems] = useState<JSX.Element[]>([])

  const [SwItemArray, setSwItemArray] = useState<sw_item[]>([]);
  
  const getPrice = async () => {
      setSwItemArray(
      [
        {
          priceImg: Icons.PriceUp,
          changes: "0.00",
          station: 'Coinbase.com',
          date: 'Buy',
          price: price.buyPrice,
          stateIcon: 'lightning'
        },
        {
          priceImg: Icons.PriceDown,
          changes: "0.00",
          station: 'Coinbase.com',
          date: 'Sell',
          price: price.sellPrice,
          stateIcon: 'lightning'
        },
      ]
    );
  }

  useEffect(() => {
    getPrice();
    nostr.GetUserInfo().then(res => {
      if (res.status !== 'OK') {
        setError(res.reason)
        return
      }
      setBalance((res.balance.toString()))
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
        stateIcon={'lightning'}
        station={o.type}
        changes={'~ $.10'}
        price={o.amount}
        priceImg={o.inbound ? Icons.PriceUp : Icons.PriceDown}
        date={moment.unix(o.paidAtUnix).fromNow()}
        key={i}
      />)
      setItems(merged)
    });
  }, [])
  
  const ArrangeData = SwItemArray.map((o, i): JSX.Element => <SwItem
    stateIcon={o.stateIcon}
    station={o.station}
    changes={o.changes}
    price={o.price}
    priceImg={o.priceImg}
    date={o.date}
    key={i}
    underline={o.underline}
  />);

  return (
    <div className="Home">
      <div className="Home_sats">
        <div className="Home_sats_amount">{balance}</div>
        <div className="Home_sats_name">sats</div>
        <div className="Home_sats_changes">~ $0.00</div>
      </div>
      <div className="Home_scroller scroller">
        <div className="Home_content">
          {ArrangeData}
        </div>
      </div>
    </div>
  )
}