import {
	IonButton,
	IonContent,
	IonIcon,
	IonPage,
	IonSpinner,
	IonText,
} from "@ionic/react";
import { useState } from "react";
import type { TokensData } from "sanctum-sdk";
import { cloudOutline, swapHorizontalOutline } from "ionicons/icons";
import { SanctumAuthWidget } from "@/Components/SanctumAuthWidget";
import { ProfileCard } from "@/Components/User/ProfileCard";
import { selectIdentityByPubkey } from "@/State/identitiesRegistry/slice";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import type { RuntimeIdentity } from "../types";
import {
	cancelIdentityUnlock,
	completeSanctumReauth,
} from "../coordinator";

export function SanctumReauthScreen({
	runtimeIdentity,
	reason,
	error,
}: {
	runtimeIdentity: RuntimeIdentity;
	reason?: string;
	error?: string;
}) {
	const dispatch = useAppDispatch();
	const [submitting, setSubmitting] = useState(false);
	const identity = useAppSelector((state) =>
		selectIdentityByPubkey(state, runtimeIdentity.pubkey),
	);

	async function handleTokensUpdated(tokens: TokensData) {
		setSubmitting(true);

		try {
			await dispatch(completeSanctumReauth(tokens));
		} finally {
			setSubmitting(false);
		}
	}

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
					<header className="mb-7 pt-2 text-center flex flex-col items-center">
						<div
							className="
								mb-4 flex size-11 items-center
								justify-center rounded-2xl
								bg-[color-mix(in_srgb,var(--ion-color-primary)_14%,transparent)]
								text-[var(--ion-color-primary)]
							"
						>
							<IonIcon
								icon={cloudOutline}
								className="text-xl"
							/>
						</div>

						<h1 className="text-2xl font-semibold tracking-tight text-primary">
							Sign in to Sanctum
						</h1>

						<p className="mt-2 text-sm leading-6 text-muted">
							{reason ??
								"Your Sanctum session expired or needs to be refreshed."}
						</p>
					</header>

					{identity ? (
						<div className="w-full mb-6">
							<ProfileCard identity={identity} />
						</div>
					) : (
						<p className="mb-6 text-sm text-secondary text-center">
							{runtimeIdentity.label || "Sanctum profile"}
						</p>
					)}

					{error ? (
						<IonText color="danger">
							<p className="mb-4 text-sm text-center">{error}</p>
						</IonText>
					) : null}

					<div className="w-full relative">
						<SanctumAuthWidget
							onTokensUpdated={handleTokensUpdated}
							className="w-full"
						/>

						{submitting ? (
							<div
								className="
									absolute inset-0 flex items-center justify-center
									rounded-xl
									bg-[color-mix(in_srgb,var(--app-background)_72%,transparent)]
								"
							>
								<IonSpinner name="crescent" />
							</div>
						) : null}
					</div>

					<IonButton
						fill="clear"
						size="small"
						className="mt-8 normal-case [--color:var(--app-text-secondary)]"
						disabled={submitting}
						onClick={() => dispatch(cancelIdentityUnlock())}
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
