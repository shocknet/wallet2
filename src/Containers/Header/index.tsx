import React, { useEffect, useMemo, useState } from "react";

import { UseModal } from "../../Hooks/UseModal";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import SWText from "../../Assets/Images/sw_text.png";
import { useIonRouter } from "@ionic/react";
import { MenuList } from "../../Components/Modals/MenuList";
import { useSelector } from "../../State/store";
import { Modal } from "../../Components/Modals/Modal";
let logs: string[] = []
const saveLog = (...args: any[]) => {
  const line = args.map(m => {
    if (typeof m === 'object') {
      try {
        return JSON.stringify(m)
      } catch (e) {
        return "[object]"
      }
    } else {
      return m
    }
  }).join(" ")
  logs.push(line)
}
export const Header = () => {
  const [badge, setBadge] = useState(false);
  const router = useIonRouter();
  const notifications = useSelector(({ notify }) => notify);
  const debugMode = useSelector(({ prefs }) => prefs.debugMode);

  const { isShown, toggle } = UseModal();
  const { isShown: isDebugShown, toggle: toggleDebugShown } = UseModal();

  const isNopeUp: boolean = router.routeInfo.pathname === "/";
  router.routeInfo;
  const isLoader: boolean = router.routeInfo.pathname === "/loader";
  const isscan: boolean = router.routeInfo.pathname === "/scan";
  const isreceive: boolean = router.routeInfo.pathname === "/receive";

  const getNotifyBadge = () => {
    if (notifications && notifications.notifications.length) {
      setBadge(notifications.notifications[notifications.notifications.length - 1].date > notifications.checkTime)
    }
  }
  useEffect(() => {
    if (!debugMode) {
      logs = []
      return
    }
    const { log, warn, error } = console
    const newConsole = {
      log: (...args: any[]) => {
        saveLog(...args)
        log(...args)
      },
      warn: (...args: any[]) => {
        saveLog(...args)
        warn(...args)
      },
      error: (...args: any[]) => {
        saveLog(...args)
        error(...args)
      },
    }
    console.log = newConsole.log
    console.warn = newConsole.warn
    console.error = newConsole.error
  }, [debugMode])

  const debugLines = useMemo(() => {
    if (!isDebugShown) {
      return <></>
    }
    const lines = logs.map((log, i) => <p key={i}>{log}</p>)
    return <>{lines}</>

  }, [isDebugShown])

  useEffect(() => {
    getNotifyBadge();
  }, [notifications])
  useEffect(() => {
    getNotifyBadge();
  }, []);

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
          if (debugMode) {
            toggleDebugShown()
          } else {
            window.open('https://docs.shock.network/', '_blank');
            toggle();
          }
        }}>
          <div className="Header_modal_content_item_img" onClick={() => {
            window.location.href ='https://docs.shock.network/';
          }}>
            {Icons.HelpAbout()}
          </div>
          <div className="Header_modal_content_item_text">Help/About</div>
        </div>
      </div>
    </div>
  </React.Fragment>;

  return (
    <div className="Header">
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
                {badge ? Icons.oval() : ''}
              </button>
              <MenuList isShown={isShown} hide={toggle} modalContent={content} headerText="Add Source" />
            </React.Fragment>
          )
        )
      )}
      <Modal isShown={isDebugShown} headerText="debug" hide={() => toggleDebugShown()} modalContent={debugLines} />
    </div>
  )
}