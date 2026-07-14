import { IonContent, IonImg, IonPage } from "@ionic/react";
import logo from "@/Assets/Images/isolated logo.png";
import shockwalletText from "@/Assets/Images/wallet_new_text.png";

export function StartupScreen() {
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
						<IonImg
							src={logo}
							alt=""
							className="h-14 w-14"
						/>
					</div>

					<div className="relative z-[1] mt-8 max-w-[13rem] w-full opacity-90">
						<IonImg
							src={shockwalletText}
							alt="ShockWallet"
							className="w-full h-auto object-contain"
						/>
					</div>

					<p className="relative z-[1] mt-10 text-sm tracking-wide text-muted">
						Preparing your wallet…
					</p>

					<div
						aria-hidden
						className="
							relative z-[1] mt-6
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
