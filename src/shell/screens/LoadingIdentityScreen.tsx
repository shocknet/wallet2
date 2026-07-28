import { IonContent, IonPage } from "@ionic/react";
import {
	WALLET_AVATAR_HEIGHT,
	useWalletAvatar,
} from "@/Assets/Images/wallet-avatar";
import { truncateTextMiddle } from "@/lib/format";

export function LoadingIdentityScreen({
	identityId,
}: {
	identityId: string;
}) {
	const markSrc = useWalletAvatar();

	return (
		<IonPage className="ion-page-width">
			<IonContent className="ion-padding ion-content-only">
				<div
					className="
						relative
						min-h-full
						flex flex-col items-center justify-center
						w-full max-w-md
						mx-auto
					"
				>
					<div
						aria-hidden
						className="
							pointer-events-none absolute inset-x-[10%] top-[18%] h-[42%]
							rounded-full blur-xl
							bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--ion-color-primary)_18%,transparent),transparent_70%)]
						"
					/>

					<div
						className="
							relative z-[1]
							flex size-[5.5rem] items-center justify-center
							rounded-[1.75rem]
							bg-[color-mix(in_srgb,var(--ion-color-primary)_10%,transparent)]
							shadow-[0_0_0_1px_color-mix(in_srgb,var(--ion-color-primary)_12%,transparent),0_18px_40px_-24px_rgba(var(--app-box-shadow-color),0.55)]
							animate-shell-breathe
						"
					>
						<img
							src={markSrc}
							alt=""
							style={{
								display: "block",
								height: WALLET_AVATAR_HEIGHT.hero,
								width: "auto",
							}}
						/>
					</div>

					<h1 className="relative z-[1] mt-8 text-2xl font-semibold tracking-tight text-primary">
						Loading profile
					</h1>

					<p className="relative z-[1] mt-2 text-sm leading-6 text-muted text-center">
						Setting up your wallet session…
					</p>

					<p className="relative z-[1] mt-4 font-mono text-xs text-faint">
						{truncateTextMiddle(identityId, 10, 10, "…")}
					</p>

					<div
						aria-hidden
						className="
							relative z-[1] mt-8
							h-0.5 w-[min(12rem,55%)] overflow-hidden rounded-full
							bg-[color-mix(in_srgb,var(--app-text-faint)_55%,transparent)]
						"
					>
						<div
							className="
								absolute inset-y-0 left-0 w-2/5 rounded-full
								bg-[linear-gradient(90deg,transparent,var(--ion-color-primary),transparent)]
								animate-shell-progress
							"
						/>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
}
