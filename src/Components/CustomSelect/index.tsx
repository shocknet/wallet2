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
				detail={false}
				onClick={() => setIsOpen(true)}
				className="[--background:var(--ion-color-secondary)]
					[--border-color:var(--ion-background-color-step-500, gray)]
					border-b
					border-b-[var(--ion-background-color-step-500)]
					min-h-14
				"
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
				<IonIcon className="text-base" icon={caretDownSharp} color="light" slot="end" />

			</IonItem>


			<IonModal isOpen={isOpen} onDidDismiss={() => setIsOpen(false)} id="alert-select-modal">
				<div className="bg-[var(--ion-color-secondary)]">
					<div className="px-5 pb-4 pt-5">
						<h2 className="m-0 font-medium text-medium text-xl">{title || "Select"}</h2>
						{subTitle && (
							<h3 className="m-0 font-normal text-low text-base">{subTitle}</h3>
						)}
					</div>
					<div className="max-h-[min(25vh,240px)] overflow-y-auto overscroll-contain">
						<IonList lines="none">
							{items.map(item => (
								<IonItem
									key={getIndex(item)}
									button
									onClick={() => handleSelect(item)}
									className="[--background: var(--ion-color-secondary)]"

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
