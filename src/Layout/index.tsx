import React, { useEffect } from "react";
import { Header } from "../Containers/Header";
import { Footer } from "../Containers/Footer";
import { LayoutProps } from "./types";
import axios from "axios";
import { usdToBTCSpotLink } from "../constants";
import { useDispatch } from "react-redux";
import { setAmount } from "../State/Slices/usdToBTCSlice";
import { App } from "@capacitor/app";

interface Price {
  buyPrice: number,
  sellPrice: number,
};

export const Layout: React.FC<LayoutProps> = ({ children }): JSX.Element => {

  const dispatch = useDispatch();
  
  const getPrice = async () => {
    const buyInfo = await axios.get<any>(usdToBTCSpotLink);
    const sellInfo = await axios.get<any>(usdToBTCSpotLink);

    dispatch(setAmount(
      {
        buyPrice: buyInfo.data.data.amount,
        sellPrice: sellInfo.data.data.amount
      } as Price
    ))
  }

  useEffect(()=>{
    getPrice();
  });

  useEffect(() => {
      // Listen for the appUrlOpen event
      const listener = App.addListener("appUrlOpen", (data) => {
        console.log("appurlopen");
        
      // Get the bitcoin URI from the data
      const bitcoinUri = data.url;
      // Do something with the bitcoin URI, such as parsing it or sending it to another component
    });
    
    // Remove the listener when the component is unmounted
    return () => {
      listener.remove();
    };
  }, []);

  return(
    <React.Fragment>
      <Header />
        {children}
      <Footer />
    </React.Fragment>
  )
}