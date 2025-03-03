import { QRCodeSVG } from 'qrcode.react';
import { logoDataUrl } from '../../Assets/SvgIconLibrary';
import styles from "./styles/index.module.scss";

interface QrCodeProps {
	value: string;
}
const QrCode = ({ value }: QrCodeProps) => {
	if (value === "") {
		return null;
	}
	return (
		<QRCodeSVG
			className={styles["qr-code"]}
			size={256}
			value={value}
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