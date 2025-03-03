import { IonButton } from "@ionic/react";
import styles from "./styles/index.module.scss";

interface GradientButtonProps {
	children: React.ReactNode;
}


const GradientButton = ({ children, ...props }: GradientButtonProps & React.ComponentProps<typeof IonButton>) => {
	return (
		<IonButton
			{...props}
			className={styles["button"]}
			fill="clear"
			style={{
				'--gradient-start': '#29ABE2',
				'--gradient-end': '#B0B0B0',
				'--border-width': '2px'
			}}
		>
			{children}
		</IonButton>
	);
};

export default GradientButton;