import { IonLabel, IonList, IonListHeader } from "@ionic/react";
import { ComponentProps, ReactNode } from "react";

interface Props extends ComponentProps<typeof IonList> {
	listHeader: ReactNode;
}

const CardishList = ({
	listHeader,
	className,
	children,
	...listProps
}: Props) => (
	<IonList
		className={className}
		lines="none"
		style={{ borderRadius: "12px", marginTop: "0.5rem" }}
		{...listProps}
	>
		<IonListHeader className="text-medium font-semibold text-base" lines="full">
			<IonLabel >{listHeader}</IonLabel>
		</IonListHeader>
		{children}
	</IonList>
);

export default CardishList;
