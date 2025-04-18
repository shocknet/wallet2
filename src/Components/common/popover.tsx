import { IonContent, IonPopover } from "@ionic/react";

interface Props {
	id: string;
	text: string;
	triggerAction?: "click" | "hover" | "context-menu";
}

const Popover = ({ id, text, triggerAction = "click" }: Props) => (
	<IonPopover style={{ "--background": "var(--ion-color-secondary)" }} reference="trigger" mode="ios" trigger={id} triggerAction={triggerAction}>
		<IonContent className="ion-padding">{text}</IonContent>
	</IonPopover>

);

export default Popover;