import { toast } from "react-toastify";
import * as Icons from "../../Assets/SvgIconLibrary";
import { Clipboard } from "@capacitor/clipboard";
import React, { useEffect, useState } from "react";
import BootstrapSource from "../../Assets/Images/bootstrap_source.jpg";
import { useSelector, useDispatch, selectEnabledSpends } from '../../State/store';
import { SpendFrom } from "../../globalTypes";

type OfferItemType = {
  title: string;
  value: string;
  type: string;
};

export const Offers = () => {

  const enabledSpendSources = useSelector(selectEnabledSpends);
  console.log(enabledSpendSources)

  const [isEdit, setIsEdit] = useState<boolean>(false);

  const [showDropDown, setShowDropDown] = useState<boolean>(false);
  const [allValue, setAllValue] = useState<SpendFrom[]>(enabledSpendSources);

  const [display, setDisplay] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [value, setValue] = useState<SpendFrom>(enabledSpendSources[0]);
  const [remainValues, setRemailValues] = useState<SpendFrom[]>([]);

  const [isConnect, setIsConnect] = useState<boolean>(true);
  const [displayData, setDisplayData] = useState<SpendFrom>();
  const [offerValue, setOfferValue] = useState<string>("");

  useEffect(() => {
    setShowDropDown(showDropDown);
  }, [showDropDown]);

  useEffect(() => {
    setDisplayData(value)
    setOfferValue(value.pasteField)
  }, [value]);

  const dropdown = () => {
    const remainValues = allValue.filter((e) => e.label !== value.label);
    setRemailValues(remainValues);
    setDisplay(display === 0 ? 1 : 0);
    setRotation(rotation === 0 ? 90 : 0);
  };

  const arrangeIcon = (value?: string, sourcePub?: string) => {
    console.log(value, sourcePub)
    switch (value) {
      case "0":
        return (
          <React.Fragment>
            <img
              src={BootstrapSource}
              width="23px"
              alt="Avatar"
              style={{ borderRadius: "50%" }}
            />
          </React.Fragment>
        );
      case "1":
        return Icons.mynodeSmall();

      case "2":
        return Icons.uncleSmall();

      case "3":
        return Icons.lightningSmall();

      case "4":
        return Icons.zbdSmall();

      case "5":
        return Icons.stackerSmall();

      default:
        if (sourcePub) {
          return (
            <React.Fragment>
              <img
                src={`https://robohash.org/${sourcePub}.png?bgset=bg1`}
                width="23px"
                alt="Avatar"
                style={{ borderRadius: "50%" }}
              />
            </React.Fragment>
          );
        }
        if (!value?.includes("http")) {
          value = "http://www.google.com/s2/favicons?sz=64&domain=" + value;
        }
        return (
          <React.Fragment>
            <img
              src={value}
              width="23px"
              alt=""
              style={{ borderRadius: "50%" }}
            />
          </React.Fragment>
        );
    }
  };

  const selectOption = (id: SpendFrom) => {
    dropdown();
    setValue(id);
  };

  const CopyToClipboard = async (copyText: string) => {
    let clipbaordStr = "";
    clipbaordStr = copyText;
    await Clipboard.write({
      string: clipbaordStr,
    });
    toast.success("Copied to clipboard");
  };

  const changeOfferHandle = (data : string) => {
    setOfferValue(data)
  }

  return (
    <div className="Offers_container">
      <div className="Offers">
        <div className="Offers_header_text">Static Payment Offers</div>
        {isConnect ? (
          <>
            <div className="Offers_item" onClick={dropdown}>
              <div className="selected_item">
                {value ? (
                  <div className="item" key={value.label}>
                    {arrangeIcon(value.icon, value.pubSource ? value.id.split("-")[0] : undefined)}
                    <div className="Offers_from_value">{value.label}</div>
                  </div>
                ) : (
                  <div></div>
                )}
                <div
                  className="offers_dropdown"
                  style={{
                    opacity: display,
                    transition: "0.3s",
                    overflow: "hidden",
                  }}
                >
                  {display === 1 &&
                    remainValues.map((item: SpendFrom) => {
                      return (
                        <div
                          onClick={() => {
                            selectOption(item);
                          }}
                          className="item"
                          key={item.label}
                        >
                          {arrangeIcon(item.icon, item.pubSource ? item.id.split("-")[0] : undefined)}
                          <div className="Offers_from_value">{item.label}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div
                className="RightIcon"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: "0.3s",
                }}
              >
                {Icons.arrow()}
              </div>
            </div>
            {displayData &&
                (<div className="Offers_source">
                  <div className="source_header">
                    <div className="title">Defulat Offer</div>
                    <div
                      className="edit_icon"
                      onClick={() => {
                        setIsEdit(!isEdit)
                      }}
                    >
                      {Icons.pencilIcons()}
                    </div>
                  </div>
                  {!isEdit ? (
                    <div className="source_data">{offerValue}</div>
                  ) : (
                    <div className="edit_source">
                      <input
                        value={offerValue}
                        type="text"
                        onChange={(e) => {
                          changeOfferHandle(e.target.value)
                        }}
                      />
                    </div>
                  )}
                  <div className="source_footer">
                    <div className="title">Spontaneous Payments</div>
                    <div
                      className="CopyIcon"
                      onClick={() => {
                        CopyToClipboard(offerValue);
                      }}
                    >
                      {Icons.combindIcon()}
                    </div>
                  </div>
                </div>
              )
            }
          </>
        ) : (
          <div className="Offers_connect_state">
            Not Connected
          </div>
        )}
      </div>
    </div>
  );
};
