import { generateNewKeyPair } from "@/Api/helpers";
import { useAskCreatePassword } from "@/Components/password/CreatePasswordModal";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { NOSTR_RELAYS } from "@/constants";
import { useToast } from "@/lib/contexts/useToast";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { useAppDispatch } from "@/State/store/hooks";
import { Capacitor } from "@capacitor/core";
import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonContent,
	IonInput,
	IonButton,
	IonButtons,
	IonBackButton,
	IonText,
	IonCard,
	IonCardContent,
	useIonLoading,
	useIonRouter,
	useIonViewWillEnter,
	useIonViewWillLeave,
	IonFooter,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import { makeIdentityFileBackupPmUsername, makeIdentityPrivateKeyPmUsername } from "../../../lib/pmParams";
import { nip19 } from "nostr-tools";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import { chevronBackOutline } from "ionicons/icons";
import { downloadNsecBackup } from "@/lib/file-backup";

const GenerateNewKeyPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const askCreatePassword = useAskCreatePassword();
	const [presentLoading, dismissLoading] = useIonLoading();
	const { showToast } = useToast();
	const router = useIonRouter();
	const dispatch = useAppDispatch();


	const [generatedPair, setGeneratedPair] = useState<ReturnType<typeof generateNewKeyPair> | null>(null);
	const pmUsername = useMemo(() => generatedPair ? makeIdentityPrivateKeyPmUsername(generatedPair.publicKey) : "", [generatedPair]);


	useIonViewWillEnter(() => {
		const pair = generateNewKeyPair();
		setGeneratedPair(pair);
	});
	useIonViewWillLeave(() => {
		setGeneratedPair(null);
	});


	/* This is to allow password manager to trigger as it needs the input to have changed */
	const recoveryInputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (recoveryInputRef.current) {
			recoveryInputRef.current.value = generatedPair ? nip19.nsecEncode(generatedPair.privateKeyBytes) : "";
			const event = new Event('input', { bubbles: true });
			console.log("dispatching event", event);
			recoveryInputRef.current.dispatchEvent(event);
		}
	}, [generatedPair]);


	const completeIdentityCreation = useCallback(async () => {
		if (!generatedPair) return;
		const isWeb = !Capacitor.isNativePlatform();
		let userPassword: string | undefined = undefined
		if (isWeb) {
			const password = await askCreatePassword({
				username: pmUsername,
				description: "Create a password to secure your private key. You may skip this now and set it later in the profile settings.",
				cancelButtonLabel: "Skip",
			});
			if (password) {
				userPassword = password;
			}
		}
		await presentLoading({
			message: "Creating identity...",
		});
		try {
			const { foundBackup } = await dispatch(createIdentity({
				type: IdentityType.LOCAL_KEY,
				privkey: generatedPair.privateKey,
				label: "New Nostr Key Identity",
				relays: NOSTR_RELAYS,
				userPassword: userPassword,
			}));
			if (foundBackup) {
				router.push("/sources", "root", "replace");
			} else {
				router.push("/identity/bootstrap", "root", "replace");
			}
		} catch (err: any) {
			await dismissLoading();
			showToast({
				color: "warning",
				message: err?.message || "An error occured when creating the identity",
			});
		} finally {
			dismissLoading();
		}

	}, [askCreatePassword, dispatch, presentLoading, dismissLoading, pmUsername, router, showToast, generatedPair]);

	const handleDownloadFileBackup = useCallback(async () => {
		if (!generatedPair) return;
		const passphrase = await askCreatePassword({
			username: makeIdentityFileBackupPmUsername(generatedPair.publicKey),
			description: "Create a password to encrypt your file backup with. You will need to enter this password when importing the backup file on a different device.",
		});
		if (!passphrase) return;
		try {
			await downloadNsecBackup(generatedPair.privateKey, passphrase);
		} catch (err: unknown) {
			showToast({
				color: "warning",
				message: err instanceof Error ? err.message : "An error occured when downloading the file backup",
			});
		}

	}, [generatedPair, askCreatePassword, showToast]);


	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton text="Back" icon={chevronBackOutline} defaultHref="/identity/create" />
					</IonButtons>
				</IonToolbar>
				<div className="w-[93%] mx-auto flex flex-col justify-center items-center gap-10">
					<ShockwalletHero />
				</div>
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="min-h-full flex flex-col gap-12 justify-center items-center">
					<div className="text-lg font-normal tracking-tight text-center text-secondary">
						Backup your Account Keys
					</div>
					<IonCard
						className="w-full rounded-xl max-w-md [--background:var(--app-surface-elevated)]"
					>
						<IonCardContent>
							<div className="flex w-full flex-col items-center justify-center gap-2">
								<IonText className="text-secondary font-medium text-base text-center mb-2">
									Save this key to your preferred password manager, you may use it to log in and sync across devices, or recover your node connections and settings if you get logged out.
								</IonText>
								<form
									method="post"
									className="w-full"
									onSubmit={(e) => e.preventDefault()}
								>
									<input
										type="text"
										name="username"
										autoComplete="username"
										value={pmUsername}
										readOnly
										className="absolute left-[10000px] h-px w-px overflow-hidden"
									/>

									<input
										ref={recoveryInputRef}
										name="password"
										autoComplete="new-password"
										type="password"
										defaultValue=""
										readOnly
										className="hidden"
									/>
									<IonInput



										label="Nostr key"
										labelPlacement="stacked"
										className="filled-input"
										readonly
										type="password"
										fill="solid"
										mode="md"
										value={generatedPair ? nip19.nsecEncode(generatedPair.privateKeyBytes) : ""}
									>
										<CopyMorphButton
											value={generatedPair ? nip19.nsecEncode(generatedPair.privateKeyBytes) : ""}
											size="small"
											fill="clear"
											slot="end"
											aria-label="copy"
										/>
									</IonInput>
									<IonButton
										className="w-full [--border-radius:12px] mt-3"
										color="medium"
										fill="solid"
										size="large"
										expand="block"
										type="submit"
									>
										Save to Passwords Manager
									</IonButton>
								</form>
								<IonButton
									className="w-full [--border-radius:12px]"
									color="primary"
									fill="solid"
									size="large"
									expand="block"
									onClick={completeIdentityCreation}
								>
									Continue
								</IonButton>
								<IonButton
									className="w-full [--border-radius:12px]"
									color="dark"
									fill="solid"
									size="large"
									expand="block"
									onClick={handleDownloadFileBackup}
								>
									Downloads File Backup
								</IonButton>
							</div>
						</IonCardContent>
					</IonCard>
				</div>

			</IonContent>
			<IonFooter className="ion-no-border">
				<DisclaimerFooter />
			</IonFooter>
		</IonPage>
	);
};
export default GenerateNewKeyPage;
