import { useCallback, useEffect, useRef, useState } from "react";
import FullSpinner from "@/Components/common/ui/fullSpinner";
import { useIdentityActivation } from "./useIdentityActivation";
import {
	getIdentityIntent,
	markIdentityIntentReady,
	onIdentityIntent,
	type IdentityIntent,
} from "./identityActivationBus";
import { LAST_ACTIVE_IDENTITY_PUBKEY_KEY } from "@/State/identitiesRegistry/thunks";
import { SplashScreen } from "@capacitor/splash-screen";

export function IdentityIntentBootstrap(props: { children: React.ReactNode }) {

	const handleIdentityIntent = useIdentityActivation();
	const [hasRun, setHasRun] = useState(false);
	const startedRef = useRef(false);
	const handlingRef = useRef(false);


	const runSingleIntent = useCallback(async (intent: IdentityIntent) => {
		if (handlingRef.current) return;
		handlingRef.current = true;
		try {
			await handleIdentityIntent(intent);
		} finally {
			handlingRef.current = false;
		}
	}, [handleIdentityIntent]);

	const bootstrap = useCallback(async () => {
		try {
			const intent = getIdentityIntent();
			if (!intent) {
				const pubkey = localStorage.getItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);
				if (pubkey) {
					const lastActiveIntent = {
						createdAtMs: Date.now(),
						identityId: pubkey,
					};
					await runSingleIntent(lastActiveIntent);
				}
			}
			if (intent) {
				await runSingleIntent(intent);
			}
		} catch {
			localStorage.removeItem(LAST_ACTIVE_IDENTITY_PUBKEY_KEY);
		} finally {
			setHasRun(true);
		}
	}, [runSingleIntent]);

	useEffect(() => {
		if (startedRef.current) return;
		SplashScreen.hide();
		startedRef.current = true;
		void bootstrap();

		const off = onIdentityIntent((intent) => {
			void runSingleIntent(intent);
		});
		markIdentityIntentReady();
		return off;
	}, [runSingleIntent, bootstrap]);

	if (!hasRun) {
		return <FullSpinner />;
	}

	return <>{props.children}</>;
}

