import { QRCodeSVG } from 'qrcode.react';
import { logoDataUrl } from '../../Assets/SvgIconLibrary';
import styles from "./styles/index.module.scss";
import { IonButton, IonIcon } from '@ionic/react';
import { memo, useCallback } from 'react';
import { copyOutline } from 'ionicons/icons';
import { useDispatch } from '@/State/store';
import { copyToClipboard } from '@/State/thunks/copyToClipboard';
import { useToast } from '@/lib/contexts/useToast';

interface QrCodeProps {
	value: string;
	prefix?: string;
	uppercase?: boolean;
}
const QrCode = memo(({ value, prefix, uppercase = true }: QrCodeProps) => {
	const dispatch = useDispatch();
	const { showToast } = useToast();

	const copy = useCallback(() => {
		dispatch(copyToClipboard(value, showToast));
	}, [dispatch, value, showToast]);

	if (value === "") {
		return null;
	}
	let qrCodeValue = value;
	// Add prefix to the value
	if (prefix) {
		qrCodeValue = `${prefix}:${value}`;
	}
	if (uppercase) {
		qrCodeValue = qrCodeValue.toUpperCase();
	}



	const logoScaleFactor = 0.05;

	const logoSize = 256 * logoScaleFactor;
	return (
		<IonButton fill="clear" expand="block" onClick={copy}>

			<div className={styles["qr-wrapper"]}>
				<IonIcon
					icon={copyOutline}
					className={styles["copy-hint"]}
					color="primary"
				/>
				<div className={styles["qr-inner"]}>
					<QRCodeSVG
						className={styles["qr-code"]}
						value={qrCodeValue}
						bgColor="#ffffff"
						fgColor="#000000"
						marginSize={4}
						imageSettings={{
							src: logoDataUrl,
							height: logoSize,
							width: logoSize,
							excavate: true
						}}
					/>
				</div>
			</div>
		</IonButton>

	)
})

QrCode.displayName = "QrCode";

export default QrCode;
