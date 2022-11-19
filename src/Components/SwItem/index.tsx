import { SwItemData } from "./types";

export const SwItem: React.FC<SwItemData> = ({
  stateIcon,
  date,
  station,
  changes,
  price,
  priceImg
}): JSX.Element => {
  return(
    <div className="SwItem">
      <div className="SwItem_left">
        <div className={`SwItem_${stateIcon}`}>⚡️</div>
        <div className="SwItem_text">
          <div className="SwItem_date">{date}</div>
          <div className="SwItem_station">{station}</div>
        </div>
      </div>
      <div className="SwItem_right">
        <div className="SwItem_price">
          <div className="SwItem_price_img"><img src={priceImg} alt="" /></div>
          <div className="SwItem_price_text">{price}</div>
        </div>
        <div className="SwItem_changes">{changes}</div>
      </div>
    </div>
  )
}