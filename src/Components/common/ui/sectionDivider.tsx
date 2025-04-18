import { IonText } from "@ionic/react";

const divideLineStyle = {
	flex: 1,
	height: "1px",
	background: "var(--ion-color-medium-shade)",
	opacity: 0.5
}

const SectionDivider = ({ title }: { title: string }) => (
	<div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", width: "100%" }}>
		<div style={divideLineStyle}></div>
		<IonText style={{ padding: "0 1rem", color: "var(--ion-color-medium)", fontSize: "1.1rem", letterSpacing: "1px" }}>{title}</IonText>
		<div style={divideLineStyle}></div>
	</div >
);

export default SectionDivider;