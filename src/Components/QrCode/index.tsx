import { QRCodeSVG } from 'qrcode.react';
import { logoDataUrl } from '../../Assets/SvgIconLibrary';
import styles from "./styles/index.module.scss";

interface QrCodeProps {
	value: string;
	prefix?: string;
	uppercase?: boolean;
}
const QrCode = ({ value, prefix, uppercase = true }: QrCodeProps) => {
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
	return (
		<QRCodeSVG
			className={styles["qr-code"]}
			size={256}
			value={qrCodeValue}
			marginSize={4}
			bgColor="#ffffff"
			fgColor="#000000"
			imageSettings={{
				src: logoDataUrl,
				height: 30,
				width: 30,
				excavate: true
			}}
		/>
	)
}

export default QrCode;