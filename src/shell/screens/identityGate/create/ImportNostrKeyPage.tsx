import { generateNewKeyPair } from "@/Api/helpers";
import SectionDivider from "@/Components/common/ui/sectionDivider";
import { ShockwalletHero } from "@/Components/common/ui/ShockwalletHero";
import { DisclaimerFooter } from "@/Components/common/info/disclaimerFooter";
import { NOSTR_RELAYS } from "@/constants";
import { useAskCreatePassword } from "@/Hooks/useAskCreatePassword";
import { useAskPassword } from "@/Hooks/useAskPassword";
import { useToast } from "@/lib/contexts/useToast";
import { importBackupFileText } from "@/lib/file-backup";
import { makeIdentityPrivateKeyPmUsername } from "@/lib/pmParams";
import {
	getSourcesFromLegacyFileBackup,
	type SourceToMigrate,
} from "@/shell/migrations/deviceToIdentities/legacySources";
import { createIdentity } from "@/State/identitiesRegistry/thunks";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { useAppDispatch } from "@/State/store/hooks";
import { enqueueBootstrapIfNoBackup } from "@/shell/pushIntent";
import { Capacitor } from "@capacitor/core";
import { hexToBytes } from "@noble/hashes/utils";
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonContent,
	IonFooter,
	IonHeader,
	IonInput,
	IonToolbar,
	useIonLoading,
} from "@ionic/react";
import { chevronBackOutline } from "ionicons/icons";
import { getPublicKey } from "nostr-tools";
import {
	type ChangeEvent,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";

export function ImportNostrKeyPage() {
	const dispatch = useAppDispatch();
	const askInputPassword = useAskPassword(
		"shockwallet-backup-file",
		"Enter the password for this backup file",
	);
	const [presentLoading, dismissLoading] = useIonLoading();
	const { showToast } = useToast();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [privKey, setPrivKey] = useState("");

	const inputPrivKeyIsValid =
		privKey.length === 64 && /^[0-9a-f]{64}$/i.test(privKey);

	const pmUsername = useMemo(
		() =>
			privKey
				? makeIdentityPrivateKeyPmUsername(
					getPublicKey(hexToBytes(privKey)),
				)
				: "",
		[privKey],
	);

	const askCreatePassword = useAskCreatePassword(
		pmUsername,
		"Create a password to secure your private key. You may skip this now and set it later in the profile settings.",
		"Skip",
	);

	const completeIdentityCreation = useCallback(
		async (key: string, _sources: SourceToMigrate[]) => {
			let userPassword: string | undefined;
			if (!Capacitor.isNativePlatform()) {
				const password = await askCreatePassword();
				if (password) {
					userPassword = password;
				}
			}

			await presentLoading({
				message: "Creating profile...",
			});
			try {
				const { foundBackup, identityId } = await dispatch(
					createIdentity({
						type: IdentityType.LOCAL_KEY,
						privkey: key,
						label: "New Nostr Key Identity",
						relays: NOSTR_RELAYS,
						userPassword,
					}),
				);
				dispatch(enqueueBootstrapIfNoBackup({ foundBackup, identityId }));
			} catch (err: unknown) {
				showToast({
					color: "warning",
					message:
						err instanceof Error
							? err.message
							: "An error occured when creating the identity",
				});
			} finally {
				await dismissLoading();
			}
		},
		[askCreatePassword, dispatch, presentLoading, dismissLoading, showToast],
	);

	const handleImportNostrKey = useCallback(() => {
		if (!inputPrivKeyIsValid) return;
		void completeIdentityCreation(privKey, []);
	}, [inputPrivKeyIsValid, privKey, completeIdentityCreation]);

	const getDataFromFileBackup = useCallback(
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

			const password = await askInputPassword();
			if (!password) {
				e.target.value = "";
				return;
			}

			let importedKey: string;
			let sources: SourceToMigrate[] = [];

			try {
				const res = await importBackupFileText(fileText, password);
				if (res.kind === "nsec") {
					importedKey = res.nsec;
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
					importedKey = generateNewKeyPair().privateKey;
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
			void completeIdentityCreation(importedKey, sources);
		},
		[askInputPassword, showToast, completeIdentityCreation],
	);

	return (
		<>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton text="Back" icon={chevronBackOutline} />
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="min-h-full flex flex-col gap-10 justify-center items-center">
					<div className="w-full max-w-md flex flex-col items-center gap-6 pt-2">
						<ShockwalletHero
							size="md"
							tagline="Import an existing key or a file backup."
						/>
					</div>

					<IonCard className="w-full rounded-xl max-w-md [--background:var(--app-surface-elevated)]">
						<IonCardContent>
							<div className="flex w-full flex-col items-center justify-center gap-3">
								<IonInput
									placeholder="Enter existing nsec or hex key"
									label="Nostr key"
									labelPlacement="stacked"
									className="filled-input"
									value={privKey}
									onIonInput={(e) =>
										setPrivKey(e.detail.value || "")
									}
									fill="solid"
									mode="md"
								/>
								<IonButton
									disabled={!inputPrivKeyIsValid}
									className="w-full [--border-radius:12px]"
									color="tertiary"
									fill="solid"
									size="large"
									expand="block"
									onClick={handleImportNostrKey}
								>
									Use Nostr key
								</IonButton>
								<div className="w-full py-4">
									<SectionDivider title="OR" />
								</div>
								<input
									ref={fileInputRef}
									type="file"
									className="hidden"
									onChange={getDataFromFileBackup}
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
		</>
	);
}
