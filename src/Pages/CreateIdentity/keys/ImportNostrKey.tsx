import { generateNewKeyPair } from "@/Api/helpers";
import SectionDivider from "@/Components/common/ui/sectionDivider";
import { useAskCreatePassword } from "@/Components/password/CreatePasswordModal";
import { useAskPassword } from "@/Components/password/InputPasswordModal";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { NOSTR_RELAYS } from "@/constants";
import { useToast } from "@/lib/contexts/useToast";
import { importBackupFileText } from "@/lib/file-backup";
import { getSourcesFromLegacyFileBackup, SourceToMigrate } from "@/State/identitiesRegistry/helpers/migrateToIdentities";
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
	IonCard,
	IonCardContent,
	useIonLoading,
	useIonRouter,
	IonFooter,
} from "@ionic/react";
import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import { chevronBackOutline } from "ionicons/icons";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import { makeIdentityPrivateKeyPmUsername } from "@/lib/pmParams";
import { getPublicKey } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";

const ImportNostrKeyPage: React.FC<RouteComponentProps> = (_props: RouteComponentProps) => {
	const dispatch = useAppDispatch();
	const askInputPassword = useAskPassword();
	const askCreatePassword = useAskCreatePassword();
	const [presentLoading, dismissLoading] = useIonLoading();
	const router = useIonRouter();
	const { showToast } = useToast();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [privKey, setPrivKey] = useState("");

	const inputPriveKeyIsValid = privKey.length === 64 && /^[0-9a-f]{64}$/i.test(privKey);

	const pmUsername = useMemo(() => privKey ? makeIdentityPrivateKeyPmUsername(getPublicKey(hexToBytes(privKey))) : "", [privKey]);




	const completeIdentityCreation = useCallback(async (privKey: string, sources: SourceToMigrate[]) => {
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
				privkey: privKey,
				label: "New Nostr Key Identity",
				relays: NOSTR_RELAYS,
				userPassword: userPassword,
			}, sources));
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

	}, [askCreatePassword, dispatch, presentLoading, dismissLoading, router, showToast, pmUsername]);


	const handleImportNostrKey = useCallback(() => {
		if (!inputPriveKeyIsValid) return;
		completeIdentityCreation(privKey, []);
	}, [inputPriveKeyIsValid, privKey, completeIdentityCreation]);


	const getDatafromFileBackup = useCallback(
		async (e: ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) {
				e.target.value = "";
				return;
			}

			let fileText: string;
			try {
				fileText = await file.text();
			} catch {
				showToast({
					color: "danger",
					message: "An error occured when reading the file",
				});
				e.target.value = "";
				return;
			}

			const password = await askInputPassword({
				title: "Decrypt backup file",
				description: "Enter the password for this backup file",
				username: "shockwallet-backup-file",
			});

			if (!password) {
				e.target.value = "";
				return;
			}

			let privKey: string;
			let sources: SourceToMigrate[] = [];

			try {
				const res = await importBackupFileText(fileText, password);
				if (res.kind === "nsec") {
					privKey = res.nsec;
				} else {

					sources = getSourcesFromLegacyFileBackup(res.parsed);
					if (!sources.length) {
						showToast({
							color: "danger",
							message: "No sources found in this legacy file backup.",
						});
						e.target.value = "";
						return;
					}
					const { privateKey } = generateNewKeyPair();
					privKey = privateKey;

				}
			} catch (err: unknown) {
				showToast({
					color: "danger",
					message:
						err instanceof Error
							? err.message
							: "An unknown error occured when importing the file backup.",
				});
				e.target.value = "";
				return;
			}
			e.target.value = "";

			completeIdentityCreation(privKey, sources);
		},
		[askInputPassword, showToast, completeIdentityCreation]
	);


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
						Access your money.
					</div>
					<IonCard
						className="w-full rounded-xl max-w-md [--background:var(--app-surface-elevated)]"
					>
						<IonCardContent>
							<div className="flex w-full flex-col items-center justify-center gap-3">
								<IonInput
									placeholder="Enter existing Nsec"
									label="Nostr key"
									labelPlacement="stacked"
									className="filled-input"
									value={privKey}
									onIonInput={(e) => setPrivKey(e.detail.value || "")}
									fill="solid"
									mode="md"
								/>
								<IonButton
									disabled={!inputPriveKeyIsValid}
									className="w-full [--border-radius:12px]"
									color="tertiary"
									fill="solid"
									size="large"
									expand="block"
									onClick={handleImportNostrKey}
								>
									Use Nostr Key
								</IonButton>
								<div className="w-full py-4">
									<SectionDivider title="OR" />
								</div>
								<input
									ref={fileInputRef}
									type="file"
									className="hidden"
									onChange={getDatafromFileBackup}
								/>
								<IonButton
									className="w-full [--border-radius:12px]"
									color="medium"
									fill="solid"
									size="large"
									expand="block"
									onClick={() => fileInputRef.current?.click()}
								>
									Import from file backup
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

export default ImportNostrKeyPage;
