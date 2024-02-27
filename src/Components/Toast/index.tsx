import styles from "./styles/index.module.scss";

interface Props {
	title: string;
	message: string;
}

const Toast = ({ title, message } : Props) => {
	return (
		<div className={styles["toast-container"]}>
			<span className={styles["title"]}>
				{title}
			</span>
			<span className={styles["message"]}>
				{message}
			</span>
		</div>
	)
}

export default Toast;