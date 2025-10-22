import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import {
	IonButton,
	IonCol,
	IonContent,
	IonGrid,
	IonHeader,
	IonLabel,
	IonNote,
	IonPage,
	IonRow,
	IonSegment,
	IonSegmentButton,
	IonSpinner,
	IonText,
	IonToggle,
	IonToolbar,
	useIonModal,
	useIonRouter,
	useIonViewDidEnter,
} from '@ionic/react';
import { createLnurlInvoice, createNostrInvoice, createNostrPayLink, getNostrBtcAddress } from '../../Api/helpers';
import { parseBitcoinInput } from '../../constants';
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";
import { Swiper, SwiperClass, SwiperSlide, useSwiperSlide } from 'swiper/react';
import "swiper/css";
import "swiper/css/navigation";
import QrCode from '../../Components/QrCode';
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces';
import NewInvoiceModal from '../../Components/Modals/NewInvoiceModal';
import { getCache, setCache } from '@/lib/cache';
import { Satoshi } from '@/lib/types/units';
import { formatSatoshi } from '@/lib/units';
import { formatFiat, truncateTextMiddle } from '@/lib/format';
import BackToolbar from '@/Layout2/BackToolbar';
import { convertSatsToFiat } from '@/lib/fiat';
import { useAlert } from '@/lib/contexts/useAlert';
import styles from "./styles/index.module.scss";
import { useAppSelector } from '@/State/store/hooks';
import { selectFavoriteSourceView } from '@/State/scoped/backups/sources/selectors';
import { SourceType } from '@/State/scoped/common';



const CHAIN_CACHE_KEY = "p_c_info";
const LNURL_CACHE_KEY = "p_lnurl_info";
const getCacheKey = (id: string, cacheKey: string) => `${cacheKey}_${id}`;


type Slide = {
	id: string;
	name: string;
	component: React.ReactNode;
}


const Receive = () => {
	const router = useIonRouter();
	const swiperRef = useRef<SwiperClass>();

	const favoriteSource = useAppSelector(selectFavoriteSourceView);

	const { showAlert } = useAlert();

	useIonViewDidEnter(() => {
		if (!favoriteSource) {
			showAlert({
				header: "No sources",
				message: "You need to add a pay source before receiving payments.",
				buttons: [
					{
						text: "Cancel",
						role: "cancel",

					},
					{
						text: "Add Source",
						role: "confirm",
					},
				]
			}).then(({ role }) => {
				if (role === "cancel") {
					router.goBack();
				} else if (role === "confirm") {
					router.push("/sources", "forward", "replace")
				}
			})
		}

	}, [])

	const handleInvalidate = useCallback((id: string) => {
		setValidSlides(prev => {
			const newSlides = prev.filter(slide => slide.id !== id);
			swiperRef.current?.slideTo(Math.min(swiperRef.current.activeIndex, newSlides.length - 1));
			setSelectedSegment(newSlides[0].id);
			return newSlides;
		});
	}, []);


	const handleInvalidateLnurl = useCallback(() => {
		handleInvalidate("address");
	}, [handleInvalidate]);

	const handleInvalidateChain = useCallback(() => {
		handleInvalidate("bitcoin");
	}, [handleInvalidate]);

	const [validSlides, setValidSlides] = useState<Slide[]>([
		{
			id: 'address',
			name: 'Address',
			component: <LnurlTab onInvalidate={handleInvalidateLnurl} />,
		},
		{
			id: 'invoice',
			name: 'Invoice',
			component: <InvoiceTab />,
		},
		{
			id: 'bitcoin',
			name: 'Chain',
			component: <OnChainTab onInvalidate={handleInvalidateChain} />,
		},
	]);



	const [selectedSegment, setSelectedSegment] = useState(validSlides[0].id);




	return (
		<IonPage className="ion-page-width">

			<IonHeader className="ion-no-border">
				<BackToolbar title="Receive" />
				<IonToolbar>
					<IonSegment
						value={selectedSegment}
						onIonChange={e => {
							const segment = e.detail.value! as string;
							setSelectedSegment(segment)
							const index = validSlides.findIndex(slide => slide.id === segment);
							swiperRef.current?.slideTo(index);
						}}
					>
						{validSlides.map(slide => (
							<IonSegmentButton key={slide.id} value={slide.id}>
								<IonLabel>{slide.name}</IonLabel>
							</IonSegmentButton>
						))}
					</IonSegment>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding" >
				<IonGrid className="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
					<IonRow className="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
						<IonCol size="12" style={{ height: '100%' }}>
							<Swiper

								onSwiper={swiper => {
									swiperRef.current = swiper;
									setSelectedSegment(validSlides[swiper.activeIndex].id);
								}}
								spaceBetween={50}
								slidesPerView={1}
								allowTouchMove={false}
								style={{ width: "100%", height: "100%" }}
							>
								{
									validSlides.map(slide => (
										<SwiperSlide key={slide.id} style={{
											height: '80%',
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center'
										}}>
											{slide.component}
										</SwiperSlide>
									))
								}
							</Swiper>
						</IonCol>
					</IonRow>
				</IonGrid>
			</IonContent>
		</IonPage>
	);
};




interface TabProps {
	onInvalidate: () => void;
}
const LnurlTab = memo(({ onInvalidate }: TabProps) => {

	const favoriteSource = useAppSelector(selectFavoriteSourceView, (next, prev) => next?.sourceId === prev?.sourceId)!;
	const { showAlert } = useAlert();

	const [lnurl, setLnurl] = useState("");
	const [lightningAddress, setLightningAddress] = useState("");
	const [showLnurl, setShowLnurl] = useState(false);
	const [loading, setLoading] = useState(true);


	const invalidated = useRef(false);


	const configure = useCallback(async () => {
		if (invalidated.current) return;

		let lnAddress = "";
		let receivedLnurl = "";

		switch (favoriteSource.type) {
			case SourceType.NPROFILE_SOURCE: {
				if (favoriteSource.vanityName) {
					lnAddress = favoriteSource.vanityName;
				}
				// get lnurl
				const cacheKey = getCacheKey(favoriteSource.sourceId, LNURL_CACHE_KEY);
				const cached = getCache(cacheKey);
				if (cached) {
					receivedLnurl = cached;
				} else {
					try {
						const lnurlRes = await createNostrPayLink({
							pubkey: favoriteSource.lpk,
							relays: favoriteSource.relays
						},
							favoriteSource.keys
						);
						setCache(cacheKey, lnurlRes);
						receivedLnurl = lnurlRes;
					} catch {
						// no lnurl
					}
				}
				break;
			}
			case SourceType.LIGHTNING_ADDRESS_SOURCE:
				lnAddress = favoriteSource.sourceId;
				break;

		}


		if (!lnAddress && !receivedLnurl) {
			if (invalidated.current) return;
			invalidated.current = true;
			onInvalidate();
			showAlert({
				header: "No LNURL or Lightning Address",
				message: "This source cannot receive LNURL or Lightning Address payments",
			})
			return;
		}

		if (receivedLnurl && !lnAddress) {
			setShowLnurl(true);
		}
		setLnurl(receivedLnurl);
		setLightningAddress(lnAddress);

		setLoading(false);

	}, [favoriteSource, showAlert, onInvalidate]);


	useEffect(() => {
		configure();
	}, [configure]);


	const hasBoth = lightningAddress && lnurl;

	if (loading) {
		return (
			<IonGrid className="ion-text-center ion-padding">
				<IonRow className="ion-justify-content-center">
					<IonCol size="auto">
						<IonSpinner name="crescent" />
					</IonCol>
				</IonRow>
			</IonGrid>
		);
	}

	return (
		<IonGrid>

			{hasBoth && (
				<IonRow className="ion-justify-content-center">
					<IonCol size="auto">
						<div style={{ display: "flex" }} className="ion-justify-content-center">

							<IonToggle
								checked={showLnurl}
								onIonChange={(e) => {
									const value = e.detail.checked;
									setShowLnurl(value);
								}}
							>
								Show LNURL
							</IonToggle>
						</div>
					</IonCol>
				</IonRow>
			)}
			{
				showLnurl ? (
					<>
						<IonRow className="ion-justify-content-center ion-margin-top">
							<IonCol size="12" className="ion-text-center">
								<div className={styles["qr-code-wrapper"]}>
									<div className={styles["inner-qr-code"]}>
										<QrCode value={lnurl} prefix="lightning" />
									</div>
								</div>
							</IonCol>
						</IonRow>
						<IonRow className="ion-justify-content-center ion-margin-top">
							<IonCol size="auto">
								<IonText color="light">
									LNURL
								</IonText>
							</IonCol>
						</IonRow>
					</>
				) : (
					<>
						<IonRow className="ion-justify-content-center ion-margin-top">
							<IonCol size="12" className="ion-text-center">
								<div className={styles["qr-code-wrapper"]}>
									<div className={styles["inner-qr-code"]}>
										<QrCode value={lightningAddress} prefix="lightning" />
									</div>
								</div>
							</IonCol>
						</IonRow>
						<IonRow className="ion-justify-content-center ion-margin-top">
							<IonCol size="auto">
								<IonText color="light">
									{lightningAddress}
								</IonText>
							</IonCol>
						</IonRow>
					</>
				)
			}

		</IonGrid>
	)
})

LnurlTab.displayName = "LnurlTab";

const InvoiceTab = memo(() => {
	const satsInputRef = useRef<HTMLIonInputElement>(null);
	const { isActive } = useSwiperSlide();
	const favoriteSource = useAppSelector(selectFavoriteSourceView, (next, prev) => next?.sourceId === prev?.sourceId)!;

	const { url, currency } = useAppSelector(state => state.prefs.FiatUnit)


	const [money, setMoney] = useState("");
	const [loading, setIsloading] = useState(false);
	const [qrCodeValue, setQrCodeValue] = useState("");
	const [amount, setAmount] = useState("");
	const [amountNum, setAmountNum] = useState<Satoshi>(0 as Satoshi);



	const [present, dismiss] = useIonModal(
		<NewInvoiceModal
			dismiss={(data: { amount: Satoshi, invoiceMemo: string, blind: boolean } | null, role?: string) => dismiss(data, role)}
			ref={satsInputRef}
		/>
	);


	useEffect(() => {
		const setFiat = async () => {
			const fiat = await convertSatsToFiat(amountNum, currency, url);
			setMoney(formatFiat(fiat, currency));
		}
		setFiat();
	}, [amountNum, currency, url]);


	const modalOpenedRef = useRef(false);





	const configInvoice = useCallback(async (amountToRecive: Satoshi, memo: string, blind: boolean) => {
		setIsloading(true);
		let invoice = "";
		setAmount(formatSatoshi(amountToRecive));
		const parsedAmount = amountToRecive;
		setAmountNum(amountToRecive);
		try {
			if (favoriteSource.type === SourceType.NPROFILE_SOURCE) {
				invoice = await createNostrInvoice({
					pubkey: favoriteSource.lpk,
					relays: favoriteSource.relays
				},
					favoriteSource.keys,
					parsedAmount,
					memo,
					blind
				);

			} else {
				const parsedPaySource = await parseBitcoinInput(favoriteSource.sourceId);
				invoice = await createLnurlInvoice(+amountToRecive, parsedPaySource);
			}
			setQrCodeValue(invoice);
		} catch (err: any) {
			console.log({ err })
			if (isAxiosError(err) && err.response) {

				toast.error(<Toast title="Source Error" message={err.response.data.reason} />)
			} else if (err instanceof Error) {
				toast.error(<Toast title="Source Error" message={err.message} />)
			} else {
				console.log("Unknown error occured", err);
			}
		}
		setIsloading(false);
	}, [favoriteSource]);



	const openModal = useCallback(() => {
		present({
			onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {

				if (event.detail.role === "confirm") {
					const data = event.detail.data as { amount: Satoshi, invoiceMemo: string, blind: boolean };
					if (data) {
						configInvoice(data.amount, data.invoiceMemo, data.blind);
					}
				}
				modalOpenedRef.current = false;
			},

			onDidPresent: () => {
				satsInputRef.current?.setFocus();
			},
			cssClass: "wallet-modal"
		});
	}, [present, configInvoice]);


	useEffect(() => {
		if (isActive && !qrCodeValue && !modalOpenedRef.current) {
			modalOpenedRef.current = true;
			openModal();
		}
		return () => {
			modalOpenedRef.current = false;
		};
	}, [isActive, qrCodeValue, openModal]);


	return (
		<IonGrid>
			{
				loading ? (
					<IonRow className="ion-justify-content-center">
						<IonCol size="auto">
							<IonSpinner name="crescent" />
						</IonCol>
					</IonRow>

				) : (
					qrCodeValue ? (
						<>
							<IonRow className="ion-justify-content-center ion-margin-top">
								<IonCol size="12" className="ion-text-center">
									<div className={styles["qr-code-wrapper"]}>
										<div className={styles["inner-qr-code"]}>

											<QrCode value={qrCodeValue} prefix="lightning" />
										</div>
									</div>

								</IonCol>
							</IonRow>
							<IonRow className="ion-justify-content-center ion-margin-top">
								<IonCol size="auto" style={{ padding: "0px" }}>
									<IonText color="primary">{`${amount} sats`}</IonText>
								</IonCol>
							</IonRow>
							<IonRow className="ion-justify-content-center">
								<IonCol size="auto" style={{ padding: "0px" }}>
									<IonNote className="text-medium">{`~ ${money}`}</IonNote>
								</IonCol>
							</IonRow>
						</>
					) : null
				)
			}
			<IonRow className="ion-justify-content-center ion-margin-top">
				<IonCol size="12">
					<div className={styles["qr-code-wrapper"]}>
						<div className={styles["inner-qr-code"]}>
							<IonButton
								color="primary"
								strong
								onClick={openModal}
								expand="block"
								style={{
									fontSize: "1.1rem",
									"--padding-top": "15px",
									"--padding-bottom": "15px",
								}}
							>
								+ Create Invoice
							</IonButton>

						</div>
					</div>

				</IonCol>
			</IonRow>


		</IonGrid>
	)
})

InvoiceTab.displayName = "InvoiceTab";



const OnChainTab = memo(({ onInvalidate }: TabProps) => {
	const favoriteSource = useAppSelector(selectFavoriteSourceView, (next, prev) => next?.sourceId === prev?.sourceId)!;
	const { showAlert } = useAlert();

	const [qrCodeValue, setQrCodeValue] = useState("");
	const [bitcoinAddText, setBitcoinAddText] = useState("");
	const [loading, setIsloading] = useState(true);

	const invalidated = useRef(false);


	const configure = useCallback(async () => {
		if (invalidated.current) return;
		if (qrCodeValue !== "") return;
		if (favoriteSource.type !== SourceType.NPROFILE_SOURCE) {
			if (invalidated.current) return;
			invalidated.current = true;
			onInvalidate();
			showAlert({
				header: "Chain not avaiable",
				message: "This source cannot receive on-chain payments",
			})
			return;
		}

		try {
			const cacheKey = getCacheKey(favoriteSource.sourceId, CHAIN_CACHE_KEY);
			const cached = getCache(cacheKey);
			if (cached) {
				setQrCodeValue(cached);
				setBitcoinAddText(truncateTextMiddle(cached, 10, 10));
				setIsloading(false);
				return;
			}

			const address = await getNostrBtcAddress({
				pubkey: favoriteSource.lpk,
				relays: favoriteSource.relays
			},
				favoriteSource.keys
			);
			setQrCodeValue(address);
			setBitcoinAddText(truncateTextMiddle(address, 10, 10));
			setCache(cacheKey, address);
		} catch {
			if (invalidated.current) return;
			invalidated.current = true;
			onInvalidate();
			showAlert({
				header: "Chain error",
				message: "Error getting chain address",
			})
		}
		setIsloading(false);
	}, [qrCodeValue, favoriteSource, onInvalidate, showAlert])

	useEffect(() => {
		configure();
	}, [configure]);


	return (
		<IonGrid>
			{
				loading ? (
					<IonRow className="ion-justify-content-center">
						<IonCol size="auto">
							<IonSpinner name="crescent" />
						</IonCol>
					</IonRow>
				) : (
					qrCodeValue ? (
						<>
							<IonRow className="ion-justify-content-center ion-margin-top">
								<IonCol size="12" className="ion-text-center">
									<div className={styles["qr-code-wrapper"]}>
										<div className={styles["inner-qr-code"]}>
											<QrCode value={qrCodeValue} prefix="bitcoin" />
										</div>
									</div>
								</IonCol>
							</IonRow>
							<IonRow className="ion-justify-content-center ion-margin-top">
								<IonCol size="auto" style={{ padding: "0px" }}>
									<IonText>{bitcoinAddText}</IonText>
								</IonCol>
							</IonRow>
						</>
					) : null
				)
			}
		</IonGrid>
	)
})

OnChainTab.displayName = "OnChainTab";

export default Receive;






