import { motion, AnimatePresence } from "framer-motion";
import styles from "./styles/index.module.scss";
import classNames from "classnames";
import { useRef, useState } from "react";
import { Period } from "../../../Pages/Metrics";
import useClickOutside from "../../../Hooks/useClickOutside";
import { Interval } from "../../../Pages/Automation/newSubModal";

interface Props<T> {
	setState: (data: T) => void;
	otherOptions: T[];
	jsx: React.ReactNode;
}

const Dropdown = <T extends "number" | "string" | Period | Interval>({ setState, jsx, otherOptions }: Props<T>) => {
	const [expand, setExpand] = useState(false);
	const dropDownRef = useRef<HTMLDivElement>(null);
	useClickOutside([dropDownRef], () => setExpand(false));

	return (
		<div className={styles["sort-order"]}>
			<div
				ref={dropDownRef}
				onClick={() => setExpand(!expand)}
				className={classNames({
					[styles["dropdown"]]: true,
					[styles["expanded"]]: expand,
				})}
			>
				{jsx}
				{expand && (
					<AnimatePresence>
						<motion.div
							className={styles["options"]}
							initial={{ top: "-100%" }}
							animate={{ top: "100%" }}
							exit={{ top: "-100%" }}
						>
							{otherOptions.map((i) => (
								<div
									className={styles["option"]}
									key={i}
									onClick={() => setState(i)}
								>
									{i}
								</div>
							))}
						</motion.div>
					</AnimatePresence>
				)}
			</div>
		</div>
	)
}

export default Dropdown;