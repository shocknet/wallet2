import { IonText } from "@ionic/react";
import cn from "clsx";

const SectionDivider = ({ title, className }: { title: string, className?: string }) => (
	<div className={cn("flex items-center w-full", className)}>
		<div className="bg-[var(--app-text-secondary)]  flex-1 h-px  opacity-50"></div>
		<IonText className="text-secondary px-4 text-base tracking-wider">{title}</IonText>
		<div className="bg-[var(--app-text-secondary)] flex-1 h-px  opacity-50"></div>
	</div >
);

export default SectionDivider;
