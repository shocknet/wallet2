import { ComponentProps, useState } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { copyOutline, checkmarkOutline } from "ionicons/icons";
import { useAppDispatch } from "@/State/store/hooks";
import { copyToClipboard } from "@/State/thunks/copyToClipboard";
const FEEDBACK_MS = 1700;

interface CopyMorphButtonProps extends ComponentProps<typeof IonButton> {
	value: string;
}
const CopyMorphButton = ({
	value,
	...props
}: CopyMorphButtonProps) => {
	const [copied, setCopied] = useState(false);
	const dispatch = useAppDispatch();


	const doCopy = async () => {
		if (copied) return;
		dispatch(copyToClipboard(value, undefined, true, true));
		setCopied(true);
		setTimeout(() => setCopied(false), FEEDBACK_MS);

	};

	return (
		<IonButton

			onClick={doCopy}



			{...props}
		>
			{copied ? (
				<>
					<IonIcon slot="icon-only" icon={checkmarkOutline} />
				</>
			) : (
				<IonIcon slot="icon-only" icon={copyOutline} />
			)}
		</IonButton>
	);
}

export default CopyMorphButton
