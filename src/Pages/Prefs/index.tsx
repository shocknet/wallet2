import { useCallback, useState } from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonSpinner } from '@ionic/react';
import { getDeviceId } from '../../constants';
import BackToolbar from '@/Layout2/BackToolbar';
import { CustomSelect } from '@/Components/CustomSelect';
import { fiatCurrencies, FiatCurrency } from '@/State/scoped/backups/identity/schema';
import { useAppDispatch, useAppSelector } from '@/State/store/hooks';
import { identityActions, selectFiatCurrency } from '@/State/scoped/backups/identity/slice';
import { capFirstLetter } from '@/lib/format';
import { appStateActions, selectTheme, Theme } from '@/State/appState/slice';
import { selectPushStatus } from '@/State/runtime/slice';
import { requestNotificationsPermission } from '@/notifications/permission';
import { useToast } from '@/lib/contexts/useToast';
import { refreshPushRegistration } from '@/notifications/push/register';


const themeOptions: Theme[] = ["system", "dark", "light"];


const Prefs = () => {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const [pushBusy, setPushBusy] = useState(false);
	const pushStatus = useAppSelector(selectPushStatus);


	const fiatCurrency = useAppSelector(selectFiatCurrency);
	const setFiatCurrency = useCallback((newCur: FiatCurrency) => {
		const deviceId = getDeviceId();
		dispatch(identityActions.setFiatCurrency({ currency: newCur, by: deviceId }));
	}, [dispatch])


	const theme = useAppSelector(selectTheme);
	const setTheme = useCallback((newTheme: Theme) => {
		dispatch(appStateActions.setTheme({ theme: newTheme }));
	}, [dispatch])

	const onEnablePush = useCallback(async () => {
		setPushBusy(true);
		try {
			const res = await requestNotificationsPermission();
			if (res !== "granted") {
				showToast({
					message: "Permission not granted",
					color: "danger",
					duration: 2000,
				});
			}
			dispatch(refreshPushRegistration());
		} finally {
			setPushBusy(false);
		}
	}, [dispatch, showToast]);


	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<BackToolbar title="Preferences" />
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="mt-6 flex flex-col">
					<div className="text-lg text-[var(--ion-text-color-step-150)] font-medium">Fiat Currency</div>
					<CustomSelect<FiatCurrency>
						items={fiatCurrencies}
						selectedItem={fiatCurrency}
						onSelect={setFiatCurrency}
						getIndex={(curr) => curr}
						subTitle="Select your preferred fiat currency"
						renderItem={(curr) => (
							<div className="text-[var(--ion-text-color-step-200)]">{curr}</div>
						)}
						renderSelected={(curr) => (
							<div className="text-[var(--ion-text-color-step-200)]">{curr}</div>
						)}
					/>
				</div>

				<div className="mt-6 flex flex-col">
					<div className="text-lg text-[var(--ion-text-color-step-150)] font-medium">Theme</div>
					<CustomSelect<Theme>
						items={themeOptions}
						selectedItem={theme}
						onSelect={setTheme}
						getIndex={(curr) => curr}
						subTitle="Select your preferred theme"
						renderItem={(curr) => (
							<div className="text-[var(--ion-text-color-step-200)]">{capFirstLetter(curr)}</div>
						)}
						renderSelected={(curr) => (
							<div className="text-[var(--ion-text-color-step-200)]">{capFirstLetter(curr)}</div>
						)}
					/>
				</div>

				{pushStatus && pushStatus.status !== "unsupported" && pushStatus.status !== "error" && (
					<div className="mt-6 flex flex-col">
						<div className="text-lg text-secondary font-medium">Notifications</div>
						<div className="text-sm text-muted">
							Enable push notifications for important account activity.
						</div>
						<div className="mt-3 flex flex-col gap-3">
							{
								(pushStatus.status === "prompt") && (
									<IonButton onClick={onEnablePush} disabled={pushBusy} size="default" style={{ maxWidth: "fit-content" }}>
										{pushBusy ? <IonSpinner name="dots" /> : "Enable Notifications"}
									</IonButton>
								)
							}
							{
								pushStatus.status === "registered" && (
									<div className="flex items-center gap-2">
										<span className="text-sm text-[var(--ion-color-success)]">✓ Enabled</span>
									</div>
								)
							}
							{
								pushStatus.status === "denied" && (
									<div className="flex flex-col gap-2">
										<span className="text-sm text-[var(--ion-color-warning)]">⚠ Permission Denied</span>
										<span className="text-xs text-muted">
											To enable notifications, go to your browser or system settings and allow notifications for this site.
										</span>
									</div>
								)
							}
						</div>
					</div>
				)}
			</IonContent>
		</IonPage>
	)
}

export default Prefs;
