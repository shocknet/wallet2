import SectionDivider from "@/Components/common/ui/sectionDivider";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { useDownloadFileBackup } from "@/Hooks/useDownloadFileBackup";
import { useEffectiveTheme } from "@/Hooks/useEffectiveTheme";
import { useEncryptWithPassword } from "@/Hooks/useEncryptWithPassword";
import { useToast } from "@/lib/contexts/useToast";
import { makeIdentityPrivateKeyPmUsername } from "@/lib/pmParams";
import { RuntimeIdentity, RuntimeIdentityExtension, RuntimeIdentityKeys, RuntimeIdentitySanctum } from "@/shell/types";
import { getSanctumIdentitySdk } from "@/State/identitiesRegistry/helpers/sanctumIdentitySdkManager";
import { identitiesRegistryActions, selectIdentityByPubkey } from "@/State/identitiesRegistry/slice";
import { IdentityKeys, IdentityType } from "@/State/identitiesRegistry/types";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { Capacitor } from "@capacitor/core";
import { IonButton, IonChip, IonIcon, IonInput, IonLabel } from "@ionic/react";
import { hexToBytes } from "@noble/hashes/utils";
import { alertCircleOutline, cloudOutline, extensionPuzzleOutline, lockClosedOutline } from "ionicons/icons";
import { nip19 } from "nostr-tools";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";

interface IdentitySecuritySectionProps {
	runtimeIdentity: RuntimeIdentity;
}
export function IdentitySecuritySection({ runtimeIdentity }: IdentitySecuritySectionProps) {

	const SwitchWrapper = useMemo(() => {
		switch (runtimeIdentity.type) {
			case IdentityType.LOCAL_KEY:
				return <LocalKeySecuritySection runtimeIdentity={runtimeIdentity} />;
			case IdentityType.NIP07:
				return <Nip07SecuritySection runtimeIdentity={runtimeIdentity} />;
			case IdentityType.SANCTUM:
				return <SanctumSecuritySection runtimeIdentity={runtimeIdentity} />;
		}
	}, [runtimeIdentity]);
	return (
		<section className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
			<h2 className="text-base font-semibold tracking-tight text-primary mb-2">
				Security
			</h2>
			{SwitchWrapper}
		</section>
	)

}


function LocalKeySecuritySection({ runtimeIdentity }: { runtimeIdentity: RuntimeIdentityKeys }) {
	const registryIdentity = useAppSelector((state) => selectIdentityByPubkey(state, runtimeIdentity.pubkey))! as IdentityKeys;
	const dispatch = useAppDispatch();
	const { showToast } = useToast();

	const encryptWithPassword = useEncryptWithPassword(
		runtimeIdentity.privateKey,
		makeIdentityPrivateKeyPmUsername(runtimeIdentity.pubkey),
		"Create a password to secure your local secret"
	);

	const handleEncryptWithPassword = useCallback(async () => {
		const envelope = await encryptWithPassword();
		if (!envelope) return;
		dispatch(identitiesRegistryActions.setLocalSecretStorage({
			pubkey: runtimeIdentity.pubkey,
			localSecret: {
				storage: "inline_encrypted",
				encryptedPrivkey: envelope
			},
		}));
		showToast({
			message: "Local secret encrypted with password",
			color: "success",
			icon: "checkmark-circle",
			duration: 2000,
		});
	}, [encryptWithPassword, dispatch, runtimeIdentity, showToast]);

	const handleDownloadFileBackup = useDownloadFileBackup({ publicKey: runtimeIdentity.pubkey, privateKey: runtimeIdentity.privateKey });

	const pmUsername = useMemo(() => makeIdentityPrivateKeyPmUsername(runtimeIdentity.pubkey), [runtimeIdentity]);

	const nsec = useMemo(() => nip19.nsecEncode(hexToBytes(runtimeIdentity.privateKey)), [runtimeIdentity]);



	/* This is to allow password manager to trigger as it needs the input to have changed */
	const recoveryInputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (recoveryInputRef.current) {
			recoveryInputRef.current.value = nsec;
			const event = new Event('input', { bubbles: true });
			console.log("dispatching event", event);
			recoveryInputRef.current.dispatchEvent(event);
		}
	}, [nsec]);

	const isPasswordEncrypted = registryIdentity.localSecret.storage === "inline_encrypted";
	const isWeb = !Capacitor.isNativePlatform();

	return (
		<>
			{isPasswordEncrypted ? (
				<div className="mb-4">
					<IonChip
						className="
							m-0 h-auto min-h-0 px-2.5 py-1 text-xs tracking-wide
							bg-[color-mix(in_srgb,var(--ion-color-success)_14%,transparent)]
							text-[var(--ion-color-success)]
						"
					>
						<IonIcon
							icon={lockClosedOutline}
							color="success"
							className="text-sm"
						/>
						<IonLabel className="text-xs text-[var(--ion-color-success)]">
							Password encrypted
						</IonLabel>
					</IonChip>
				</div>
			) : isWeb ? (
				<div className="mb-4">
					<p className="text-sm leading-6 text-muted mb-3">
						<span><IonIcon icon={alertCircleOutline} color="warning" className="text-sm pr-1 mt-1" /></span>
						This profile&apos;s secret key is stored unencrypted in
						this browser. Encrypt it with a password for better
						protection.
					</p>
					<IonButton
						className="[--border-radius:12px]"
						color="secondary"
						onClick={handleEncryptWithPassword}
						expand="block"
					>
						Encrypt this identity
					</IonButton>
				</div>
			) : null}

			<SectionDivider title="Back up your secret key" className="mt-7" />
			<p className="text-sm leading-6 text-muted mt-2">
				Back up your secret key so you can recover
				this profile on another device.
			</p>
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
					className="absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
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
					className="filled-input min-h[2.5rem]"
					readonly
					type="password"
					fill="solid"
					mode="md"
					value={nsec}
				>
					<CopyMorphButton
						value={nsec}
						size="small"
						fill="clear"
						slot="end"
						aria-label="copy"
					/>
				</IonInput>
				<IonButton
					className="[--border-radius:12px] mt-3"
					color="medium"
					expand="block"
					type="submit"
				>
					Save to Passwords Manager
				</IonButton>
			</form>
			<div className="w-full px-5">
				<SectionDivider title="or" className="my-4" />
			</div>
			<IonButton
				className="[--border-radius:12px]"
				expand="block"
				color="dark"


				onClick={handleDownloadFileBackup}
			>
				Downloads File Backup
			</IonButton>
		</>
	)




}


function Nip07SecuritySection({ runtimeIdentity: _runtimeIdentity }: { runtimeIdentity: RuntimeIdentityExtension }) {
	return (
		<div className="flex items-start gap-3">
			<div
				className="
				mt-0.5 flex size-9 shrink-0 items-center
				justify-center rounded-xl
				bg-[var(--app-surface-muted)]
				text-[var(--ion-color-primary)]
			"
			>
				<IonIcon icon={extensionPuzzleOutline} />
			</div>
			<div>
				<p className="text-sm font-medium text-primary">
					Browser extension
				</p>
				<p className="mt-1 text-sm leading-6 text-muted">
					Keys are managed by your Nostr
					extension. Export and backups happen
					there, not in this app.
				</p>
			</div>
		</div>
	)
}


function SanctumSecuritySection({ runtimeIdentity }: { runtimeIdentity: RuntimeIdentitySanctum }) {
	const id = useId();
	const effectiveTheme = useEffectiveTheme();


	useEffect(() => {
		const sdk = getSanctumIdentitySdk(runtimeIdentity.pubkey);
		if (!sdk) return;
		sdk.widget.mount({
			containerId: id,
			theme: effectiveTheme,
			showLogoutButton: false,
		});
		return () => {
			sdk.widget.unmount();
		};
	}, [effectiveTheme, runtimeIdentity.pubkey, id]);


	return (
		<div>
			<div className="flex items-start gap-3">
				<div
					className="
						mt-0.5 flex size-9 shrink-0 items-center
						justify-center rounded-xl
						bg-[var(--app-surface-muted)]
						text-[var(--ion-color-primary)]
					"
				>
					<IonIcon icon={cloudOutline} />
				</div>
				<div>
					<p className="text-sm font-medium text-primary">
						Sanctum session
					</p>
					<p className="mt-1 text-sm leading-6 text-muted">
						{runtimeIdentity.tokensData
							? "Signed in. If access expires, you will be asked to sign in again."
							: "Session needs refresh. You will be prompted to sign in again when required."}
						{runtimeIdentity.reauthReason
							? ` (${runtimeIdentity.reauthReason})`
							: ""}
					</p>
				</div>
			</div>
			<div className="mt-3" id={id} />
		</div>
	)
}

