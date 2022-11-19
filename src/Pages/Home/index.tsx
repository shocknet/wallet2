import React from "react";

import { SwItem } from "../../Components/SwItem";
import PriceDown from "../../Assets/Icons/PriceDown.svg";
import PriceUp from "../../Assets/Icons/PriceUp.svg";
import { PageProps } from "../../globalTypes";

export const Home: React.FC<PageProps> = ({}): JSX.Element => {

  interface SwItemArray {
    [index: number]: object;
  }

  interface sw_item {
    station?: string;
    changes?: string;
    stateIcon?: string; 
    date?: string;
    priceImg?: string;
    price?: number;
  }

  let SwItemArray = [];
  SwItemArray.push({
    priceImg: PriceUp, 
    changes: '~ $.10', 
    station: 'Lightning.Video Paywall', 
    date: '3 days ago', 
    price: 2100,
    stateIcon: 'lighting'
  } as sw_item);
  
  SwItemArray.push({
    priceImg: PriceUp, 
    changes: '~ $.10', 
    station: 'Lightning.Video Paywall', 
    date: '3 days ago', 
    price: 2100,
    stateIcon: 'lighting'
  } as sw_item);
  
  SwItemArray.push({
    priceImg: PriceUp, 
    changes: '~ $.10', 
    station: 'Lightning.Video Paywall', 
    date: '3 days ago', 
    price: 2100,
    stateIcon: 'lighting'
  } as sw_item);

  SwItemArray.push({
    priceImg: PriceUp, 
    changes: '~ $.10', 
    station: 'Lightning.Video Paywall', 
    date: '3 days ago', 
    price: 2100,
    stateIcon: 'lighting'
  } as sw_item);

  SwItemArray.push({
    priceImg: PriceUp, 
    changes: '~ $.10', 
    station: 'Lightning.Video Paywall', 
    date: '3 days ago', 
    price: 2100,
    stateIcon: 'lighting'
  } as sw_item);

  SwItemArray.push({
    priceImg: PriceUp, 
    changes: '~ $.10', 
    station: 'Lightning.Video Paywall', 
    date: '3 days ago', 
    price: 2100,
    stateIcon: 'lighting'
  } as sw_item);

  SwItemArray.push({
    priceImg: PriceUp, 
    changes: '~ $.10', 
    station: 'Lightning.Video Paywall', 
    date: '3 days ago', 
    price: 2100,
    stateIcon: 'lighting'
  } as sw_item);

  return(
    <div className="Home">
      <div className="Home_sats">
        <div className="Home_sats_amount">21,000,000</div>
        <div className="Home_sats_name">sats</div>
        <div className="Home_sats_changes">~ $40,000.00</div>
      </div>
      <div className="Home_content scroller">
        {
          SwItemArray.map((item, key) => {
            return (
              <SwItem 
                stateIcon={item.stateIcon} 
                station={item.station} 
                changes={item.changes} 
                price={item.price} 
                priceImg={item.priceImg} 
                date={item.date}
                key={key}
              />
            )
          })
        }
      </div>
    </div>
  )
}