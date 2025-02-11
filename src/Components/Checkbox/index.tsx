import styles from "./styles/index.module.scss";
import classNames from "classnames";
import { ChangeEvent } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";

interface Props {
  state: boolean;
  setState: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
  inline?: boolean;
}

const Checkbox = ({ state, setState, id, inline }: Props) => {
  const handleCheckboxClick = () => {
    const event = {
      target: {
        checked: !state
      }
    } as ChangeEvent<HTMLInputElement>;
    setState(event)
  }
  return (
    <div style={inline ? { display: "inline-block" } : {}}
    >
      <div
        className={classNames({
          [styles["checkbox"]]: true,
          [styles["checked"]]: state
        })}
        onClick={handleCheckboxClick}
      >
        {state ? Icons.check() : null}
      </div>
      <input
        type="checkbox"
        id={id}
        style={{ display: "none" }}
        checked={state}
        onChange={(e) => setState(e)}
      />
    </div>

  );
};

export default Checkbox;
