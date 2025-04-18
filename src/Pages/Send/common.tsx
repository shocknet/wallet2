import { IonTextarea } from "@ionic/react";

interface NoteInputProps {
	note: string;
	setNote: React.Dispatch<React.SetStateAction<string>>;
}
const NoteInput = ({ note, setNote }: NoteInputProps) => {
	return (
		<IonTextarea
			value={note}
			label="Note (optional)"
			labelPlacement="stacked"
			placeholder='Add a note'
			maxlength={100}
			counter
			fill="solid"
			className="card-input ion-margin"
			helperText="Only you can see this note"
			autoGrow
			onIonInput={(e) => setNote(e.detail.value || "")}
		>

		</IonTextarea>
	)
}

export default NoteInput;