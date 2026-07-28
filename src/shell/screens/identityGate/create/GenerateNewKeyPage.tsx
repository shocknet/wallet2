import { generateNewKeyPair } from "@/Api/helpers";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { NOSTR_RELAYS } from "@/constants";
import { useToast } from "@/lib/contexts/useToast";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { useAppDispatch } from "@/State/store/hooks";
import { enqueueBootstrapIfNoBackup } from "@/shell/pendingNav";
import { Capacitor } from "@capacitor/core";
import {
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
	IonFooter,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { makeIdentityPrivateKeyPmUsername } from "@/lib/pmParams";
import { nip19 } from "nostr-tools";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import { chevronBackOutline } from "ionicons/icons";
import { useAskCreatePassword } from "@/Hooks/useAskCreatePassword";
import { hexToBytes } from "@noble/hashes/utils";
import { useDownloadFileBackup } from "@/Hooks/useDownloadFileBackup";


export function GenerateNewKeyPage() {
	const generatedPair = useMemo(() => generateNewKeyPair(), []);


	const [presentLoading, dismissLoading] = useIonLoading();
	const { showToast } = useToast();
	const dispatch = useAppDispatch();
	const handleDownloadFileBackup = useDownloadFileBackup(generatedPair);

	const privateKeyBytes = useMemo(() => hexToBytes(generatedPair.privateKey), [generatedPair]);
	const pmUsername = useMemo(() => generatedPair ? makeIdentityPrivateKeyPmUsername(generatedPair.publicKey) : "", [generatedPair]);
	const askCreatePassword = useAskCreatePassword(
		pmUsername,
		"Create a password to secure your private key. You may skip this now and set it later in the profile settings.",
		"Skip",
	);




	/* This is to allow password manager to trigger as it needs the input to have changed */
	const recoveryInputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (recoveryInputRef.current) {
			recoveryInputRef.current.value = generatedPair ? nip19.nsecEncode(privateKeyBytes) : "";
			const event = new Event('input', { bubbles: true });
			console.log("dispatching event", event);
			recoveryInputRef.current.dispatchEvent(event);
		}
	}, [generatedPair, privateKeyBytes]);


	const completeIdentityCreation = useCallback(async () => {
		if (!generatedPair) return;
		const isWeb = !Capacitor.isNativePlatform();
		let userPassword: string | undefined = undefined
		if (isWeb) {
			const password = await askCreatePassword();
			if (password) {
				userPassword = password;
			}
		}
		await presentLoading({
			message: "Creating identity...",
		});
		try {
			const { foundBackup, identityId } = await dispatch(createIdentity({
				type: IdentityType.LOCAL_KEY,
				privkey: generatedPair.privateKey,
				label: "New Nostr Key Identity",
				relays: NOSTR_RELAYS,
				userPassword: userPassword,
			}));
			dispatch(enqueueBootstrapIfNoBackup({ foundBackup, identityId }));
		} catch (err: any) {
			await dismissLoading();
			showToast({
				color: "warning",
				message: err?.message || "An error occured when creating the identity",
			});
		} finally {
			dismissLoading();
		}

	}, [askCreatePassword, dispatch, presentLoading, dismissLoading, showToast, generatedPair]);




	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton text="Back" icon={chevronBackOutline} defaultHref="/profile/create" />
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="min-h-full flex flex-col justify-center items-center">
					<ShockwalletHero size="lg" tagline="Backup your Account Keys" />

					<IonCard
						className="w-full rounded-xl max-w-md [--background:var(--app-surface-elevated)] mt-7"
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
										value={generatedPair ? nip19.nsecEncode(privateKeyBytes) : ""}
									>
										<CopyMorphButton
											value={generatedPair ? nip19.nsecEncode(privateKeyBytes) : ""}
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
		</>
	);
}

