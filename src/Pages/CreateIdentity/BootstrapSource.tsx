import {
	IonPage,
	IonContent,
	IonButton,
	useIonRouter,
	IonIcon,
	useIonModal,
	IonImg,
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

	return (
		<IonPage className="ion-page-width">
			<HomeHeader>

			</HomeHeader>
			<IonContent className="ion-padding">
				<div className="page-outer">
					<div className="page-body">
						<section className="hero-block flex-row gap-4 max-h-[30vh]">
							<div className="flex flex-col items-center gap-3">
								<div className="text-medium font-bold text-2xl">Node Up</div>
								<IonIcon icon={flashOutline} className="text-6xl text-medium" />
							</div>
						</section>
						<section className="main-block flex flex-col justify-center w-full">
							<div className="flex justify-center gap-3 md:gap-8">
								<div
									className={cn(
										"choice-card",
										selectedOption === "bootstrap" && "bg-[#154162]"
									)}
									onClick={handleSelectOption("bootstrap")}
								>
									<div className="choice-card-title text-medium">
										Bootstrap
									</div>
									<IonImg className="w-12 h-auto text-high" src="/icons/handshake.png" />
									<div className="text-center text-base text-medium">
										Build a service credit with the default liquidity provider and upgrade later.*
									</div>
								</div>
								<div

									onClick={handleSelectOption("connection")}
									className={cn(
										"choice-card",
										selectedOption === "connection" && "bg-[#154162]"
									)}
								>
									<div className="choice-card-title text-medium">
										Node Connection
									</div>
									<IonImg className="w-12 h-auto text-high" src="/icons/plug.png" />
									<div className="text-center text-base text-medium">
										Enter a connection string (nprofile) to connect to a remote node over nostr.
									</div>
								</div>
							</div>
						</section>

						<section className="main-block mt-20">
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
