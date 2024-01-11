import moment from "moment";
import { NotifyItemData } from "../../globalTypes";
import { useIonRouter } from "@ionic/react";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useDispatch } from "../../State/store";
import { removeNotify } from '../../State/Slices/notificationSlice';

export const NotifyItem = ({
  header,
  icon,
  desc,
  date,
  link,
}: NotifyItemData): JSX.Element => {

  const dispatch = useDispatch();
  const router = useIonRouter();

  return (
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
          <div className="NotifyItem_desc" onClick={() => { router.push(link) }}>{desc}</div>
        </div>
      </div>
      <div className="NotifyItem_close" onClick={()=>{dispatch(removeNotify(date))}}>
        {Icons.deleteNotify()}
      </div>
    </div>
  )
}