import React, { ChangeEvent, useEffect, useState } from 'react';
import { NotifyItemData, PageProps } from "../../globalTypes";

import { useSelector, useDispatch } from 'react-redux';
import { NotifyItem } from '../../Components/NotifyItem';
import { updateCheckTime } from '../../State/Slices/notificationSlice';

export const Notify = () => {
  const dispatch = useDispatch();
  useEffect(()=>{
    dispatch(updateCheckTime(Date.now()))
  }, []);

  const notifications = useSelector(({notify}) => notify);

  const notifyItem = notifications.notifications.map((o: NotifyItemData, i: number): JSX.Element => <NotifyItem
    header={o.header}
    icon={o.icon}
    desc={o.desc}
    date={o.date}
    key={i}
    link={o.link}  />)

  return (
    <div className='Notify_container'>
      <div className="Notify">
        <div className="Notify_header_text">Notifications</div>
        <div>
          {notifyItem}
        </div>
      </div>
    </div>
  )
}