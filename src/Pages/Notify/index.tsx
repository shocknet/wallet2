import React, { ChangeEvent, useEffect, useState } from 'react';
import { PageProps } from "../../globalTypes";

import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter } from '@ionic/react';
import { saveAs } from 'file-saver';
import { Buffer } from 'buffer';
import { notification } from 'antd';
import { NotificationPlacement } from 'antd/es/notification/interface';
import { UseModal } from '../../Hooks/UseModal';
import { Modal } from '../../Components/Modals/Modal';
import { AES, enc } from 'crypto-js';

export const Notify = () => {
  useEffect(()=>{
  });

  return (
    <div className='Notify_container'>
      <div className="Notify">
        <div className="Notify_header_text">Notifications</div>
      </div>
    </div>
  )
}