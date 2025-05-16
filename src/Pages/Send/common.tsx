import { IonTextarea } from "@ionic/react";
interface NoteInputProps extends React.ComponentProps<typeof IonTextarea> {
	note: string;
	setNote: React.Dispatch<React.SetStateAction<string>>;
}

const NoteInput = ({ note, setNote, ...props }: NoteInputProps) => {
	return (
		<IonTextarea
			value={note}
			label="Note (optional)"
			labelPlacement="stacked"
			placeholder='Add a note'
			maxlength={100}
			counter
			helperText="Only you can see this note"
			autoGrow
			onIonInput={(e) => setNote(e.detail.value || "")}
			className={`card-input ${props.className || ""}`}
		>
		</IonTextarea>
	)
}

export default NoteInput;
