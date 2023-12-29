import * as Icons from "../../Assets/SvgIconLibrary";
import { useSelector } from "../../State/store";
import styles from "./index.module.scss";


const LoadingOverlay = () => {
	const { loadingMessage }  = useSelector(state => state.loadingOverlay);

	if (!loadingMessage) return null;
	return (
		<div className={styles["loading-container"]}>
			<div className={styles["loading-box"]}>
				{Icons.Animation()}
				<p>{loadingMessage}</p>
			</div>
		</div>
	)
}

export default LoadingOverlay;