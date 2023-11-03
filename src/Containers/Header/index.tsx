import React, { useContext, useEffect, useState } from "react";

import { UseModal } from "../../Hooks/UseModal";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";

import SWText from "../../Assets/Images/sw_text.png";

import { HeaderProps } from "./types";
import { Ctx } from "../../Context";
import { useIonRouter } from "@ionic/react";
import { MenuList } from "../../Components/Modals/MenuList";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "../../State/Slices/notificationSlice";
import { notification } from "antd";
import { NotificationPlacement } from "antd/es/notification/interface";

export const Header = () => {
  const [badge, setBadge] = useState(false);
  const router = useIonRouter();
  const notifications = useSelector(({notify}) => notify);

  const { isShown, toggle } = UseModal();
  const dispatch = useDispatch();

  const isNopeUp: boolean = window.location.pathname === "/";
  const isLoader: boolean = window.location.pathname === "/loader";
  const isscan: boolean = window.location.pathname === "/scan";
  const isreceive: boolean = window.location.pathname === "/receive";
  const getNotifyBadge = () => {
    if (notifications&&notifications.notifications.length) {
      setBadge(notifications.notifications[notifications.notifications.length-1].date>notifications.checkTime)
    }
  }

  useEffect(() => {
    getNotifyBadge();
  }, [notifications])
  useEffect(() => {
    getNotifyBadge();
    const isBackUp = localStorage.getItem("isBackUp")??"0";
    if (isBackUp == "0") {
      dispatch(addNotification({
        header: 'Reminder',
        icon: '⚠️',
        desc: 'Back up your credentials!',
        date: Date.now(),
        link: '/auth',
      }))
      openNotification("top", "Reminder", "Please back up your credentials!", ()=>{router.push("/auth")});
      localStorage.setItem("isBackUp", "1")
    }
  }, []);

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string, onClick: (() => void) | undefined) => {
    api.info({
      message: header,
      description: text,
      placement,
      onClick: onClick,
    });
  };

  const content = <React.Fragment>
    <div className="Header_modal">
      <div className="Header_modal_close" onClick={() => toggle()}>
          {Icons.MenuBack()}
      </div>
      <div className="Header_modal_content">
        <div className="Header_modal_content_item" onClick={() => {
          router.push("/automation");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.Automation()}
          </div>
          <div className="Header_modal_content_item_text">Automation</div>
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          router.push("/contacts");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.Contacts()}
          </div>
          <div className="Header_modal_content_item_text">Contacts</div>
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          router.push("/prefs");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.Setting()}
          </div>
          <div className="Header_modal_content_item_text">Preferences</div>
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          router.push("/sources");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.SourceIcon()}
          </div>
          <div className="Header_modal_content_item_text">Manage Sources</div>
        </div>
        <div className="Header_modal_content_item">
          <hr />
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          router.push("/sources");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.BuyCryptoIcon()}
          </div>
          <div className="Header_modal_content_item_text">Buy Bitcoin</div>
        </div>
        <div className="Header_modal_content_item" onClick={() => {
          router.push("/sources");
          toggle();
        }}>
          <div className="Header_modal_content_item_img">
            {Icons.HelpAbout()}
          </div>
          <div className="Header_modal_content_item_text">Help/About</div>
        </div>
      </div>
    </div>
  </React.Fragment>;

  return (
    <header className="Header">
      {contextHolder}
      {(isNopeUp || isLoader) ? (
        <React.Fragment>
          <button className="Header_logo_1" onClick={() => router.push("/")}>
            {Icons.Logo()}
          </button>
          <div className="Header_text">
            <img src={SWText} width="330px" alt="" />
          </div>
        </React.Fragment>
      ) : (
        isscan ? (
          <></>
        ) : (
          isreceive ? (
            <React.Fragment>
              <button className="Header_logo_2" onClick={() => router.push("/home")}>
                {Icons.Logo()}
              </button>
              <div onClick={() => { router.push("/home") }} className="Header_menu">
                {Icons.closeIcon()}
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="Header_logo_2" onClick={() => router.push("/home")}>
                  {Icons.Logo()}
              </button>
              <button className="Header_menu" onClick={() => {
                router.push("#");
                toggle();
              }}>
                {Icons.Menu()}
              </button>
              <button className="Header_notify" onClick={() => {
                router.push('/notify')
              }}>
                {Icons.notification()}
                {badge?Icons.oval():''}
              </button>
              <MenuList isShown={isShown} hide={toggle} modalContent={content} headerText="Add Source" />
            </React.Fragment>
          )
        )
      )}
    </header>
  )
}