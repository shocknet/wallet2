import { useCallback, } from 'react';
import { IonContent, IonHeader, IonPage } from '@ionic/react';
import { getDeviceId } from '../../constants';
import BackToolbar from '@/Layout2/BackToolbar';
import { CustomSelect } from '@/Components/CustomSelect';
import { fiatCurrencies, FiatCurrency } from '@/State/scoped/backups/identity/schema';
import { useAppDispatch, useAppSelector } from '@/State/store/hooks';
import { identityActions, selectFiatCurrency } from '@/State/scoped/backups/identity/slice';
import { capFirstLetter } from '@/lib/format';
import { appStateActions, selectTheme, Theme } from '@/State/appState/slice';


const themeOptions: Theme[] = ["system", "dark", "light"];


const Prefs = () => {
	const dispatch = useAppDispatch();


	const fiatCurrency = useAppSelector(selectFiatCurrency);
	const setFiatCurrency = useCallback((newCur: FiatCurrency) => {
		const deviceId = getDeviceId();
		dispatch(identityActions.setFiatCurrency({ currency: newCur, by: deviceId }));
	}, [dispatch])


	const theme = useAppSelector(selectTheme);
	const setTheme = useCallback((newTheme: Theme) => {
		dispatch(appStateActions.setTheme({ theme: newTheme }));
	}, [dispatch])


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
			</IonContent>
		</IonPage>
	)
}

export default Prefs;
