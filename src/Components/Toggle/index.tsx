import styles from "./styles/index.module.scss";
import classNames from "classnames";
import React, { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { LayoutGroup, motion } from "framer-motion";
import * as Icons from "../../Assets/SvgIconLibrary";

interface Props {
  value?: boolean;
  onCheck?: (checked: boolean) => void;
}

const Toggle: React.FC<Props> = ({ onCheck, value }) => {
  const id = useMemo(() => uuidv4(), []);

  const toggleCheck = useCallback(() => {
    if (onCheck) {
      onCheck(!value);
    }
  }, [onCheck, value]);

  return (
    <div
      className={classNames({
        [styles.toggle]: true,
        [styles.checked]: value
      })}
      onClick={toggleCheck}
    >
      <LayoutGroup>
        {!value && (
          <motion.div
            className={classNames(styles.indicator, styles.indicatorOff)}
            layoutId={id + "toggle"}
            layoutScroll
          />
        )}
        {value && (
          <motion.div
            className={classNames(styles.indicator, styles.indicatorOn)}
            layoutId={id + "toggle"}
            layoutScroll
          />
        )}
        <div
          className={classNames(styles.backIcon)}
        >
          {Icons.switchToggle()}
        </div>
      </LayoutGroup>
    </div>
  );
};
export default Toggle;
