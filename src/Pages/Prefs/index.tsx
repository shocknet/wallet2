import { useEffect, useState } from 'react';

import { useSelector, useDispatch } from '../../State/store';
import { useIonRouter } from '@ionic/react';
import { setPrefs } from '../../State/Slices/prefsSlice';
import { setAmount } from "../../State/Slices/usdToBTCSlice";
import axios from 'axios';
import { toggleLoading } from '../../State/Slices/loadingOverlay';
import * as Types from "../../globalTypes";
import { fiatCurrencies } from "./fiatCurrency";
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";


export interface ChainFeesInter {
  fastestFee: number,
  halfHourFee: number,
  hourFee: number,
  economyFee: number,
  minimumFee: number,
}

interface Price {
  buyPrice: number,
  sellPrice: number,
}

export const Prefs = () => {
  const router = useIonRouter();
  const dispatch = useDispatch();
  //reducer
  const prefsRedux = useSelector((state) => state.prefs);

  const [mempool, setMempool] = useState(prefsRedux.mempoolUrl || "https://mempool.space/api/v1/fees/recommended");
  const [fiatCurreny, setFiatCurreny] = useState<string>('USD');
  const [fiat, setFiat] = useState<string>('https://api.coinbase.com/v2/prices/BTC-USD/spot');

  let fiatUnit = fiatCurrencies.find(item => item.currency === fiatCurreny) as Types.FiatCurrency;

  const hadleSubmit = async () => {
    let mempoolInfo;
    let fiatInfo;
    try {
      mempoolInfo = await axios.get(mempool);
    } catch (error) {
      mempoolInfo = {};
      console.log(error);
    }
    try {
      fiatInfo = await axios.get(fiat);
    } catch (error) {
      fiatInfo = {};
      console.log(error);
    }
    const mempoolBool = (mempool === "" || mempoolInfo.data.halfHourFee);
    const fiatBool = (fiat === "" || fiatInfo.data.data.amount);
    if (mempoolBool && fiatBool) {
      dispatch(setPrefs(
        {
          mempoolUrl: mempool,
          FiatUnit: fiatUnit,
          selected: prefsRedux.selected ?? ""
        }
      ));
      dispatch(setAmount(
        {
          buyPrice: fiatInfo.data.data.amount,
          sellPrice: fiatInfo.data.data.amount,
        } as Price
      ))
      dispatch(toggleLoading({ loadingMessage: "Saving..." }))
      setTimeout(() => {
        dispatch(toggleLoading({ loadingMessage: "" }));
        toast.success(<Toast title="Preferences" message="Successfully saved." />)
        router.push("/home");
      }, 1500);
    } else {
      toast.error(<Toast title="Error" message="Please input correct endpoint." />)
      return;
    }
  }

  useEffect(() => {
    setFiatCurreny(prefsRedux.FiatUnit.currency)
    setFiat(prefsRedux.FiatUnit.url);
  }, [prefsRedux])

  const handleChangeFiatCurrency = (currency: string) => {
    setFiatCurreny(currency);
    fiatUnit = fiatCurrencies.find(item => item.currency === currency) as Types.FiatCurrency;
    setFiat(fiatUnit?.url);
  }

  return (
    <div className='Prefs_container'>
      <div className="Prefs">
        <div className="Prefs_header_text">Preferences</div>
        <div className='Prefs_mempool'>
          <header>Mempool Provider</header>
          <input value={mempool} onChange={(e) => { setMempool(e.target.value) }} type="text" placeholder="example: https://mempool.space/api/v1/fees/recommended" />
        </div>
        <div className='Prefs_fiat'>
          <header>Fiat Estimates</header>
          <div className='Prefs_fiat_estimates'>
            <select value={fiatCurreny} onChange={(e) => handleChangeFiatCurrency(e.target.value)} className='Prefs_fiat_currency'>
              {fiatCurrencies.map((e, i) => {
                return (<option value={e.currency} key={i}>{e.currency}</option>);
              })}
            </select>
            <input value={fiat} onChange={(e) => setFiat(e.target.value)} type="text" placeholder="https://api.coinbase.com/v2/prices/BTC-USD/spot" />
          </div>
        </div>
        <div className='Prefs_buttons'>
          <button className='Prefs_buttons_cancel' onClick={() => { router.goBack() }}>Cancel</button>
          <button className='Prefs_buttons_save' onClick={hadleSubmit}>Save</button>
        </div>
      </div>
    </div>
  )
}
