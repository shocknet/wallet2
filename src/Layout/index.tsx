import React, { useEffect } from "react";
import { useIonRouter } from "@ionic/react";
import { Header } from "../Containers/Header";
import { Footer } from "../Containers/Footer";
import { LayoutProps } from "./types";
import axios from "axios";
import { useDispatch, useSelector } from "../State/store";
import { setAmount } from "../State/Slices/usdToBTCSlice";
import { App } from "@capacitor/app";
import { PayTo } from "../globalTypes";
import LoadingOverlay from "../Components/LoadingOverlay";

interface Price {
  buyPrice: number,
  sellPrice: number,
};

export const Layout: React.FC<LayoutProps> = ({ children }): JSX.Element => {

  //reducer
  const paySource = useSelector((state) => state.paySource).map((e) => { return { ...e } });
  const BTCFiatUnit = useSelector(({ prefs }) => prefs.FiatUnit)
  const nostrSource = paySource.filter((e) => e.pasteField.includes("nprofile"))
  const router = useIonRouter();

  const isscan: boolean = router.routeInfo.pathname === "/scan";


  const dispatch = useDispatch();

  const getPrice = async () => {
    const buyInfo = await axios.get<any>(BTCFiatUnit.url);

    dispatch(setAmount(
      {
        buyPrice: buyInfo.data.data.amount,
        sellPrice: buyInfo.data.data.amount,
      } as Price
    ))
  }

  useEffect(() => {
    getPrice();
    setInterval(() => {
      getPrice();
    }, 5 * 60 * 1000)
  }, []);

  return (
    <div>
      {isscan ? (
        <React.Fragment>
          {children}
        </React.Fragment>
      ) :
        (
          <React.Fragment>
            <Header />
            {children}
            <LoadingOverlay />
            <Footer />
          </React.Fragment>
        )}
    </div>
  )
}