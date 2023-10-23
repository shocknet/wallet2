import React, { useEffect, useState } from 'react';
import * as icons from "../../../Assets/SvgIconLibrary";
import { SpendFrom } from '../../../globalTypes';
import BootstrapSource from "../../../Assets/Images/bootstrap_source.jpg";

type DropDownProps = {
  values: SpendFrom[];
  initialValue: SpendFrom;
  callback: Function;
};

const SpendFromDropdown: React.FC<DropDownProps> = ({
  values,
  initialValue,
  callback,
}: DropDownProps): JSX.Element => {
  const [showDropDown, setShowDropDown] = useState<boolean>(false);
  const [value, setValue] = useState(initialValue);
  const [allValue, setAllValue] = useState(values);
  const [display, setDisplay] = useState(0);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setShowDropDown(showDropDown);
    const box = allValue.filter((e) => e.id !== value.id );
    setAllValue(box);
  }, [showDropDown]);

  const arrangeIcon = (value?: string) => {
    switch (value) {
      case "0":
        return <React.Fragment>
          <img src = {BootstrapSource} width="23px" alt='Avatar' style={{borderRadius: "50%"}}/>
        </React.Fragment>
      case "1":
        return icons.mynodeSmall()

      case "2":
        return icons.uncleSmall()

      case "3":
        return icons.lightningSmall()

      case "4":
        return icons.zbdSmall()

      case "5":
        return icons.stackerSmall()
          
      default:
        if (!value?.includes("http")) {
          value = "http://www.google.com/s2/favicons?domain="+value;
        }
        return <React.Fragment>
          <img src = {value} width="23px" alt='' style={{borderRadius: "50%"}}/>
        </React.Fragment>
    }
  }

  const dropdown = () => {
    setDisplay( display === 0 ? 1 : 0 );
    setRotation( rotation === 0 ? 90 : 0 )
  }

  const selectOption = (id?: number) => {
    const selected = values.filter((e) => e.id === id );
    setValue(selected[0]);
    const remainValues = values.filter((e) => e.id !== id );
    setAllValue(remainValues);
    dropdown();
    callback(selected[0])
  }

  return (
    <>
      <div className={showDropDown ? 'spend_from' : 'spend_from active'}>
        {
          value?
            (<div className="spend_from_item" key={value.id}>
              <div className="spend_from_item_left">
                <div className="spend_from_item_icon">{arrangeIcon(value.icon)}</div>
                <div className="spend_from_item_input">
                  <div>{value.label}</div>
                </div>
              </div>
              <div className="spend_from_item_balance">{value.balance}</div>
            </div>)
          :
            <div>
            </div>
        }
        <div className="spend_from_dropdown" style={{opacity: display, transition: "0.3s", overflow: "hidden"}}>
          {display === 1 && allValue.map(
            (item: SpendFrom, index: number) => {
              return (
                <div onClick={() => {selectOption(item.id)}} className="spend_from_item" key={item.id}>
                  <div className="spend_from_item_left">
                    <div className="spend_from_item_icon">{arrangeIcon(item.icon)}</div>
                    <div className="spend_from_item_input">
                      <div>{item.label}</div>
                    </div>
                  </div>
                  <div className="spend_from_item_balance">{item.balance}</div>
                </div>
              );
            }
          )}
        </div>
      </div>
      <button className="spend_from_toggle" onClick={dropdown} style={{transform: `rotate(${rotation}deg)`, transition: "0.3s"}}>
        {icons.arrow()}
      </button>
    </>
  );
};

export default SpendFromDropdown;
