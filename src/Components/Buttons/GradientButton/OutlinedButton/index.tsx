import { IonButton } from "@ionic/react";
import styles from "./styles/index.module.scss";
import classNames from "classnames";

interface OutlinedButtonProps {
	children: React.ReactNode;
}


const OutlinedButton = ({ children, ...props }: OutlinedButtonProps & React.ComponentProps<typeof IonButton>) => {
	return (
		<IonButton
			{...props}
			className={classNames(styles["outlined-button"], props.className)}
			fill="outline"

		>
			{children}
		</IonButton>
	);
};

export default OutlinedButton;
