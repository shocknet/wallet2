import React, { useState } from 'react';
import * as icons from "../../../Assets/SvgIconLibrary";
import { useLightningPubLogo, LIGHTNING_PUB_MARK_HEIGHT } from "@/Assets/Images/lightning-pub";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import { useLiveSourceView } from "@/Hooks/useSourceView";

type DropDownProps = {
  sourceIds: string[];
  selectedSourceId: string;
  onSelect: (sourceId: string) => void;
};

function SpendFromRow({
  sourceId,
  icon,
  onSelect,
}: {
  sourceId: string;
  icon: (value?: string, sourcePub?: string) => React.ReactNode;
  onSelect?: (sourceId: string) => void;
}) {
  const source = useLiveSourceView(sourceId);
  const [sourcePub] = source.sourceId.split("-");

  return (
    <div
      onClick={onSelect ? () => onSelect(source.sourceId) : undefined}
      className="spend_from_item"
    >
      <div className="spend_from_item_left">
        <div className="spend_from_item_icon">{icon(sourcePub)}</div>
        <div className="spend_from_item_input">
          <div style={onSelect ? undefined : { width: "130px" }}>{sourceDisplayName(source)}</div>
        </div>
      </div>
      <div className="spend_from_item_balance">{source.balanceSats}</div>
    </div>
  );
}

const SpendFromDropdown: React.FC<DropDownProps> = ({
  sourceIds,
  selectedSourceId,
  onSelect,
}: DropDownProps): JSX.Element => {
  const [display, setDisplay] = useState(0);
  const [rotation, setRotation] = useState(0);
  const lpMarkSrc = useLightningPubLogo("mark");

  const arrangeIcon = (value?: string, sourcePub?: string) => {
    switch (value) {
      case "0":
        return <React.Fragment>
          <img src={lpMarkSrc} alt="Lightning.pub" style={{ height: LIGHTNING_PUB_MARK_HEIGHT.inline, width: "auto", display: "block" }} />
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
        if (sourcePub) {
          return <React.Fragment>
            <img src={`https://robohash.org/${sourcePub}.png?bgset=bg1`} width="33px" alt='Avatar' style={{ borderRadius: "50%" }} />
          </React.Fragment>
        }
        if (!value?.includes("http")) {
          value = "http://www.google.com/s2/favicons?sz=64&domain=" + value;
        }
        return <React.Fragment>
          <img src={value} width="23px" alt='' style={{ borderRadius: "50%" }} />
        </React.Fragment>
    }
  }

  const dropdown = () => {
    setDisplay(display === 0 ? 1 : 0);
    setRotation(rotation === 0 ? 90 : 0)
  }

  const otherIds = sourceIds.filter((id) => id !== selectedSourceId);

  return (
    <>
      <div className="spend_from active">
        {selectedSourceId
          ? <SpendFromRow sourceId={selectedSourceId} icon={arrangeIcon} />
          : <div></div>
        }
        <div className="spend_from_dropdown" style={{ opacity: display, transition: "0.3s", overflow: "hidden" }}>
          {display === 1 && otherIds.map((id) => (
            <SpendFromRow
              key={id}
              sourceId={id}
              icon={arrangeIcon}
              onSelect={(picked) => {
                onSelect(picked);
                dropdown();
              }}
            />
          ))}
        </div>
      </div>
      <button className="spend_from_toggle" onClick={dropdown} style={{ transform: `rotate(${rotation}deg)`, transition: "0.3s" }}>
        {icons.arrow()}
      </button>
    </>
  );
};

export default SpendFromDropdown;
