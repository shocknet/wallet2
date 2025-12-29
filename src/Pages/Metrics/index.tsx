import { useMemo, useState } from 'react';
import {
	IonButton,
	IonContent,
	IonHeader,
	IonPage,
	IonRouterOutlet,
	useIonViewDidLeave,
	useIonViewWillEnter,
} from "@ionic/react";
import BackToolbar from '@/Layout2/BackToolbar';
import { useAppSelector } from '@/State/store/hooks';
import { NprofileView, selectAdminNprofileViews } from '@/State/scoped/backups/sources/selectors';
import { CustomSelect } from '@/Components/CustomSelect';
import { Route, RouteComponentProps } from 'react-router-dom';
import Dashboard from './metricsMain';
import Earnings from './earnings';
import Routing from './routing';
import { SelectedAdminSourceProvider, } from './selectedAdminSourceContext';
import Manage from '../Manage';
import Channels from '../Channels';
import { selectActiveIdentityId } from '@/State/identitiesRegistry/slice';
import { SelectedSource, SourceSelectOption } from '@/Components/CustomSelect/commonSelects';


const Metrics = ({ match }: RouteComponentProps) => {
	const identityKey = useAppSelector(selectActiveIdentityId);
	const nprofileAdmins = useAppSelector(selectAdminNprofileViews);

	const [chosenId, setChosenId] = useState("");
	const [innerChosenId, setInnerChosenId] = useState("");


	useIonViewWillEnter(() => {
		if (nprofileAdmins.length === 0) {
			throw new Error("Shouldn't be able to get here");
		}

		if (nprofileAdmins.length === 1) {
			setChosenId(nprofileAdmins[0].sourceId);
		}
	});

	useIonViewDidLeave(() => {
		setChosenId("");
		setInnerChosenId("");
	})

	const chosen = useMemo(() => nprofileAdmins.find(a => a.sourceId === chosenId), [nprofileAdmins, chosenId]);
	const innerChosen = useMemo(() => nprofileAdmins.find(a => a.sourceId === chosenId), [nprofileAdmins, chosenId]);



	if (!chosen) {
		return (
			<IonPage className="ion-page-width">
				<IonHeader className="ion-no-border">
					<BackToolbar title="Metrics" />
				</IonHeader>
				<IonContent className="ion-padding">
					<div className="page-outer">
						<div className="page-body">
							<section className="hero-block flex-row gap-4 max-h-[20vh]">
								<div className="text-2xl text-medium font-bold">Source Selection</div>
							</section>

							<section className="main-block flex flex-col justify-center w-full self-center">
								<div className="flex w-full sm:w-2/3 flex-col mx-auto justify-center items-stretch gap-4">
									<CustomSelect<NprofileView>
										items={nprofileAdmins}
										selectedItem={innerChosen}
										onSelect={(v) => setInnerChosenId(v.sourceId)}
										getIndex={(s) => s.sourceId}
										title="Select Source"
										subTitle="Pick the admin source for the dashboard"
										placeholder="Choose your admin source"
										renderItem={(s) => (
											<SourceSelectOption source={s} />
										)}
										renderSelected={(s) => (
											<SelectedSource source={s} />
										)}
									/>
									<IonButton
										expand="block"
										disabled={!innerChosen}
										onClick={() => {
											setChosenId(innerChosenId);
										}}
									>
										Access dashboard
									</IonButton>
								</div>
							</section>
						</div>
					</div>
				</IonContent>
			</IonPage>
		);
	}


	return (
		<SelectedAdminSourceProvider value={{ adminSource: chosen }}>
			<IonRouterOutlet key={`session-${identityKey}`}>
				<Route exact path={match.url} component={Dashboard} />
				<Route path={`${match.url}/earnings`} component={Earnings} />
				<Route path={`${match.url}/routing`} component={Routing} />
				<Route path={`${match.url}/manage`} component={Manage} />
				<Route path={`${match.url}/channels`} component={Channels} />
			</IonRouterOutlet>
		</SelectedAdminSourceProvider>
	);
};




export default Metrics;

