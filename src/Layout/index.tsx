import React, { useEffect } from "react";
import { useIonRouter } from "@ionic/react";
import { Header } from "../Containers/Header";
import { Footer } from "../Containers/Footer";
import { LayoutProps } from "./types";
import axios from "axios";
import { usdToBTCSpotLink } from "../constants";
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
  const BTCUSDUrl = useSelector(({ prefs }) => prefs.BTCUSDUrl)
  const nostrSource = paySource.filter((e) => e.pasteField.includes("nprofile"))
  const router = useIonRouter();

  const isscan: boolean = router.routeInfo.pathname === "/scan";


  const dispatch = useDispatch();

  const getPrice = async () => {
    const buyInfo = await axios.get<any>(BTCUSDUrl || usdToBTCSpotLink);

    dispatch(setAmount(
      {
        buyPrice: buyInfo.data.data.amount,
        sellPrice: buyInfo.data.data.amount
      } as Price
    ))
  }

  useEffect(() => {
    console.log(children, 'asdfasdfasdfasdfasdf')
    getPrice();
    setInterval(() => {
      getPrice();
    }, 5 * 60 * 1000)
  }, []);

  useEffect(() => {
    // Listen for the appUrlOpen event
    const listener = App.addListener("appUrlOpen", (data) => {
      console.log("appurlopen");

      // Get the bitcoin URI from the data
      const bitcoinUri = data.url;
      // Do something with the bitcoin URI, such as parsing it or sending it to another component
    });
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