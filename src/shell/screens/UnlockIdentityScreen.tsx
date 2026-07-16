import { selectIdentityByPubkey } from "@/State/identitiesRegistry/slice";
import { UnlockReason } from "../types";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	IonButton,
	IonContent,
	IonIcon,
	IonPage,
	IonSpinner,
} from "@ionic/react";
import { Identity, IdentityType } from "@/State/identitiesRegistry/types";
import {
	alertCircleOutline,
	lockClosedOutline,
	swapHorizontalOutline,
} from "ionicons/icons";
import { ProfileCard } from "@/Components/User/ProfileCard";
import { ScreenIntro } from "@/Components/common/ui/ScreenIntro";
import {
	cancelIdentityUnlock,
	proceedAfterIdentityUnlocked,
} from "../coordinator";
import { useCallback, useEffect, useRef, useState } from "react";
import { makeIdentityPrivateKeyPmUsername } from "@/lib/pmParams";
import { unlockIdentity } from "@/State/identitiesRegistry/helpers/unlockIdentity";
import { useToast } from "@/lib/contexts/useToast";
import { withDeviceAuth } from "@/lib/deviceAuth/guard";
import { useDispatch } from "@/State/store/store";
import { useAskPassword } from "@/Hooks/useAskPassword";
import {
	BiometryError,
	BiometryErrorType,
} from "@aparajita/capacitor-biometric-auth";

interface UnlockIdentityScreenProps {
	identityId: string;
	reason: UnlockReason;
	error?: string;
}

export function UnlockIdentityScreen({
	identityId,
}: UnlockIdentityScreenProps) {
	const identity = useAppSelector((state) =>
		selectIdentityByPubkey(state, identityId),
	);

	if (!identity) {
		return <IdentityNotFound identityId={identityId} />;
	}

	return <InnerContent identity={identity} />;
}

function InnerContent({ identity }: { identity: Identity }) {
	const pmUsername = makeIdentityPrivateKeyPmUsername(identity.pubkey);
	const askPassword = useAskPassword(
		pmUsername,
		"Enter your password to unlock your profile",
	);
	const { showToast } = useToast();
	const dispatch = useDispatch();
	const [showRetry, setShowRetry] = useState(false);
	const mounted = useRef(true);
	const started = useRef(false);

	const authenticateIdentity = useCallback(async () => {
		setShowRetry(false);

		const isLocalKeysIdentity = identity.type === IdentityType.LOCAL_KEY;
		const isUserPasswordProtected =
			isLocalKeysIdentity &&
			identity.localSecret.storage === "inline_encrypted";

		let password: string | undefined;

		if (isUserPasswordProtected) {
			password = await askPassword();
			if (!password) {
				if (!mounted.current) return;
				setShowRetry(true);
				return;
			}
		}

		try {
			const runtimeIdentity = await withDeviceAuth(
				{
					reason: "Authenticate to unlock this identity",
				},
				() => unlockIdentity(identity, password),
			);
			if (!mounted.current) return;
			dispatch(proceedAfterIdentityUnlocked(runtimeIdentity));
		} catch (error) {
			if (!mounted.current) return;
			setShowRetry(true);
			if (
				!(
					error instanceof BiometryError &&
					error.code === BiometryErrorType.userCancel
				)
			) {
				showToast({
					header: "Profile unlock failed",
					message:
						error instanceof Error
							? error.message
							: "Failed to unlock identity",
					color: "danger",
				});
			}
		}
	}, [identity, askPassword, dispatch, showToast]);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		void authenticateIdentity();
		return () => {
			mounted.current = false;
		};
	}, [authenticateIdentity]);

	return (
		<IonPage className="ion-page-width">
			<IonContent className="ion-padding ion-content-only">
				<div
					className="
						min-h-full
						flex flex-col items-center justify-center
						w-full max-w-md
						mx-auto
					"
				>
					<ScreenIntro
						icon={lockClosedOutline}
						title="Unlock profile"
						description="Confirm that it’s you to continue with this profile."
					/>

					<div className="w-full">
						<ProfileCard identity={identity} />
					</div>

					{showRetry ? (
						<IonButton
							fill="solid"
							color="primary"
							className="mt-8 [--border-radius:12px]"
							onClick={() => void authenticateIdentity()}
						>
							<IonIcon icon={alertCircleOutline} slot="start" />
							Unlock
						</IonButton>
					) : (
						<div className="mt-8 flex items-center gap-2 text-muted">
							<IonSpinner name="crescent" className="h-5 w-5" />
							<span className="text-sm">Unlocking…</span>
						</div>
					)}

					<IonButton
						fill="clear"
						size="small"
						onClick={() => dispatch(cancelIdentityUnlock())}
						className="mt-8 normal-case [--color:var(--app-text-secondary)]"
					>
						<IonIcon
							slot="start"
							icon={swapHorizontalOutline}
						/>
						Use another identity
					</IonButton>
				</div>
			</IonContent>
		</IonPage>
	);
}

function IdentityNotFound({ identityId }: { identityId: string }) {
	const dispatch = useAppDispatch();

	return (
		<IonPage className="ion-page-width">
			<IonContent className="ion-padding ion-content-only">
				<div
					className="
						min-h-full
						flex flex-col items-center justify-center
						w-full max-w-md
						mx-auto px-2
					"
				>
					<ScreenIntro
						icon={alertCircleOutline}
						tone="warning"
						title="Profile not found"
						description="This identity is not on this device. It may have been removed, or the unlock link is out of date."
					>
						<p className="mt-4 font-mono text-xs text-faint break-all">
							{identityId}
						</p>
					</ScreenIntro>

					<IonButton
						fill="outline"
						className="mt-8 [--border-radius:12px]"
						onClick={() => dispatch(cancelIdentityUnlock())}
					>
						<IonIcon icon={swapHorizontalOutline} slot="start" />
						Select another identity
					</IonButton>
				</div>
			</IonContent>
		</IonPage>
	);
}
