import { toast } from "react-toastify";
import * as Icons from "../../Assets/SvgIconLibrary";
import { Clipboard } from "@capacitor/clipboard";
import React, { useEffect, useState } from "react";
import BootstrapSource from "../../Assets/Images/bootstrap_source.jpg";

const DummyData = [
  {
    type: "Bootstrap Node",
    title: "Default Offers",
    value:
      "noffers1qqswxpkytms2030sprfmhxue69uhhxarjvee8jtnndphkx6ewdejhgam0wf4sx3je57:f08273120169c027e1740c641d3a42b4c6a0776ead7d8ee551e8af61b2495e4e",
  },
];

type OfferItemType = {
  title: string;
  value: string;
  type: string;
};

export const Offers = () => {
  const [isEdit, setIsEdit] = useState<number | null>(null);
  const [offers, setOffers] = useState<OfferItemType[]>(DummyData);
  const [editData, setEditData] = useState<string>("");

  const [showDropDown, setShowDropDown] = useState<boolean>(false);
  const [allValue, setAllValue] = useState([
    "Bootstrap Node",
    "Source",
    "Data",
  ]);
  const [display, setDisplay] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [value, setValue] = useState("Bootstrap Node");
  const [remainValues, setRemailValues] = useState<string[]>([]);

  const [isConnect, setIsConnect] = useState<boolean>(true);
  const [displayData, setDisplayData] = useState<OfferItemType[]>([]);

  useEffect(() => {
    setShowDropDown(showDropDown);
  }, [showDropDown]);

  useEffect(() => {
    setDisplayData(offers.filter((item) => item.type == value));
  }, [value]);

  const dropdown = () => {
    const remainValues = allValue.filter((e) => e !== value);
    setRemailValues(remainValues);
    setDisplay(display === 0 ? 1 : 0);
    setRotation(rotation === 0 ? 90 : 0);
  };

  const arrangeIcon = (value?: string, sourcePub?: string) => {
    switch (value) {
      case "Bootstrap Node":
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
      default:
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

  const selectOption = (id: string) => {
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

  return (
    <div className="Offers_container">
      <div className="Offers">
        <div className="Offers_header_text">Static Payment Offers</div>
        {isConnect ? (
          <>
            {/* <div className="Offers_item" onClick={dropdown}> */}
            <div className="Offers_item">
              <div className="selected_item">
                {value ? (
                  <div className="item" key={value}>
                    {arrangeIcon(value)}
                    <div className="Offers_from_value">{value}</div>
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
                    remainValues.map((item: string) => {
                      return (
                        <div
                          onClick={() => {
                            selectOption(item);
                          }}
                          className="item"
                          key={item}
                        >
                          {arrangeIcon(item)}
                          <div className="Offers_from_value">{item}</div>
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
            {displayData.map((item, index) => {
              return (
                <div className="Offers_source" key={index}>
                  <div className="source_header">
                    <div className="title">{item.title}</div>
                    <div
                      className="edit_icon"
                      onClick={() => {
                        if (isEdit == index) {
                          setIsEdit(null);
                          item.value = editData;
                        } else {
                          setIsEdit(index);
                          setEditData(item.value);
                        }
                      }}
                    >
                      {Icons.pencilIcons()}
                    </div>
                  </div>
                  {isEdit !== index ? (
                    <div className="source_data">{item.value}</div>
                  ) : (
                    <div className="edit_source">
                      <input
                        value={editData}
                        type="text"
                        onChange={(e) => {
                          setEditData(e.target.value);
                        }}
                      />
                    </div>
                  )}
                  <div className="source_footer">
                    <div className="title">Spontaneous Payments</div>
                    <div
                      className="CopyIcon"
                      onClick={() => {
                        CopyToClipboard(item.value);
                      }}
                    >
                      {Icons.combindIcon()}
                    </div>
                  </div>
                </div>
              );
            })}
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
