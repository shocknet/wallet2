import {
	IonButton,
	IonModal,
	IonToolbar,
	IonList,
	IonItem,
	IonLabel,
	IonIcon,
	IonFooter,
	IonButtons
} from '@ionic/react';
import { caretDownSharp, checkmarkCircleOutline } from 'ionicons/icons';
import { useState } from 'react';
import "./styles/index.css";

interface GenericSelectProps<T> {
	items: T[];
	selectedItem?: T;
	onSelect: (item: T) => void;
	renderItem: (item: T) => React.ReactNode;
	renderSelected?: (item: T) => React.ReactNode;
	getIndex: (item: T) => string;
	label?: string;
	title?: string;
	subTitle?: string;
	placeholder?: string;
	className?: string;
	ariaLabel?: string;
	disabled?: boolean;
}

export function CustomSelect<T>({
	items,
	selectedItem,
	onSelect,
	renderItem,
	renderSelected,
	subTitle,
	title,
	label,
	getIndex,
	placeholder = 'Select...',
}: GenericSelectProps<T>) {
	const [isOpen, setIsOpen] = useState(false);

	const handleSelect = (item: T) => {
		onSelect(item);
		setIsOpen(false);
	};

	return (
		<div className="w-full">

			{/* Select looking input to show the selected value and also trigger the select modal */}
			<IonItem
				lines="none"
				button
				detail
				detailIcon={caretDownSharp}
				onClick={() => setIsOpen(true)}
				className="item-select input-box-shadow"
			>
				{label && <IonLabel position="floating">{label}</IonLabel>}

				{selectedItem ? (
					renderSelected ? (
						renderSelected(selectedItem)
					) : (
						<IonLabel>{String(selectedItem)}</IonLabel>
					)
				) : (
					<IonLabel color="medium">{placeholder}</IonLabel>
				)}

			</IonItem>


			<IonModal isOpen={isOpen} onDidDismiss={() => setIsOpen(false)} id="alert-select-modal">
				<div className="wrapper">
					<div className="title">
						<h2>{title || "Select"}</h2>
						{subTitle && (
							<h3>{subTitle}</h3>
						)}
					</div>
					<IonList>
						{items.map(item => (
							<IonItem
								key={getIndex(item)}
								button
								onClick={() => handleSelect(item)}
								className="alert-select-item"

							>
								{renderItem(item)}
								{selectedItem && getIndex(selectedItem) === getIndex(item) && (
									<IonIcon
										slot="end"
										icon={checkmarkCircleOutline}
										color="primary"
										size="default"
									/>
								)}
							</IonItem>
						))}
					</IonList>
				</div>
				<IonFooter className="ion-no-border" >
					<IonToolbar color="secondary">
						<IonButtons slot="end">
							<IonButton color="primary" onClick={() => setIsOpen(false)}>Cancel</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonFooter>
			</IonModal >
		</div>
	);
}
