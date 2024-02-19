import React, { useCallback, useEffect, useState } from 'react';
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import { PayTo, SpendFrom } from "../../globalTypes";

//It import modal component
import { UseModal } from "../../Hooks/UseModal";

//It import svg icons library
import * as icons from "../../Assets/SvgIconLibrary";
import { questionMark } from '../../Assets/SvgIconLibrary';
import { isAxiosError } from 'axios';

import { useSelector, useDispatch } from '../../State/store'; //import reducer
import { addPaySources, editPaySources, deletePaySources, setPaySources } from '../../State/Slices/paySourcesSlice';
import { addSpendSources, editSpendSources, deleteSpendSources, setSpendSources } from '../../State/Slices/spendSourcesSlice';
import { Modal } from '../../Components/Modals/Modal';
import { Destination, InputClassification, options, parseBitcoinInput } from '../../constants';
import BootstrapSource from "../../Assets/Images/bootstrap_source.jpg";
import Sortable from 'sortablejs';
import { useIonRouter } from '@ionic/react';
import { createLnurlInvoice, createNostrInvoice, handlePayInvoice } from '../../Api/helpers';
import { toggleLoading } from '../../State/Slices/loadingOverlay';
import { removeNotify } from '../../State/Slices/notificationSlice';
import { useLocation } from 'react-router';
import { v4 as uuidv4 } from "uuid";
import { CustomProfilePointer, decodeNprofile } from '../../custom-nip19';

const arrayMove = (arr: string[], oldIndex: number, newIndex: number) => {
  const newArr = arr.map(e => e);
  const item = newArr.splice(oldIndex, 1)[0];
  newArr.splice(newIndex, 0, item);
  return newArr;
}

const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
  notification.info({
    message: header,
    description:
      text,
    placement
  });
};
export const Sources = () => {

  const router = useIonRouter();
  const location = useLocation();

  const [tempParsedWithdraw, setTempParsedWithdraw] = useState<Destination>();
  const [notifySourceId, setNotifySourceId] = useState("");
  const notifications = useSelector(state => state.notify.notifications);

  const processParsedInput = (destination: Destination) => {
    const promptSweep = 
      destination.type === InputClassification.LNURL
      &&
      destination.lnurlType === "withdrawRequest"
      &&
      destination.max && destination.max > 0
      &&
      Object.values(paySources.sources).length > 0;

    if (promptSweep) {
      setTempParsedWithdraw(destination);
      setModalContent("promptSweep");
      toggle();
    } else if (destination.data.includes("nprofile") || destination.type === InputClassification.LNURL || destination.type === InputClassification.LN_ADDRESS) {
      setSourcePasteField(destination.data);
      openAddSourceModal();
    }
  }
  
  useEffect(() => {
    if (location.state) {
      const receivedDestination = location.state as Destination;
      processParsedInput(receivedDestination);
    } else {
      const addressSearch = new URLSearchParams(location.search);
      const data = addressSearch.get("addSource");
      const erroringSourceKey = addressSearch.get("sourceId");
      if (data) {
        parseBitcoinInput(data).then(parsed => {
          processParsedInput(parsed)
        })
      } else if (erroringSourceKey) {
        EditSourceSpend_Modal(erroringSourceKey);
      }
    }
  }, [location]);

  //declaration about reducer
  const dispatch = useDispatch();
  const paySources = useSelector((state) => state.paySource);
  const spendSources = useSelector((state) => state.spendSource);

  const [sourcePasteField, setSourcePasteField] = useState<string>("");
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [optional, setOptional] = useState<string>(options.little);

  const [modalContent, setModalContent] = useState<string>("");

  //This is the state variables what can be used to save sorce id temporarily when edit Source item
  const [editPSourceId, setEditPSourceId] = useState("");
  const [editSSourceId, setEditSSourceId] = useState("");
  const [processingSource, setProcessingSource] = useState(false);
 
  const { isShown, toggle } = UseModal();

  const openAddSourceModal = () => {
    setModalContent("addSource");
    toggle();
  };

  const openEditSourcePay = (key: string) => {
    const source = paySources.sources[key]
    if (source) {
      setEditPSourceId(key);
      setOptional(source.option || '');
      setSourceLabel(source.label || '');
      setModalContent("editSourcepay");
      toggle();
    }
  };

  const EditSourceSpend_Modal = (key: string) => {
    const source = paySources.sources[key];
    if (source) {
      setEditSSourceId(key);
      setOptional(source.option || '');
      setSourceLabel(source.label || '');
      setModalContent("editSourcespend");
      toggle();
    }
  };

  const Notify_Modal = () => {
    setModalContent("notify");
    toggle();
  };

  const notifyAboutDisabledSpendSource = (key: string) => {
    setNotifySourceId(key);
    setModalContent("sourceNotify");
    toggle();
  }

  const switchContent = (value: string) => {
    switch (value) {
      case 'promptSweep':
        return promptSweep
      case "sweepLnurlModal":
        return sweepLnurlModal;
      case 'addSource':
        return contentAddContent

      case 'editSourcepay':
        return contentEditContent

      case 'editSourcespend':
        return contentEditContent

      case 'notify':
        return notifyContent
      case "sourceNotify":
        return disabledSpendSourceInfo

      default:
        return notifyContent
    }
  }

  const addSource = useCallback( async() => {
    toggle();
    
    if (processingSource) {
      return;
    }
    
    if (!sourcePasteField || !optional) {
      openNotification("top", "Error", "Please Write Data Correctly!");
      return;
    }
    // more thorough this way because doing spendSources[sourcePasteField] will not catch pub sources since the keys are npub and not the nprofile
    if (Object.values(spendSources.sources).find(s => s.pasteField === sourcePasteField) || Object.values(paySources.sources).find(s => s.pasteField === sourcePasteField)) {
      openNotification("top", "Error", "Source already exists.");
      return;
    }
    
    setProcessingSource(true);
    dispatch(toggleLoading({ loadingMessage: "Setting up source..." }))
    let parsed: Destination | null = null;
    if (sourcePasteField.startsWith("nprofile")) {
      // nprofile
      let data: CustomProfilePointer | null = null;
      try {
        (data  = decodeNprofile(sourcePasteField));
      } catch (err: any) {
        openNotification("top", "Error", err.message);
        setProcessingSource(false);
        return;
      }


      const resultLnurl = new URL(data.relays[0]);
      const parts = resultLnurl.hostname.split(".");
      const sndleveldomain = parts.slice(-2).join('.');
      const uuid = uuidv4()
      const addedPaySource = {
        id: uuid,
        option: optional,
        icon: sndleveldomain,
        label: resultLnurl.hostname,
        pasteField: sourcePasteField,
      } as PayTo;
      dispatch(addPaySources({
        source: addedPaySource,
        key: data.pubkey
      }))
      const addedSpendSource = {
        id: uuid,
        label: resultLnurl.hostname,
        option: optional,
        icon: sndleveldomain,
        balance: "0",
        pasteField: sourcePasteField,
      } as SpendFrom;
      dispatch(addSpendSources({
        source: addedSpendSource,
        key: data.pubkey
      }));
    } else {
      // not nprofile, now checking for other cases
      
      try {
        parsed = await parseBitcoinInput(sourcePasteField);
      } catch (err: any) {
        if (isAxiosError(err) && err.response) {
          openNotification("top", "Error", err.response.data.reason);
        } else if (err instanceof Error) {
          openNotification("top", "Error", err.message);
        } else {
          console.log("Unknown error occured", err);
        }
        setProcessingSource(false);
        return;
      }
      if (parsed.type === InputClassification.LNURL && parsed.lnurlEndpoint && parsed.max !== undefined) {
        if (parsed.lnurlType === "payRequest") {
          const addedSource = {
            id: uuidv4(),
            option: optional,
            icon: parsed.domainName,
            label: parsed.hostName,
            pasteField: parsed.data,
          } as PayTo;
          dispatch(addPaySources({
            source: addedSource,
            key: parsed.data
          }));
        } else {
          // lnurl-withdraw
          const addedSource = {
            id: uuidv4(),
            label: parsed.hostName,
            option: optional,
            icon: parsed.domainName,
            balance: parsed.max.toString(),
            pasteField: parsed.data,
          } as SpendFrom;
          dispatch(addSpendSources({
            source: addedSource,
            key: parsed.data
          }));
        }
      } else if (parsed.type === InputClassification.LN_ADDRESS) {
        const addedSource = {
          id: uuidv4(),
          option: optional,
          icon: parsed.domainName,
          label: parsed.data,
          pasteField: parsed.data,
        } as PayTo;
        dispatch(addPaySources({
          source: addedSource,
          key: parsed.data
        }));
      } else {
        openNotification("top", "Error", "Input not recognized");
        setProcessingSource(false);
        dispatch(toggleLoading({ loadingMessage: "" }))
        return
      }

    }
    openNotification("top", "Success", `${parsed ? parsed.domainName : "Nprofile"} successfuly added to sources`);
    resetValue();
    dispatch(toggleLoading({ loadingMessage: "" }))
    
    setProcessingSource(false);
  }, [sourcePasteField, dispatch, optional, paySources, spendSources, toggle, processingSource]);

  const editPaySource = () => {
    if (!sourceLabel || !optional) {
      return openNotification("top", "Error", "Please Write Data Correctly!")
    }
    const paySourceToEdit: PayTo = {
      ...paySources.sources[editPSourceId],
      option: optional,
      label: sourceLabel,
    };
    dispatch(editPaySources({
      source: paySourceToEdit,
      key: editPSourceId
    }))
    resetValue();
    toggle();
    
  };

  const editSpendSource = () => {
    if (!sourceLabel || !optional) {
      return openNotification("top", "Error", "Please Write Data Correctly!")
    }
    const spendSourceToEdit: SpendFrom = {
      ...spendSources.sources[editSSourceId],
      option: optional,
      label: sourceLabel
    };

    dispatch(editSpendSources({
      source: spendSourceToEdit,
      key: editSSourceId
    }))
    resetValue();
    toggle();
  };

  const deletePaySource = () => {
    setEditPSourceId("");
    dispatch(deletePaySources(editPSourceId))
    resetValue();
    toggle();
  };

  const deleteSpendSource = () => {
    setEditSSourceId("");
    const associatedNotification = notifications.find(n => n.link === `/sources?sourceId=${editSSourceId}`);
    if (associatedNotification) {
      dispatch(removeNotify(associatedNotification.date));
    }
    dispatch(deleteSpendSources(editSSourceId))
    resetValue();
    toggle();
  };

  const resetValue = () => {
    setOptional(options.little);
    setSourcePasteField("");
    setSourceLabel("");
  }

  const arrangeIcon = (value?: string) => {
    switch (value) {
      case "0":
        return <React.Fragment>
          <img src={BootstrapSource} width="33px" alt='Avatar' style={{ borderRadius: "50%" }} />
        </React.Fragment>
      case "1":
        return icons.mynode()

      case "2":
        return icons.uncle()

      case "3":
        return icons.lightning()

      case "4":
        return icons.zbd()

      case "5":
        return icons.stacker()

      default:
        if (!value?.includes("http")) {
          value = "https://www.google.com/s2/favicons?sz=64&domain=" + value;
        }
        return <React.Fragment>
          <img src={value} width="33px" alt='Avatar' style={{ borderRadius: "50%" }} />
        </React.Fragment>
    }
  }

  const sweepLnurl = useCallback(async () => {
    toggle();
    dispatch(toggleLoading({ loadingMessage: "Sweeping..." }));
    const topPaySource = paySources.sources[paySources.order[0]];
    let invoice = "";
    const isNprofile = topPaySource.pasteField.includes("nprofile");
    if (tempParsedWithdraw && tempParsedWithdraw.max) {
      try {
        if (isNprofile) {
          invoice = await createNostrInvoice(topPaySource.pasteField, tempParsedWithdraw.max);
        } else {
          invoice = await createLnurlInvoice(tempParsedWithdraw.max, await parseBitcoinInput(topPaySource.pasteField));
        }
        await handlePayInvoice(invoice, tempParsedWithdraw!.data);

        
        openNotification("top", "Success", `Withdraw request successfuly sent to ${tempParsedWithdraw.domainName}.`);
        setTimeout(() => {
          router.push("/home");
        }, 1000);
      }
      catch (err) {
        console.log(err)
        if (isAxiosError(err) && err.response) {
          openNotification("top", "Error", err.response.data.reason);
        } else if (err instanceof Error) {
          openNotification("top", "Error", err.message);
        } else {
          console.log("Unknown error occured", err);
        }
      }
    }
    dispatch(toggleLoading({ loadingMessage: "" }));
  }, [dispatch, paySources, tempParsedWithdraw, router, toggle])

  const contentAddContent = <React.Fragment>
    <div className='Sources_modal_header'>Add Source</div>
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
      <div className={`Sources_modal_select_state_column ${optional === options.little ? "active" : ""}`} onClick={() => setOptional(options.little)}>
        <div className="Sources_modal_input">
          <p>🔓</p>
          A little.
        </div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === options.very ? "active" : ""}`} onClick={() => setOptional(options.very)}>
        <div className="Sources_modal_input">
          <p>🫡</p>
          Very well.
        </div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === options.mine ? "active" : ""}`} onClick={() => setOptional(options.mine)}>
        <div className="Sources_modal_input">
          <p>🏠</p>
          It&apos;s my node.
        </div>
      </div>
    </div>
    <div className='Sources_modal_code'>
      <input
        placeholder="Paste an LNURL, Lightning Address, or LP"
        value={sourcePasteField}
        onChange={(e) => setSourcePasteField(e.target.value)}
      />
    </div>
    <div className="Sources_modal_add_btn">
      <button onClick={addSource}>Add</button>
    </div>
    {(Object.values(paySources.sources).filter((e) => e.icon != "0").length == 0 && Object.values(spendSources.sources).filter((e) => e.icon != "0").length == 0) ? (<div className="Sources_modal_add_btn_bottom">
      <p>or</p>
      <button onClick={() => { router.push("/auth") }}>Recover Backup</button>
    </div>) : null}

  </React.Fragment>;

  const contentEditContent = <React.Fragment>
    <div className='Sources_modal_header'>Edit Source</div>
    <div className='Sources_modal_discription'>How well do you trust this node?</div>
    <div className='Sources_modal_select_state'>
      <div className={`Sources_modal_select_state_column ${optional === options.little ? "active" : ""}`} onClick={() => setOptional(options.little)}>
        <div className="Sources_modal_icon">🔓</div>
        <div className="Sources_modal_input">A little.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === options.very ? "active" : ""}`} onClick={() => setOptional(options.very)}>
        <div className="Sources_modal_icon">🫡</div>
        <div className="Sources_modal_input">Very well.</div>
      </div>
      <div className={`Sources_modal_select_state_column ${optional === options.mine ? "active" : ""}`} onClick={() => setOptional(options.mine)}>
        <div className="Sources_modal_icon">🏠</div>
        <div className="Sources_modal_input">It&apos;s my node.</div>
      </div>
    </div>
    <div className='Sources_modal_code'>
      <input
        value={sourceLabel} placeholder="Optional label..."
        onChange={(e) => setSourceLabel(e.target.value)}
      />
    </div>
    <div className="Sources_modal_add_btn">
      <button onClick={modalContent === "editSourcepay" ? deletePaySource : deleteSpendSource}>Delete</button>
      <button onClick={modalContent === "editSourcepay" ? editPaySource : editSpendSource}>Edit</button>
    </div>

  </React.Fragment>;

  const notifyContent = <React.Fragment>
    <div className="Sources_notify">
      <div className="Sources_notify_title">What is this?</div>
      <div className="Sources_notify_textBox">
        Sources are a node or account used by the wallet. Pay To sources generate invoices to receive payments, and Spend From sources will pay invoices.<br /><br />
        If using multiple sources, you may set an order that is used to move balances opportunistically, provide liquidity, or second-attempt network failures.
      </div>
      <button className="Sources_notify_button" onClick={toggle}>OK</button>
    </div>
  </React.Fragment>;

  const disabledSpendSourceInfo = <React.Fragment>
    <div className="Sources_notify">
      <div className="Sources_notify_title">Disabled Spend Source</div>
      <p className="Sources_notify_textBox">
        This spend source is erroring with the following message: {spendSources.sources[notifySourceId]?.disabled}
      </p>
      <button className="Sources_notify_button" onClick={toggle}>OK</button>
    </div>
  </React.Fragment>;

  const promptSweep = <React.Fragment>
    <div className='Sources_modal_header'>LNURL Withdraw</div>
    <div className='Sources_modal_discription'>Do you want to add this lnurl-withdraw as a spend from source or sweep it to your pay to source?</div>
    <div className="Sources_modal_add_btn">
      <button onClick={() => { addSource() }}>Add as source</button>
      <button
        onClick={() => {
          setModalContent("sweepLnurlModal");
        }
      }>Sweep</button>
    </div>

  </React.Fragment>;

  const sweepLnurlModal = <React.Fragment>
    <div className='Sources_modal_header'>Sweep LNURL Withdraw</div>
    <div className='Sources_modal_discription'>Sweeping {tempParsedWithdraw?.max} Sats from {tempParsedWithdraw?.domainName} to {paySources.sources[paySources.order[0]]?.label}.</div>
    <div className="Sources_modal_add_btn">
      <button onClick={toggle}>Cancel</button>
      <button
        onClick={sweepLnurl}>Sweep</button>
    </div>

  </React.Fragment>;

  

  useEffect(() => {
    const list = document.getElementById('spend-list');
    let sortable: Sortable | null = null;
    if (list) {
      sortable = new Sortable(list, {
        onEnd: function (event) {
          const { oldIndex, newIndex } = event;
          const reorderedItems = arrayMove(spendSources.order, oldIndex as number, newIndex as number);
          dispatch(setSpendSources(reorderedItems))
        },
        animation: 150,
        chosenClass: 'sortable-chosen-class',
        dragClass: "sortable-drag-class",
        ghostClass: "sortable-ghost-class",
        touchStartThreshold: 3.,
        swapThreshold: 5,
        fallbackTolerance: 4,
        delay: 300,

      });
    }
    return () => {
      if (sortable) {
        sortable.destroy();
      }
    }
  }, [spendSources, dispatch]);

  useEffect(() => {
    const list = document.getElementById('pay-list');
    let sortable: Sortable | null = null;
    if (list) {
      sortable = new Sortable(list, {
        onEnd: function (event) {
          const { oldIndex, newIndex } = event;
          const reorderedItems = arrayMove(paySources.order, oldIndex as number, newIndex as number);
          dispatch(setPaySources(reorderedItems))
        },
        animation: 150,
        chosenClass: 'sortable-chosen-class',
        dragClass: "sortable-drag-class",
        ghostClass: "sortable-ghost-class",
        touchStartThreshold: 3.,
        swapThreshold: 5,
        fallbackTolerance: 4,
        delay: 300,
      });
    }
    return () => {
      if (sortable) {
        sortable.destroy();
      }
    }
  }, [paySources, dispatch]);

  return (
    <div className="Sources">
      <div className="Sources_title">Manage Sources</div>
      <div>
        <div className="Sources_pay_content">
          <div className="Sources_content_title">
            Pay To
            <button className="Sources_question_mark" onClick={Notify_Modal}>{questionMark()}</button>
          </div>
          <ul id='pay-list' className="Sources_list_box">
            {paySources.order.map((key) => {
              const item = paySources.sources[key];
              return (
                <li className="Sources_item" key={item.id}>
                  <div className="Sources_item_left">
                    <div className="Sources_item_icon">{arrangeIcon(item.icon)}</div>
                    <div className="Sources_item_input">
                      <div>{item.label}</div>
                    </div>
                  </div>
                  <div className="Sources_item_right">
                    <button className="Sources_item_close" onClick={() => { openEditSourcePay(item.id) }}>
                      {icons.EditSource()}
                    </button>
                    <button className="Sources_item_menu">
                      {icons.SourceItemMenu()}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="Sources_receive_content">
          <div className="Sources_content_title">
            Spend From
            <button className="Sources_question_mark" onClick={Notify_Modal}>{questionMark()}</button>
          </div>
          <ul id='spend-list' className="Sources_list_box">
            {spendSources.order.map((key) => {
              const item = spendSources.sources[key];
              return (
                <li className="Sources_item" key={item.id}>
                  <div className="Sources_item_left">
                    <div className="Sources_item_icon">{arrangeIcon(item.icon)}</div>
                    <div className="Sources_item_input">
                      <div>{item.label}</div>
                    </div>
                    {
                      item.disabled
                      &&
                      <span className="Sources_item_disabled" onClick={() => notifyAboutDisabledSpendSource(item.id)}>Disabled {questionMark()}</span>
                    }
                  </div>
                  <div className="Sources_item_balance">{item.balance}</div>
                  <div className="Sources_item_right">
                    <button className="Sources_item_close" onTouchStart={() => { EditSourceSpend_Modal(item.id) }} onClick={() => { EditSourceSpend_Modal(item.id) }}>
                      {/* <img src={EditSource} width="15px" alt="" /> */}
                      {icons.EditSource()}
                    </button>
                    <button className="Sources_item_menu">
                      {icons.SourceItemMenu()}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <div className="Sources_add_btn">
        <button onClick={openAddSourceModal}>{icons.plusIcon()}ADD</button>
      </div>
      <Modal isShown={isShown} hide={toggle} modalContent={switchContent(modalContent)} headerText={''} />
    </div>
  )
}
