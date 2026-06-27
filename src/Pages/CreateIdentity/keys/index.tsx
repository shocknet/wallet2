import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonContent,
	IonButton,
	useIonRouter,
	IonButtons,
	IonBackButton,
	useIonLoading,
	IonCard,
	IonCardContent,
	IonFooter,
} from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { useAppDispatch } from "@/State/store/hooks";
import { useToast } from "@/lib/contexts/useToast";
import { RouteComponentProps } from "react-router";
import { chevronBackOutline } from "ionicons/icons";
import { normalizeWsUrl } from "@/lib/url";
import { NOSTR_RELAYS } from "@/constants";
import SectionDivider from "@/Components/common/ui/sectionDivider";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";




type Nip07Probe = "absent" | "unsupported" | "ready";

function readNip07ExtensionState(): Nip07Probe {
	const w = window as unknown as { nostr?: { nip44?: unknown; nip04?: unknown } };
	if (!w?.nostr) return "absent";
	if (w.nostr.nip44 || w.nostr.nip04) return "ready";
	return "unsupported";
}

const CreateKeysIdentityPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const [presentLoading, dismissLoading] = useIonLoading();


	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const router = useIonRouter();
	const [nip07Probe, setNip07Probe] = useState<Nip07Probe>(readNip07ExtensionState());


	useEffect(() => {
		const probeNip07 = () => {
			setNip07Probe(readNip07ExtensionState());
		}
		probeNip07();
		window.addEventListener("focus", probeNip07);
		const interval = window.setInterval(probeNip07, 600);
		const clearIntervalTimer = window.setTimeout(() => window.clearInterval(interval), 8000);
		return () => {
			window.clearInterval(interval);
			window.clearTimeout(clearIntervalTimer);
			window.removeEventListener("focus", probeNip07);
		};
	}, []);




	const handleUseNip07Extension = useCallback(async () => {
		if (nip07Probe !== "ready") return;
		await presentLoading({
			message: "Creating profile...",
		});
		try {
			const { foundBackup } = await dispatch(createIdentity({
				type: IdentityType.NIP07,
				label: "Nostr extension",
				relays: NOSTR_RELAYS.map(normalizeWsUrl)
			}));
			if (foundBackup) {
				router.push("/sources", "root", "replace");
			} else {
				router.push("/identity/bootstrap", "root", "replace");
			}
		} catch (err: unknown) {
			await dismissLoading();
			showToast({
				color: "warning",
				message: err instanceof Error ? err.message : "Could not use the Nostr extension",
			});
		} finally {
			dismissLoading();
		}

	}, [dispatch, showToast, presentLoading, dismissLoading, router, nip07Probe]);

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton text="Back" icon={chevronBackOutline} defaultHref="/identity/create"></IonBackButton>
					</IonButtons>
				</IonToolbar>
				<div className="w-[93%] mx-auto flex flex-col justify-center items-center gap-10">
					<ShockwalletHero />
				</div>
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="min-h-full flex flex-col gap-12 justify-center items-center ">
					<div className="text-lg font-normal tracking-tight text-center text-secondary">
						Access your money.
					</div>
					<IonCard
						className="w-full rounded-xl max-w-md [--background:var(--app-surface-elevated)]"
					>
						<IonCardContent>
							<div className="w-full flex flex-col items-center justify-center gap-3">
								<IonButton
									className="w-full [--border-radius:12px]"
									fill="solid"
									color="tertiary"
									size="large"
									expand="block"
									routerLink="/identity/create/keys/import"
								>
									Use Nostr Key
								</IonButton>
								<IonButton className="w-full [--border-radius:12px]" color="primary" fill="solid" size="large" expand="block" routerLink="/identity/create/keys/generate">
									Generate New
								</IonButton>
								{
									nip07Probe === "ready" && (
										<>
											<div className="w-full py-4">
												<SectionDivider title="OR" />
											</div>
											<IonButton
												color="dark"
												className="w-full [--border-radius:12px]"
												fill="solid"
												size="large"
												expand="block"
												onClick={handleUseNip07Extension}
											>
												Use Browser Extension
											</IonButton>
										</>
									)
								}
							</div>
						</IonCardContent>
					</IonCard>
					{
						nip07Probe === "unsupported" && (
							<div className="text-secondary text-center text-base leading-relaxed tracking-wide px-6">
								<span className="font-semibold">*Note:</span> a Nostr extension is present but does not expose NIP-04 or NIP-44, which this app needs for encrypted sync.
							</div>
						)
					}
				</div>
			</IonContent>
			<IonFooter className="ion-no-border">
				<DisclaimerFooter />
			</IonFooter>
		</IonPage >
	);
}

export default CreateKeysIdentityPage;
