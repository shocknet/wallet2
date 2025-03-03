import { IonButton } from "@ionic/react";
import styles from "./styles/index.module.scss";

interface OutlinedButtonProps {
	children: React.ReactNode;
}


const OutlinedButton = ({ children, ...props }: OutlinedButtonProps & React.ComponentProps<typeof IonButton>) => {
	return (
		<IonButton
			{...props}
			className={styles["outlined-button"]}
			fill="outline"

		>
			{children}
		</IonButton>
	);
};

export default OutlinedButton;