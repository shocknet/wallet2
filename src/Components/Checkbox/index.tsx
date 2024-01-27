import styles from "./styles/index.module.scss";
import classNames from "classnames";
import { ChangeEvent } from "react";
import * as Icons from "../../Assets/SvgIconLibrary";

interface Props {
  state: boolean;
  setState: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
}

const Checkbox = ({ state, setState, id }: Props) => {
  return (
    <div
    >
      <div className={classNames({
        [styles["checkbox"]]: true,
        [styles["checked"]]: state
      })} >
        { state ? Icons.check() : null }
      </div>
      <input
        type="checkbox"
        id={id}
        style={{display: "none"}}
        checked={state}
        onChange={(e) => setState(e)}
      />
    </div>
    
  );
};

export default Checkbox;
