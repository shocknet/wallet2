import { useState } from 'react';
import {
	IonAvatar,
	IonButton,
	IonContent,
	IonHeader,
	IonLabel,
	IonNote,
	IonPage,
	IonRouterOutlet,
	IonText,
	useIonViewDidLeave,
	useIonViewWillEnter,
} from "@ionic/react";
import BackToolbar from '@/Layout2/BackToolbar';
import { useAppSelector } from '@/State/store/hooks';
import { NprofileView, selectHealthyAdminNprofileViews } from '@/State/scoped/backups/sources/selectors';
import { CustomSelect } from '@/Components/CustomSelect';
import { Satoshi } from '@/lib/types/units';
import { Route, RouteComponentProps } from 'react-router-dom';
import Dashboard from './metricsMain';
import Earnings from './earnings';
import Routing from './routing';
import { SelectedAdminSourceProvider, } from './selectedAdminSourceContext';
import Manage from '../Manage';
import Channels from '../Channels';
import { selectActiveIdentityId } from '@/State/identitiesRegistry/slice';


const Metrics = ({ match }: RouteComponentProps) => {
	const identityKey = useAppSelector(selectActiveIdentityId);
	const healthy = useAppSelector(selectHealthyAdminNprofileViews, (a, b) => a.length === b.length);
	const [chosen, setChosen] = useState<NprofileView | undefined>(undefined);
	const [innerChosen, setInnerChosen] = useState<NprofileView | undefined>(undefined);



	useIonViewWillEnter(() => {
		if (healthy.length === 0) {
			throw new Error("Shouldn't be able to get here");
		}

		if (healthy.length === 1) {
			setChosen(healthy[0]);
		}
	});

	useIonViewDidLeave(() => {
		setChosen(undefined);
		setInnerChosen(undefined);
	})



	if (!chosen) {
		return (
			<IonPage>
				<IonHeader className="ion-no-border">
					<BackToolbar title="Metrics" />
				</IonHeader>
				<IonContent className="ion-padding">
					<div className="page-outer">
						<div className="page-body">
							<section className="hero-block flex-row gap-4 max-h-[20vh]">
								<div className="text-2xl text-high font-bold">Source Selection</div>
							</section>

							<section className="main-block flex flex-col justify-center w-full self-center">
								<div className="flex w-full sm:w-2/3 flex-col mx-auto justify-center items-stretch gap-4">
									<CustomSelect<NprofileView>
										items={healthy}
										selectedItem={innerChosen}
										onSelect={(v) => setInnerChosen(v)}
										getIndex={(s) => s.sourceId}
										title="Select Source"
										subTitle="Pick the admin source for the dashboard"
										placeholder="Choose your admin source"
										renderItem={(s) => (
											<>
												<IonAvatar slot="start">
													<img src={`https://robohash.org/${s.sourceId}.png?bgset=bg1`} alt="Avatar" />
												</IonAvatar>
												<IonLabel style={{ width: "100%" }}>
													<h2>{s.label}</h2>
												</IonLabel>
												<IonText slot="end" color="primary">
													{`${Number((s.balanceSats || 0) as Satoshi).toLocaleString()} sats`}
												</IonText>
											</>
										)}
										renderSelected={(s) => (
											<IonText className="text-medium">
												{s?.label ?? ""}
												<IonNote className="text-low" style={{ display: "block" }}>
													{`${Number((s?.balanceSats || 0) as Satoshi).toLocaleString()} sats`}
												</IonNote>
											</IonText>
										)}
									/>
									<IonButton
										expand="block"
										disabled={!innerChosen}
										onClick={() => {
											setChosen(innerChosen);
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

