import { lightningIcon, linkIcon } from "../../Assets/SvgIconLibrary";
import { SwItemData } from "../../globalTypes";

export const SwItem: React.FC<SwItemData> = ({
  stateIcon,
  date,
  station,
  changes,
  price,
  priceImg,
  underline,
}): JSX.Element => {
  underline = underline ?? true;
  const stateIcons = (icon?: string) => {
    switch (icon) {
      case 'lightning':
        return lightningIcon();
    
      case 'linked':
        return linkIcon();
    }
  }
  
  return(
    <>
      <div className="SwItem">
        <div className="SwItem_left">
          {stateIcons(stateIcon)}
          <div className="SwItem_text">
            <div className="SwItem_date">{date}</div>
            <div className="SwItem_station">{station}</div>
          </div>
        </div>
        <div className="SwItem_right">
          <div className="SwItem_price">
            <div className="SwItem_price_img">{priceImg()}</div>
            <div className="SwItem_price_text">{price}</div>
          </div>
          <div className="SwItem_changes">{changes}</div>
        </div>
      </div>
      <div className={underline?"SwItem_divider" : ""}></div>
    </>
  )
}