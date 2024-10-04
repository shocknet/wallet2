import classNames from "classnames";
import styles from "./styles/index.module.scss";
import { ReactNode } from "react";
import { Modal } from "../Modal";

export enum ActionType {
	DANGER = "danger",
	NORMAL = "normal"
}
interface Props {
	descriptionText?: string;
	action: () => void;
	title: string;
	actionType: ActionType;
	closeModal: () => void;
	actionText: string;
	jsx?: ReactNode;
	blur?: boolean;
}
export default function PromptForActionModal({ descriptionText, action, title, actionType, closeModal, actionText, blur, jsx }: Props) {

	const handleConfirm = () => {
		action();
		closeModal();
	}

	const modalContent = (
		<div className={styles["container"]}>
			<div className={styles["modal-header"]}>
				{title}
			</div>
			<div className={styles["content-container"]}>
				<div className={styles["description"]}>
					{descriptionText}
					{jsx || null}
				</div>
				<div className={styles["action-buttons"]}>
					<div className={classNames(styles["button"], styles["cancel-button"])} onClick={() => closeModal()}>
						Close
					</div>
					<div
						className={classNames({
							[styles["button"]]: true,
							[styles["danger"]]: actionType === ActionType.DANGER,
							[styles["normal"]]: actionType === ActionType.NORMAL
						})}
						onClick={() => handleConfirm()}
					>
						{actionText}
					</div>
				</div>
			</div>
		</div>
	)

	return <Modal isShown={true} hide={closeModal} modalContent={modalContent} headerText={''} />
}