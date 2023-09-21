import React, { useEffect, useState } from "react";
import moment from 'moment'

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";

import { PageProps, sw_item } from "../../globalTypes";
// import { nostr } from '../../Api'
import { useSelector } from "react-redux";
import { SwItem } from "../../Components/SwItem";
import { nostr } from "../../Api";

export const Home = () => {
  const price = useSelector((state: any) => state.usdToBTC);
  const spendSources = useSelector((state: any) => state.spendSource);
  
  const [error, setError] = useState("")
  const [balance, setBalance] = useState('0.00')
  const [money, setMoney] = useState("0")
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
          stateIcon: 'lightning',
          underline: false,
        },
        {
          priceImg: Icons.PriceDown,
          changes: "0.00",
          station: 'Coinbase.com',
          date: 'Sell',
          price: price.sellPrice,
          stateIcon: 'lightning',
          underline: true,
        },
      ]
    );
  }

  useEffect(() => {
    getPrice();
    let totalAmount = 0;
    for (let i = 0; i < spendSources.length; i++) {
      const eachAmount = spendSources[i].balance;
      totalAmount += parseInt(eachAmount);
    }
    setBalance(totalAmount.toString());
    setMoney(totalAmount == 0 ? "0" : (totalAmount * price.buyPrice * 0.00000001).toFixed(2))
    nostr.GetUserInfo().then(res => {
      if (res.status !== 'OK') {
        setError(res.reason)
        console.log(res.reason, "reason");
        
        return
      }
      console.log(res.balance);
      
      setBalance((res.balance.toString()))
    })
  }, []);

  useEffect(() => {
    nostr.GetUserOperations({
      latestIncomingInvoice: 0,
      latestIncomingTx: 0,
      latestOutgoingInvoice: 0,
      latestOutgoingTx: 0,
      latestIncomingUserToUserPayment: 0,
      latestOutgoingUserToUserPayment: 0
    }).then(res => {
      if (res.status !== 'OK') {
        setError(res.reason)
        return
      }
      const merged = [
        ...res.latestIncomingInvoiceOperations.operations,
        ...res.latestIncomingTxOperations.operations,
        ...res.latestIncomingUserToUserPayemnts.operations,
        ...res.latestOutgoingInvoiceOperations.operations,
        ...res.latestOutgoingTxOperations.operations,
        ...res.latestOutgoingUserToUserPayemnts.operations
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
        <div className="Home_sats_changes">~ ${money}</div>
      </div>
      <div className="Home_scroller scroller">
        <div className="Home_content">
          {ArrangeData}
        </div>
      </div>
    </div>
  )
}