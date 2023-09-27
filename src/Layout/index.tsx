import React, { useEffect } from "react";
import { Header } from "../Containers/Header";
import { Footer } from "../Containers/Footer";
import { LayoutProps } from "./types";
import axios from "axios";
import { usdToBTCSpotLink } from "../constants";
import { useDispatch } from "react-redux";
import { setAmount } from "../State/Slices/usdToBTCSlice";

interface Price {
  buyPrice: number,
  sellPrice: number,
};

export const Layout: React.FC<LayoutProps> = ({ children }): JSX.Element => {

  const dispatch = useDispatch();
  
  const getPrice = async () => {
    const buyInfo = await axios.get<any>(
      usdToBTCSpotLink,
      {
        headers: {
          Accept: 'application/json',
        }
      }
    );
    const sellInfo = await axios.get<any>(
      usdToBTCSpotLink,
      {
        headers: {
          Accept: 'application/json',
        }
      }
    );

    dispatch(setAmount(
      {
        buyPrice: buyInfo.data.data.amount,
        sellPrice: sellInfo.data.data.amount
      } as Price
    ))
  }

  useEffect(()=>{
    getPrice();
  })

  return(
    <React.Fragment>
      <Header />
        {children}
      <Footer />
    </React.Fragment>
  )
}