import { IonText } from "@ionic/react";

const SectionDivider = ({ title }: { title: string }) => (
	<div className="flex items-center w-full">
		<div className="bg-[var(--app-text-secondary)]  flex-1 h-px  opacity-50"></div>
		<IonText className="text-secondary px-4 text-base tracking-wider">{title}</IonText>
		<div className="bg-[var(--app-text-secondary)] flex-1 h-px  opacity-50"></div>
	</div >
);

export default SectionDivider;
