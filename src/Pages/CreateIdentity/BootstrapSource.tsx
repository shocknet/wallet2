import {
	IonPage,
	IonContent,
	IonButton,
	useIonRouter,
	IonIcon,
	useIonModal,
} from "@ionic/react";
import { useCallback, useState } from "react";
import { useAppDispatch } from "@/State/store/hooks";
import { useToast } from "@/lib/contexts/useToast";
import { ParsedNprofileInput } from "@/lib/types/parse";
import { addBootstrapSource, addNprofileSource } from "@/State/scoped/backups/sources/thunks";
import HomeHeader from "@/Layout2/HomeHeader";
import { flashOutline } from "ionicons/icons";
import cn from "clsx";
import { AddConnectionDialog } from "@/Components/Modals/DialogeModals";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

type SelectedOption = "bootstrap" | "connection" | null;

const BootstrapSource = () => {
	const router = useIonRouter();
	const { showToast } = useToast();

	const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);

	const [presentAdd, dismissAdd] = useIonModal(
		<AddConnectionDialog dismiss={(data: { parsedNprofile: ParsedNprofileInput } | null, role: "cancel" | "confirm") => dismissAdd(data, role)} />
	);


	const dispatch = useAppDispatch();


	const handleAddNProfileSource = useCallback(async (parsedNprofile: ParsedNprofileInput) => {

		if (!parsedNprofile) return;



		try {

			if (parsedNprofile.relays.length === 0) {
				throw new Error("This nprofile has no relays");
			}
			const resultMessage = await dispatch(addNprofileSource({
				lpk: parsedNprofile.pubkey,
				relays: parsedNprofile.relays,
				adminEnrollToken: parsedNprofile.adminEnrollToken,
				bridgeUrl: null,
			}));

			showToast({
				color: "success",
				message: resultMessage
			});
			router.push("/sources");


		} catch (err: any) {
			showToast({
				color: "danger",
				message: err?.message || "Failed to add pub source"
			});

		}

	}, [
		showToast,
		dispatch,
		router
	]);



	const handleSelectOption = (option: SelectedOption) => () => {
		setSelectedOption(option);
	}

	const handleConnect = useCallback(async () => {
		if (selectedOption === null) return;

		if (selectedOption === "connection") {
			presentAdd({
				onDidDismiss: (event: CustomEvent<OverlayEventDetail>) => {
					if (event.detail.role === "cancel") return;
					if (event.detail.role === "confirm") {
						handleAddNProfileSource(event.detail.data.parsedNprofile as ParsedNprofileInput)
					}
				},
				cssClass: "dialog-modal wallet-modal"
			});
		} else {
			await dispatch(addBootstrapSource());
			router.push("/sources");
		}
	}, [
		presentAdd,
		selectedOption,
		handleAddNProfileSource,
		dispatch,
		router
	]);

	const HandshakeIcon = () => (
		<svg className="w-16 h-16" viewBox="60 115 380 260" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M321.308,294.864c5.352,5.328,9.456,12.144,15.792,8.832c2.448-1.272,5.064-3.096,7.32-5.256c3.744-3.576,8.256-9.528,4.656-14.28c-12.456-11.976-36.384-32.112-36.456-32.16l7.56-8.568c0.024,0.024,5.16,4.536,11.832,10.824c8.688,8.208,20.856,16.2,26.736,24.408c3.312,4.608,2.616,12.744,0.864,17.52c-1.392,3.84-4.104,7.464-7.32,10.536c-3.024,2.904-6.6,5.4-9.96,7.128c-3.384,1.752-6.792,2.76-9.696,2.784c-0.096,0.456-0.216,0.936-0.336,1.392c-0.96,3.24-3.024,6.072-5.616,8.4c-2.328,2.088-5.136,3.816-7.944,5.064c-3.072,1.344-6.288,2.112-9.168,2.16c-0.096,0.936-0.288,1.848-0.552,2.76c-0.96,3.24-3.024,6.072-5.616,8.4c-2.328,2.088-5.136,3.816-7.944,5.064c-4.128,1.824-8.544,2.568-12,1.968c-0.12,1.224-0.36,2.4-0.696,3.504v0.024c-1.032,3.384-3,6.24-5.52,8.352c-2.52,2.112-5.592,3.48-8.856,3.936c-3.96,0.552-8.16-0.24-11.904-2.688c-1.032-0.672-2.16-1.536-3.48-2.592l-0.744-0.576l-11.16-8.616l6.96-9.024l11.16,8.616l0.744,0.576c1.032,0.792,1.896,1.488,2.784,2.04c1.296,0.864,2.736,1.128,4.08,0.96c1.128-0.168,2.184-0.648,3.072-1.392c0.864-0.72,1.56-1.728,1.92-2.904l0,0c0.456-1.56,0.384-3.504-0.456-5.76c-9.528-13.296-29.448-29.424-29.496-29.472l7.2-8.856c0.048,0.024,8.112,6.576,16.752,15.024c2.304,2.256,4.848,4.752,7.512,7.128c0.48,0.432,0.984,0.864,1.464,1.296l0,0l0,0c0.096,0.096,0.216,0.192,0.312,0.288c0.624,0.552,1.248,1.128,1.872,1.704c2.112,1.896,4.2,3.816,6.384,5.496c2.592,1.848,2.544,2.232,5.496,1.344c0.624-0.192,1.296-0.528,2.016-0.84c1.776-0.768,3.504-1.848,4.896-3.096c1.128-1.032,1.992-2.112,2.304-3.168c0.24-0.84,0.072-1.848-0.744-2.976c-9.576-13.32-35.904-36.456-35.976-36.528l7.56-8.568c0.048,0.048,14.688,12.912,26.616,25.488c3.24,3.192,8.064,7.56,11.544,10.272c1.272,0.912,2.16,2.088,4.08,1.416c0.816-0.288,1.848-0.696,3-1.2c1.776-0.768,3.504-1.848,4.896-3.096c1.128-1.008,1.992-2.112,2.304-3.168c0.24-0.84,0.072-1.848-0.744-3c-9.576-13.32-35.904-36.456-35.976-36.528l7.56-8.568C292.22,266.688,309.044,281.496,321.308,294.864z"/>
			<path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M429.02,254.424L393.692,129.72l-1.536-5.448l-5.448,1.488l-45.216,12.408l-5.568,1.536l1.56,5.52l2.136,7.536c-21.696,1.968-42.84-2.664-62.568-6.96c-39.264-8.568-73.296-15.984-99.576,25.896l0,0c-7.104,11.352-14.856,24.84-16.656,35.16c-2.472,14.04,3.024,23.04,25.248,18.96c13.656-2.496,22.08-9.36,29.928-15.768c8.88-7.248,16.872-13.752,32.376-9.144c8.136,3.36,8.88,3.672,15.24,9.024c21.144,17.736,71.4,61.536,72,62.04l0,0l10.416,9.168l2.904,2.544l3.432-1.752l20.88-10.608l1.272,4.488l5.472-1.56l45.096-12.768l5.496-1.56L429.02,254.424L429.02,254.424z M350.636,269.976l-7.512-6.6H343.1c-0.144-0.12-51.624-45-72.192-62.232c-7.704-6.456-8.568-6.816-18.36-10.872l-0.24-0.096l-0.528-0.192c-21.36-6.456-31.608,1.92-42.984,11.208c-6.768,5.52-13.992,11.424-24.768,13.392c-10.08,1.848-12.768-1.032-11.928-5.784c1.488-8.472,8.544-20.664,15.048-31.056v-0.024c21.96-35.064,52.392-28.44,87.48-20.784c21.192,4.608,43.944,9.576,68.16,6.936l27.264,96.24L350.636,269.976L350.636,269.976z M382.364,261.696L350.06,147.625l34.2-9.384l32.232,113.784L382.364,261.696z"/>
			<path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M155.013,145.2l-2.28,8.016c10.224,0.216,29.592,0.048,45.72-3.6l2.496,11.136c-18.96,4.296-41.808,4.104-51.408,3.792l-25.488,89.976c9.672,3.048,27.888,10.968,29.352,27.72l-11.4,0.984c-0.888-10.152-13.728-15.504-21.072-17.76l-1.368,4.824l-1.56,5.496l-5.472-1.56l-45.096-12.768l-5.496-1.56l1.56-5.472l35.328-124.704l1.536-5.448l5.448,1.488l45.216,12.408l5.568,1.536L155.013,145.2L155.013,145.2L155.013,145.2z M110.157,261.696l32.304-114.072l-34.2-9.384L76.029,252.024L110.157,261.696z"/>
			<path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M240.764,336.672L240.764,336.672c-1.104-0.816-2.448-1.08-3.744-0.888s-2.496,0.864-3.312,1.944l-8.832,11.976h0.024c-0.816,1.104-1.104,2.472-0.912,3.744c0.192,1.272,0.864,2.472,1.944,3.288l0.168,0.144c1.056,0.72,2.352,0.96,3.576,0.768c1.296-0.192,2.496-0.864,3.312-1.944l8.856-12c0.816-1.104,1.08-2.448,0.888-3.744C242.516,338.688,241.844,337.488,240.764,336.672L240.764,336.672L240.764,336.672z M176.421,266.28c4.224,3.12,6.816,7.68,7.536,12.504c0.312,2.064,0.288,4.176-0.096,6.24c1.896-0.96,3.936-1.608,6.024-1.92c5.016-0.744,10.296,0.384,14.688,3.624v0.024c4.416,3.24,7.08,7.968,7.824,12.984c0.312,1.992,0.288,4.032-0.024,6.048c0.6-0.144,1.176-0.264,1.776-0.36c4.536-0.672,9.336,0.36,13.296,3.288l0.288,0.24c3.816,2.928,6.144,7.128,6.816,11.52c0.216,1.368,0.264,2.76,0.144,4.152c0.216-0.048,0.408-0.072,0.624-0.096c4.128-0.624,8.544,0.336,12.192,3.024l0,0c3.672,2.712,5.88,6.624,6.504,10.776c0.624,4.128-0.336,8.544-3.048,12.192l-8.856,12c-2.712,3.672-6.624,5.88-10.776,6.504c-4.128,0.624-8.52-0.336-12.192-3.024v0.024c-3.648-2.688-5.88-6.624-6.504-10.8c-0.072-0.48-0.12-0.96-0.144-1.44c-1.008,0.336-2.04,0.6-3.072,0.744c-4.512,0.672-9.312-0.36-13.296-3.312l0,0c-3.984-2.952-6.408-7.224-7.08-11.736c-0.144-0.912-0.216-1.824-0.192-2.76c-1.512,0.624-3.072,1.08-4.68,1.32c-5.016,0.744-10.296-0.384-14.688-3.624l0,0c-4.392-3.24-7.08-7.992-7.824-13.008c-0.384-2.472-0.288-5.016,0.312-7.488c-1.584,0.72-3.264,1.2-4.968,1.464c-4.824,0.72-9.912-0.384-14.136-3.48c-4.224-3.12-6.816-7.68-7.536-12.504s0.384-9.912,3.48-14.136h0.024l10.992-14.904c3.12-4.248,7.68-6.816,12.48-7.536C167.085,262.056,172.173,263.16,176.421,266.28L176.421,266.28L176.421,266.28L176.421,266.28z M172.653,280.464c-0.288-1.944-1.32-3.768-2.976-4.992v-0.024c-1.68-1.224-3.72-1.656-5.688-1.368c-1.968,0.288-3.792,1.32-5.016,2.976l-10.992,14.88h0.024c-1.248,1.68-1.68,3.744-1.392,5.688c0.288,1.944,1.32,3.768,2.976,4.992c1.68,1.248,3.744,1.68,5.688,1.392s3.768-1.32,4.992-2.976l0.024,0l10.992-14.88h-0.024C172.485,284.472,172.941,282.408,172.653,280.464L172.653,280.464L172.653,280.464z M201.092,301.416c-0.312-2.136-1.44-4.152-3.264-5.496v0.024c-1.848-1.368-4.104-1.848-6.24-1.536c-2.16,0.336-4.152,1.44-5.52,3.264l-11.616,15.744c-1.344,1.848-1.824,4.104-1.512,6.24c0.312,2.136,1.44,4.128,3.264,5.496l0,0c1.848,1.368,4.104,1.848,6.24,1.536c2.16-0.312,4.152-1.44,5.52-3.264l0,0l11.616-15.744C200.948,305.832,201.428,303.576,201.092,301.416L201.092,301.416L201.092,301.416z M223.244,322.152c-0.24-1.68-1.104-3.24-2.52-4.272v0.024c-1.44-1.056-3.192-1.44-4.848-1.176c-1.656,0.24-3.216,1.104-4.248,2.544l-0.192,0.24l-9.888,13.416v0.024c-1.056,1.416-1.416,3.168-1.152,4.824c0.264,1.68,1.128,3.24,2.544,4.272l0,0c1.416,1.056,3.168,1.416,4.848,1.152c1.68-0.264,3.24-1.128,4.272-2.544L222.141,327C223.124,325.584,223.508,323.832,223.244,322.152z"/>
		</svg>
	);

	const PlugIcon = () => (
		<img 
			className="w-16 h-16" 
			src="/icons/plug.png" 
			alt="plug"
		/>
	);

	return (
		<IonPage className="ion-page-width">
			<HomeHeader />
			<IonContent className="ion-padding">
				<div className="page-outer">
					<div className="page-body">
						{/* Page Heading */}
						<section className="hero-block flex-row gap-4 max-h-[30vh]">
							<div className="flex flex-col items-center gap-3">
								<div className="text-medium font-bold text-2xl">Node Up</div>
								<IonIcon icon={flashOutline} className="text-6xl text-medium" />
							</div>
						</section>

						{/* Cards */}
						<section className="main-block flex flex-col gap-4">
							{/* Bootstrap Card */}
							<div 
								className="rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:brightness-110"
								style={{ 
									backgroundColor: selectedOption === "bootstrap" 
										? 'var(--ion-color-primary)' 
										: 'var(--ion-color-secondary)',
									boxShadow: 'var(--wallet-box-shadow)'
								}}
								onClick={handleSelectOption("bootstrap")}
							>
								<div className="flex justify-between items-center gap-4">
									<div className="flex-1">
										<h2 className={cn(
											"text-2xl font-bold m-0 mb-2",
											selectedOption === "bootstrap" ? "text-white" : "text-high"
										)}>Bootstrap</h2>
										<p className={cn(
											"text-base m-0",
											selectedOption === "bootstrap" ? "text-white/80" : "text-low"
										)}>
											Build a service credit with the default liquidity provider and upgrade later.*
										</p>
									</div>
									<div 
										className="flex-shrink-0"
										style={{ color: selectedOption === "bootstrap" ? 'white' : 'var(--ion-color-primary)' }}
									>
										<HandshakeIcon />
									</div>
								</div>
							</div>

							{/* Node Connection Card */}
							<div 
								className="rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:brightness-110"
								style={{ 
									backgroundColor: selectedOption === "connection" 
										? 'var(--ion-color-primary)' 
										: 'var(--ion-color-secondary)',
									boxShadow: 'var(--wallet-box-shadow)'
								}}
								onClick={handleSelectOption("connection")}
							>
								<div className="flex justify-between items-center gap-4">
									<div className="flex-1">
										<h2 className={cn(
											"text-2xl font-bold m-0 mb-2",
											selectedOption === "connection" ? "text-white" : "text-high"
										)}>Node Connection</h2>
										<p className={cn(
											"text-base m-0",
											selectedOption === "connection" ? "text-white/80" : "text-low"
										)}>
											Enter a connection string (nprofile) to connect to a remote node over nostr.
										</p>
									</div>
									<div 
										className="flex-shrink-0"
										style={{ 
											filter: selectedOption === "connection"
												? 'brightness(0) invert(1)'
												: 'invert(59%) sepia(57%) saturate(2064%) hue-rotate(166deg) brightness(96%) contrast(87%)'
										}}
									>
										<PlugIcon />
									</div>
								</div>
							</div>
						</section>

						{/* Connect Button */}
						<section className="main-block mt-8">
							<div className="mx-auto w-[60%]">
								<IonButton
									className="pill-button"
									expand="full"
									size="large"
									shape="round"
									disabled={!selectedOption}
									onClick={handleConnect}
								>
									Connect
								</IonButton>
							</div>
						</section>

						{/* Disclaimer */}
						<section className="disclaimer-block text-low pb-2">
							By proceeding you acknowledge that this is bleeding-edge software,
							and agree to the providers{" "}
							<a
								href="https://docs.shock.network/terms/"
								target="_blank"
								rel="noreferrer"
								className="underline text-high"
							>
								terms
							</a>{" "}
							regarding any services herein.
						</section>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
}

export default BootstrapSource;
