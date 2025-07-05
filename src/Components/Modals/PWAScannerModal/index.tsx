
import { Html5Qrcode } from 'html5-qrcode';

import {
	IonModal,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonIcon,
	IonContent,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useRef } from 'react';

interface PWAScannerModalProps {
	instruction: string;
	onResult: (txt: string) => void;
	onCancel: () => void;
	onError: (error: string) => void;
}

const PWAScannerModal = ({ instruction, onResult, onCancel, onError }: PWAScannerModalProps) => {
	const regionRef = useRef<HTMLDivElement | null>(null);
	const html5Ref = useRef<Html5Qrcode | null>(null);


	const stopScanner = () => {
		html5Ref.current?.stop().catch(() => { });
	};

	const handleDidPresent = async () => {
		if (!regionRef.current) return;

		const html5 = new Html5Qrcode(regionRef.current.id);
		html5Ref.current = html5;

		try {
			await html5.start(
				{ facingMode: 'environment' },
				{
					fps: 12,
					qrbox: { width: 250, height: 250 },

				},
				(txt) => {
					stopScanner();
					onResult(txt);
				},
				/* onFailure – ignore */() => { }
			);
		} catch (err: any) {
			console.error('html5-qrcode error:', err);
			onError(err?.message || 'Error when starting scanner. Is camera permitted?');
		}
	};


	return (
		<IonModal
			isOpen
			onDidDismiss={onCancel}
			onDidPresent={handleDidPresent}
			onWillDismiss={stopScanner}
			className="wallet-modal"
		>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Scan QR Code</IonTitle>
					<IonButtons slot="end">
						<IonButton color="primary" onClick={onCancel}>
							<IonIcon slot="icon-only" icon={closeOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding" scrollY={false} onClick={() => console.log("haha")}>
				<p style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{instruction}</p>
				<div
					id="qr-region"
					ref={regionRef}

				/>
			</IonContent>
		</IonModal>
	);
};


export default PWAScannerModal;
