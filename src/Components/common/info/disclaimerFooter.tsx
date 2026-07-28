import { IonToolbar } from "@ionic/react";

export function DisclaimerFooter() {
	return (
		<IonToolbar>
			<div className="w-[93%] mx-auto text-muted text-center text-xs leading-snug pb-2">
				By proceeding you acknowledge that this is bleeding-edge software,
				and agree to the providers{" "}
				<a
					href="https://docs.shock.network/terms/"
					target="_blank"
					rel="noreferrer"
					className="underline text-primary"
				>
					terms
				</a>{" "}
				regarding any services herein.
			</div>
		</IonToolbar>
	)
}
