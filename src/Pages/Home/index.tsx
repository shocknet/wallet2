import React, { useEffect, useState } from "react";
import moment from 'moment'

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";

import { PageProps, SpendFrom, sw_item } from "../../globalTypes";
import { useDispatch, useSelector } from "react-redux";
import { SwItem } from "../../Components/SwItem";
import { bech32 } from "bech32";
import axios from "axios";
import { getNostrClient } from "../../Api";
import { editSpendSources } from "../../State/Slices/spendSourcesSlice";
import { notification } from "antd";
import { NotificationPlacement } from "antd/es/notification/interface";

export const Home = () => {
  const price = useSelector((state: any) => state.usdToBTC);
  const spendSources = useSelector((state: any) => state.spendSource);
  
  const [error, setError] = useState("")
  const [balance, setBalance] = useState('0.00')
  const [money, setMoney] = useState("0")
  const [items, setItems] = useState<JSX.Element[]>([])

  const [SwItemArray, setSwItemArray] = useState<sw_item[]>([]);
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

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
  },[price])

  useEffect(() => {
    resetSpendFrom();
    let totalAmount = 0;
    for (let i = 0; i < spendSources.length; i++) {
      const eachAmount = spendSources[i].balance;
      totalAmount += parseInt(eachAmount);
    }
    setBalance(totalAmount.toString());
    setMoney(totalAmount == 0 ? "0" : (totalAmount * price.buyPrice * 0.00000001).toFixed(2))
  }, []);

  const resetSpendFrom = async () => {
    let box: any = spendSources.map((e: SpendFrom) => { return { ...e } });
    await box.map(async (e: SpendFrom, i: number) => {
      const element = e;
      if (element.pasteField.includes("nprofile")) {
        let balanceOfNostr = "0";
        try {
          await (await getNostrClient(element.pasteField)).GetUserInfo().then(res => {
            if (res.status !== 'OK') {
              console.log(res.reason, "reason");
              return
            }
            balanceOfNostr = res.balance.toString()
          })
          box[i].balance = balanceOfNostr;
          dispatch(editSpendSources(box[i]));
        } catch (error) {
          return openNotification("top", "Error", "Couldn't connect to relays");
        }
      } else {
        let { prefix: s, words: dataPart } = bech32.decode(element.pasteField.replace("lightning:", ""), 2000);
        let sourceURL = bech32.fromWords(dataPart);
        const lnurlLink = Buffer.from(sourceURL).toString()
        let amountSats = "0";
        try {
          const amount = await axios.get(lnurlLink);
          amountSats = (amount.data.maxWithdrawable / 1000).toString();

          box[i].balance = parseInt(amountSats).toString();
          dispatch(editSpendSources(box[i]));
        } catch (error: any) {
          box[i].balance = amountSats;
          dispatch(editSpendSources(box[i]));
          console.log(error.response.data.reason);
          return openNotification("top", "Error", (i + 1) + " " + error.response.data.reason);
        }
      }
    });
  }

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