import React, { useEffect, useState } from 'react';
import * as icons from "../../../Assets/SvgIconLibrary";

interface SendFrom {
  id?: number;
  label?: string;
  pasteField?: string;
  icon?: number;
  balance?: string;
}

type DropDownProps = {
  values: SendFrom[];
  initialValue: SendFrom;
};

const SpendFromDropdown: React.FC<DropDownProps> = ({
  values,
  initialValue,
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

  const arrangeIcon = (value?: number) => {
    switch (value) {
      case 1:
        return icons.mynodeSmall()

      case 2:
        return icons.uncleSmall()

      case 3:
        return icons.lightningSmall()

      case 4:
        return icons.zbdSmall()

      case 5:
        return icons.stackerSmall()
          
      default:
        return icons.zbdSmall()
    }
  }

  const dropdown = () => {
    setDisplay( display == 0 ? 1 : 0 );
    setRotation( rotation == 0 ? 90 : 0 )
  }

  return (
    <>
      <div className={showDropDown ? 'spend_from' : 'spend_from active'}>
        <div className="spend_from_item" key={value.id}>
          <div className="spend_from_item_left">
            <div className="spend_from_item_icon">{arrangeIcon(value.icon)}</div>
            <div className="spend_from_item_input">
              <div>{value.label}</div>
            </div>
          </div>
          <div className="spend_from_item_balance">{value.balance}</div>
        </div>
        <div className="spend_from_dropdown" style={{opacity: display, transition: "0.3s", overflow: "hidden"}}>
          {allValue.map(
            (item: SendFrom, index: number) => {
              return (
                <div className="spend_from_item" key={item.id}>
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
