import Dropdown, { Period, periodOptionsArray, getPeriodText } from "../LVDropdown";
import styles from "./index.module.scss"
import classNames from "classnames";
import * as Icons from "../../../Assets/SvgIconLibrary";
type Props = {
    period: Period
    offset: number
    setPeriod: (period: Period) => void
    resetOffset: () => void
    prevOffset: () => void
    nextOffset: () => void
}
export default function PeriodSelector({ period, offset, setPeriod, resetOffset, prevOffset, nextOffset }: Props) {
    return <div className={styles["section"]}>
        <div className={styles["center"]}>
            <Dropdown<Period>
                setState={(value) => { setPeriod(value); resetOffset() }}
                otherOptions={periodOptionsArray}
                jsx={<div className={classNames(styles["center"], styles["box"])}>
                    <span className={styles["icon_pub"]}>{Icons.Automation()}</span>
                    <span>{getPeriodText(period, offset)}</span>
                </div>}
            />
            <div style={{ display: 'flex', alignItems: 'center', }} className={styles["box"]}>
                <div onClick={() => prevOffset()} >{Icons.arrowLeft()}</div>
                {Icons.verticalLine()}
                <div onClick={() => nextOffset()} >{Icons.arrowRight()}</div>
            </div>
        </div>
    </div>
}