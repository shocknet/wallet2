import moment from "moment";
import { lightningIcon, linkIcon } from "../../Assets/SvgIconLibrary";
import { NotifyItemData } from "../../globalTypes";
import { useIonRouter } from "@ionic/react";

export const NotifyItem: React.FC<NotifyItemData> = ({
  header,
  icon,
  desc,
  date,
  link,
}): JSX.Element => {
  const stateIcons = (icon?: string) => {
    switch (icon) {
      case 'lightning':
        return lightningIcon();
    
      case 'linked':
        return linkIcon();
    }
  }

  const router = useIonRouter();
  
  return(
    <>
      <div className="NotifyItem">
        <div className="NotifyItem_left">
          <div className="NotifyItem_icon">
            {icon}
          </div>
          <div className="NotifyItem_text">
            <div className="NotifyItem_header">
              {header}
              <div className="NotifyItem_date">{moment(date).fromNow()}</div>
            </div>
            <div className="NotifyItem_desc" onClick={()=>{router.push(link)}}>{desc}</div>
          </div>
        </div>
      </div>
      <div className="NotifyItem_divider"></div>
    </>
  )
}