import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import {
	IonButton,
	IonButtons,
	IonCol,
	IonContent,
	IonFooter,
	IonGrid,
	IonHeader,
	IonIcon,
	IonLabel,
	IonMenuButton,
	IonNote,
	IonPage,
	IonRow,
	IonSegment,
	IonSegmentButton,
	IonSegmentContent,
	IonSegmentView,
	IonSpinner,
	IonTitle,
	IonToolbar,
	SegmentCustomEvent,
	useIonModal,
	useIonRouter
} from '@ionic/react';
import { Buffer } from 'buffer';
import { bech32 } from 'bech32';
import { useSelector } from '../../State/store';
import { Share } from "@capacitor/share";
import { useDispatch } from '../../State/store';
import { createLnurlInvoice, createNostrInvoice, createNostrPayLink, getNostrBtcAddress } from '../../Api/helpers';
import { parseBitcoinInput } from '../../constants';
import { toggleLoading } from '../../State/Slices/loadingOverlay';
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";

import { Swiper, SwiperClass, SwiperSlide, useSwiperSlide } from 'swiper/react';
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { copyToClipboard } from '../../State/thunks/copyToClipboard';
import { chevronBack, copy, shareSocialOutline, chevronForward } from "ionicons/icons";
import QrCode from '../../Components/QrCode';
import GradientButton from '../../Components/Buttons/GradientButton';
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces';
import { parseCommaFormattedSats } from '../../utils/numbers';
import NewInvoiceModal from '../../Components/Modals/NewInvoiceModal';
import { getCache, setCache } from '../../utils/cache';
import { truncateTextMiddle } from '../../utils/text';


const CHAIN_CACHE_KEY = "p_c_info";
const LNURL_CACHE_KEY = "p_lnurl_info";
const getCacheKey = (id: string, cacheKey: string) => `${cacheKey}_${id}`;


type Slide = {
	id: string;
	name: string;
	component: React.ReactNode;
}


const Receive = () => {
	const dispatch = useDispatch();
	const topPaysource = useSelector(state => state.paySource.sources[state.paySource.order[0]], (prev, next) => next.id === prev.id);


	// swiper slides
	const [validSlides, setValidSlides] = useState<Slide[]>([
		{
			id: 'lnurl',
			name: 'LNURL',
			component: <LnurlTab onInvalidate={() => handleInvalidate('lnurl')} />,
		},
		{
			id: 'bitcoin',
			name: 'Chain',
			component: <OnChainTab onInvalidate={() => handleInvalidate('bitcoin')} />,
		},
		{
			id: 'invoice',
			name: 'Invoice',
			component: <InvoiceTab />,
		},
	]);
	const [isLoop, setIsLoop] = useState(validSlides.length >= 3);
	const handleInvalidate = useCallback((id: string) => {
		setValidSlides(prev => {
			const newSlides = prev.filter(slide => slide.id !== id);
			setIsLoop(newSlides.length >= 3);
			return newSlides;
		});
	}, []);

	// This is to reinitialize the swiper when the slides change
	const swiperKey = useMemo(() => validSlides.map(s => s.id).join('-'), [validSlides]);


	// navigation labels
	const [currentState, setCurrentState] = useState({
		realIndex: 0,
		isBeginning: true,
		isEnd: false
	});
	const updateState = (swiper: SwiperClass) => {
		setCurrentState({
			realIndex: swiper.realIndex,
			isBeginning: swiper.isBeginning,
			isEnd: swiper.isEnd
		});
	};
	const getNavigationLabels = () => {
		const total = validSlides.length;
		const { realIndex, isBeginning, isEnd } = currentState;

		let prevIndex = realIndex - 1;
		let nextIndex = realIndex + 1;

		if (isLoop && total > 1) {
			prevIndex = (realIndex - 1 + total) % total;
			nextIndex = (realIndex + 1) % total;
		}

		return {
			prev: !isLoop && isBeginning ? null : validSlides[prevIndex]?.name,
			next: !isLoop && isEnd ? null : validSlides[nextIndex]?.name
		};
	};
	const labels = getNavigationLabels();


	const router = useIonRouter();

	useEffect(() => {
		if (!topPaysource) {
			toast.error(<Toast title="Error" message="You don't have any sources!" />)
			router.push("/home");
			return;
		}


		return () => {
			dispatch(toggleLoading({ loadingMessage: "" }))
		}
	}, [dispatch, router, topPaysource]);

	useEffect(() => {
		const testDiv = document.createElement('div');
		testDiv.style.paddingTop = 'env(safe-area-inset-top)';
		document.body.appendChild(testDiv);

		requestAnimationFrame(() => {
			const computed = window.getComputedStyle(testDiv).paddingTop;
			console.log('safe-area-inset-top:', computed);
			testDiv.remove();
		});
	}, []);


	return (
		<IonPage style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={() => router.goBack()}>
							<IonIcon color='primary' icon={chevronBack} />
							<IonLabel>Back</IonLabel>
						</IonButton>
					</IonButtons>
					<IonButtons slot="end">
						<IonMenuButton color="primary"></IonMenuButton>
					</IonButtons>
					<IonTitle>Receive</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonGrid>
					<IonRow className="ion-justify-content-center">
						<IonCol size="12" sizeMd="6">
							<Swiper
								key={swiperKey}
								onSwiper={updateState}
								onSlideChange={updateState}
								modules={[Navigation]}
								navigation={{
									prevEl: "#prev-button",
									nextEl: "#next-button",
								}}
								loop={isLoop}
								spaceBetween={50}
								slidesPerView={1}
								allowTouchMove={false}
								style={{ width: "100%" }}
							>
								{
									validSlides.map(slide => (
										<SwiperSlide key={slide.id}>
											{slide.component}
										</SwiperSlide>
									))
								}
							</Swiper>
						</IonCol>
					</IonRow>
				</IonGrid>
			</IonContent>
			<IonFooter>
				<IonToolbar>
					<IonButtons slot="start" id="prev-button">
						{
							labels.prev && (
								<IonButton>
									<IonIcon slot="start" icon={chevronBack} />
									{labels.prev}
								</IonButton>
							)
						}
					</IonButtons>
					<IonButtons slot="end" id="next-button">
						{
							labels.next && (
								<IonButton>
									{labels.next}
									<IonIcon slot="end" icon={chevronForward} />
								</IonButton>
							)
						}
					</IonButtons>
				</IonToolbar>
			</IonFooter>
		</IonPage>
	)
}




interface TabProps {
	onInvalidate: () => void;
}
const LnurlTab = ({ onInvalidate }: TabProps) => {
	const dispatch = useDispatch();
	const topPaySource = useSelector(state => state.paySource.sources[state.paySource.order[0]], (prev, next) => prev.vanityName === next.vanityName);

	const [lnurl, setLnurl] = useState("");
	const [lightningAddress, setLightningAddress] = useState("");
	const [selectedSegment, setSelectedSegment] = useState<"lnurl" | "address">("address");
	const [loading, setLoading] = useState(true);







	useEffect(() => {
		const configure = async () => {
			if (topPaySource.pubSource) {
				const lnAddress = topPaySource.vanityName;
				if (lnAddress) {
					setLightningAddress(lnAddress);

				}

				try {
					const cacheKey = getCacheKey(topPaySource.id, LNURL_CACHE_KEY);
					const cached = getCache(cacheKey);
					if (cached) {
						setLnurl(cached);
						setSelectedSegment(!lnAddress ? "lnurl" : "address");
						setLoading(false);
						return;
					}
					const receivedLnurl = await createNostrPayLink(topPaySource.pasteField, topPaySource.keys);
					setLnurl(receivedLnurl);
					setCache(cacheKey, receivedLnurl);
					setSelectedSegment(!lnAddress ? "lnurl" : "address");
				} catch {
					if (!lnAddress) {
						onInvalidate(); // No lnurl or lightning address, remove view from swiper
					} else {
						setSelectedSegment("address");
					}
				}
			} else if (topPaySource.pasteField.includes("@")) {
				// Lightning address source
				setLightningAddress(topPaySource.pasteField);
				setSelectedSegment("address");
			} else {
				// lnurl source
				setLnurl(topPaySource.pasteField);
				setSelectedSegment("lnurl");
			}
			setLoading(false);
		}
		configure();
	}, [dispatch, topPaySource, onInvalidate]);




	const handleSegmentChange = (event: SegmentCustomEvent) => {
		setSelectedSegment(event.detail.value as "lnurl" | "address");
	};


	const disabled = !(lnurl && lightningAddress);

	const copyValue = selectedSegment === "lnurl" ? lnurl : createLnurlFromLnAddress(lightningAddress);

	return (
		<IonGrid>
			<IonRow>
				<IonCol size="12">
					<IonSegment value={selectedSegment} onIonChange={handleSegmentChange}>
						<IonSegmentButton className={disabled ? "segment-button-disabled" : undefined} value="lnurl" contentId="lnurl">
							<IonLabel>LNURL</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton className={disabled ? "segment-button-disabled" : undefined} value="address" contentId="address">
							<IonLabel>ADDRESS</IonLabel>
						</IonSegmentButton>
					</IonSegment>
				</IonCol>
			</IonRow>
			<IonRow className="ion-justify-content-center ion-margin-top">
				<IonCol size="auto">
					<IonSegmentView>
						<IonSegmentContent id="lnurl">
							{loading ? <IonSpinner /> : <QrCode value={lnurl} prefix="lightning:" />}
						</IonSegmentContent>
						<IonSegmentContent id="address">
							{
								loading
									? <IonSpinner />
									: (
										<>
											<QrCode value={createLnurlFromLnAddress(lightningAddress)} prefix="lightning:" />
											<div style={{ textAlign: "center", fontSize: "16px" }}>{lightningAddress}</div>
										</>
									)
							}
						</IonSegmentContent>
					</IonSegmentView>
				</IonCol>
			</IonRow>
			<IonRow className="ion-justify-content-around ion-margin-top">
				<IonCol size="auto">
					<GradientButton onClick={() => dispatch(copyToClipboard(copyValue))}>
						<IonIcon color="primary" slot="start" icon={copy} />
						Copy
					</GradientButton>
				</IonCol>
				<IonCol size="auto" >
					<GradientButton id="share-button" onClick={() => shareText(copyValue)}>
						<IonIcon slot="start" color="primary" icon={shareSocialOutline} />
						Share
					</GradientButton>
				</IonCol>
			</IonRow>
		</IonGrid>
	)
}


const InvoiceTab = () => {
	const dispatch = useDispatch();
	const { isActive } = useSwiperSlide();
	const satsInputRef = useRef<HTMLIonInputElement>(null);

	const topPaySource = useSelector(state => state.paySource.sources[state.paySource.order[0]], () => true);
	const fiatUnit = useSelector(state => state.prefs.FiatUnit);
	const price = useSelector(state => state.usdToBTC);


	const [present, dismiss] = useIonModal(
		<NewInvoiceModal
			dismiss={(data: { amount: string, invoiceMemo: string }, role: string) => dismiss(data, role)}
			ref={satsInputRef}
		/>
	);


	const [loading, setIsloading] = useState(false);
	const [qrCodeValue, setQrCodeValue] = useState("");
	const [amount, setAmount] = useState("");
	const [amountNum, setAmountNum] = useState(0);
	const [fiatSymbol, setFiatSymbol] = useState('$');

	useEffect(() => {
		if (isActive && !qrCodeValue) {
			openModal();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isActive]);

	useEffect(() => {
		if (fiatUnit.symbol) {
			setFiatSymbol(fiatUnit.symbol);
		}
	}, [fiatUnit])



	const openModal = () => {
		present({
			onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
				console.log(event.detail)
				if (event.detail.role === "confirm") {
					console.log("Herere")
					const data = event.detail.data as { amount: string, invoiceMemo: string };
					if (data) {
						configInvoice(data.amount, data.invoiceMemo);
					}
				}
			},
			onDidPresent: () => {
				satsInputRef.current?.setFocus();
			},
			cssClass: "wallet-modal"
		});
	}


	const configInvoice = async (amountToRecive: string, memo: string) => {
		setIsloading(true);
		let invoice = "";
		setAmount(amountToRecive);
		const parsedAmount = parseCommaFormattedSats(amountToRecive);
		setAmountNum(parsedAmount);
		try {
			if (topPaySource.pubSource) {
				invoice = await createNostrInvoice(topPaySource.pasteField, topPaySource.keys, parsedAmount, memo);
			} else {
				const parsedPaySource = await parseBitcoinInput(topPaySource.pasteField)
				invoice = await createLnurlInvoice(+amountToRecive, parsedPaySource);
			}
			setQrCodeValue(invoice);
		} catch (err: any) {
			if (isAxiosError(err) && err.response) {
				toast.error(<Toast title="Source Error" message={err.response.data.reason} />)
			} else if (err instanceof Error) {
				toast.error(<Toast title="Source Error" message={err.message} />)
			} else {
				console.log("Unknown error occured", err);
			}
		}
		setIsloading(false);
	};





	return (
		<>
			<IonToolbar>
				<IonTitle className="ion-text-center">Lightning Invoice</IonTitle>
			</IonToolbar>
			<IonGrid className="ion-margin-top">
				<IonRow className="ion-justify-content-center">
					<IonCol size="auto">
						{
							loading
								? <IonSpinner />
								: <QrCode value={qrCodeValue} prefix="lightning" />
						}
					</IonCol>
				</IonRow>
				<IonRow className="ion-justify-content-center">
					<IonCol size="auto" style={{ padding: "0px" }}>
						<IonNote>{`${amount} sats`}</IonNote>
					</IonCol>
				</IonRow>
				<IonRow className="ion-justify-content-center">
					<IonCol size="auto" style={{ padding: "0px" }}>
						<IonNote>{`~ ${(amountNum * price.buyPrice * 0.00000001).toFixed(2)} ${fiatSymbol}`}</IonNote>
					</IonCol>
				</IonRow>
				<IonRow className="ion-justify-content-center ion-margin-top">
					<IonCol size="auto">
						<IonButton size="large" fill="outline" color="primary" onClick={openModal}>SET AMOUNT</IonButton>
					</IonCol>
				</IonRow>
				<IonRow className="ion-justify-content-around ion-margin-top">
					<IonCol size="auto">
						<GradientButton onClick={() => dispatch(copyToClipboard(qrCodeValue))}>
							<IonIcon color="primary" slot="start" icon={copy} />
							Copy
						</GradientButton>
					</IonCol>
					<IonCol size="auto" >
						<GradientButton id="share-button" onClick={() => shareText(qrCodeValue)}>
							<IonIcon slot="start" color="primary" icon={shareSocialOutline} />
							Share
						</GradientButton>
					</IonCol>
				</IonRow>
			</IonGrid>
		</>
	)
}

const OnChainTab = ({ onInvalidate }: TabProps) => {
	const dispatch = useDispatch();
	const topPaySource = useSelector(state => state.paySource.sources[state.paySource.order[0]], () => true);

	const [qrCodeValue, setQrCodeValue] = useState("");
	const [bitcoinAddText, setBitcoinAddText] = useState("");
	const [loading, setIsloading] = useState(true);

	useEffect(() => {
		const config = async () => {
			if (qrCodeValue !== "") return;
			if (!topPaySource.pubSource) {
				onInvalidate();
				return;
			}

			try {
				const cacheKey = getCacheKey(topPaySource.id, CHAIN_CACHE_KEY);
				const cached = getCache(cacheKey);
				if (cached) {
					setQrCodeValue(cached);
					setBitcoinAddText(truncateTextMiddle(cached));
					setIsloading(false);
					return;
				}

				const address = await getNostrBtcAddress(topPaySource.pasteField, topPaySource.keys);
				setQrCodeValue(address);
				setBitcoinAddText(truncateTextMiddle(address));
				setCache(cacheKey, address);
			} catch {
				toast.error(<Toast title="Error" message={"Error when getting a btc address"} />)
				onInvalidate();
			}
			setIsloading(false);
		}
		config();
	}, [qrCodeValue, topPaySource, onInvalidate]);


	return (
		<>
			<IonToolbar>
				<IonTitle className="ion-text-center" size="large">On-chain Address</IonTitle>
			</IonToolbar>
			<IonGrid>
				<IonRow className="ion-justify-content-center">
					<IonCol size="auto">
						{loading ? <IonSpinner /> : <QrCode value={qrCodeValue} prefix="bitcion:" />}
					</IonCol>
				</IonRow>
				<IonRow className="ion-justify-content-center">
					<IonCol size="auto">
						<IonNote >{bitcoinAddText}</IonNote>
					</IonCol>
				</IonRow>
				<IonRow className="ion-justify-content-around ion-margin-top">
					<IonCol size="auto">
						<GradientButton onClick={() => dispatch(copyToClipboard(qrCodeValue))}>
							<IonIcon color="primary" slot="start" icon={copy} />
							Copy
						</GradientButton>
					</IonCol>
					<IonCol size="auto" >
						<GradientButton id="share-button" onClick={() => shareText(qrCodeValue)}>
							<IonIcon slot="start" color="primary" icon={shareSocialOutline} />
							Share
						</GradientButton>
					</IonCol>
				</IonRow>
			</IonGrid>
		</>

	)
}

export default Receive;

const createLnurlFromLnAddress = (lnAddress: string) => {
	if (lnAddress === "") return "";
	const endpoint = "https://" + lnAddress.split("@")[1] + "/.well-known/lnurlp/" + lnAddress.split("@")[0];
	const words = bech32.toWords(Buffer.from(endpoint, 'utf8'));
	const lnurl = bech32.encode("lnurl", words, 999999);
	return lnurl;
}

const shareText = async (text: string) => {
	try {
		await Share.share({
			title: 'Share',
			text: text,
			dialogTitle: 'Share with'
		});
	} catch (error) {
		console.error('Error sharing:', error);
	}
};

