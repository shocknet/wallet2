import React, { useEffect } from "react";
import { useIonRouter } from "@ionic/react";
import { Header } from "../Containers/Header";
import { Footer } from "../Containers/Footer";
import { LayoutProps } from "./types";
import axios from "axios";
import { useDispatch, useSelector } from "../State/store";
import { setAmount } from "../State/Slices/usdToBTCSlice";
import LoadingOverlay from "../Components/LoadingOverlay";

interface Price {
  buyPrice: number,
  sellPrice: number,
}

export const Layout: React.FC<LayoutProps> = ({ children }): JSX.Element => {

  //reducer
  const BTCFiatUnit = useSelector(({ prefs }) => prefs.FiatUnit)
  const router = useIonRouter();

  const isscan: boolean = router.routeInfo.pathname === "/scan";


  const dispatch = useDispatch();

  const getPrice = async () => {
    try {
      const buyInfo = await axios.get<any>(BTCFiatUnit.url);

      dispatch(setAmount(
        {
          buyPrice: buyInfo.data.data.amount,
          sellPrice: buyInfo.data.data.amount,
        } as Price
      ))
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getPrice();

    const interval = setInterval(() => {
      getPrice();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, [getPrice]); // Include getPrice in the dependency array


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