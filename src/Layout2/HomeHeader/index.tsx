
import { IonAvatar, IonButton, IonButtons, IonHeader, IonImg, IonMenuButton, IonSkeletonText, IonToolbar, useIonRouter, } from '@ionic/react';
import logo from "@/Assets/Images/isolated logo.png";
import { useGetProfileQuery } from '@/State/api/api';
import { useAppSelector } from '@/State/store/hooks';
import { selectActiveIdentity } from '@/State/identitiesRegistry/slice';
import { IdentityType } from '@/State/identitiesRegistry/types';
import { useEffect, useState } from 'react';
import SourcesStatusIndicator from '@/Components/SourcesStatusIndicator';





const HomeHeader = ({ children }: { children?: React.ReactNode }) => {

	const registry = useAppSelector(selectActiveIdentity)!;




	const activeHex = registry.pubkey;
	const { data: profile, isLoading } = useGetProfileQuery({
		pubkey: activeHex!,
		relays: registry.type !== IdentityType.SANCTUM ? registry.relays : ["wss://strfry.shock.network", "wss://relay.lightning.pub"]
	},
		{ skip: !activeHex }
	);

	const picture = profile?.picture || (activeHex ? `https://robohash.org/${activeHex}.png?bgset=bg1` : "");
	const router = useIonRouter()

	const [logoClickCounter, setLogoClickCounter] = useState(0);
	useEffect(() => {
		let singleClickTimer: NodeJS.Timeout;
		let tripeClickTimer: NodeJS.Timeout;
		if (logoClickCounter === 1) {
			singleClickTimer = setTimeout(() => {
				router.push("/home", "back");
				setLogoClickCounter(0);
			}, 500);
		} else {
			if (logoClickCounter === 3) {
				router.push("/metrics", "forward");
			}
			tripeClickTimer = setTimeout(() => {
				setLogoClickCounter(0);
			}, 500);
		}
		return () => {
			clearTimeout(singleClickTimer)
			clearTimeout(tripeClickTimer);
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [logoClickCounter]);



	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" onClick={() => setLogoClickCounter(prev => prev + 1)}>
						<IonImg
							slot="start"
							src={logo}
							style={{ width: "25px", height: "auto" }}
						>
						</IonImg>
					</IonButton>
				</IonButtons>
				<IonButtons slot="end">
					<SourcesStatusIndicator />
					<IonButton shape="round" fill="clear" routerLink="/identities" routerDirection="root">
						<IonAvatar aria-hidden="true" slot="start" style={{ height: 40, width: 40 }}>
							{isLoading ? (
								<IonSkeletonText animated style={{ height: 40, width: 40, borderRadius: '50%' }} />
							) : (
								<img
									src={picture}
									alt=""
									referrerPolicy="no-referrer"
									onError={(e) => {
										const el = e.currentTarget as HTMLImageElement;
										if (!/robohash/.test(el.src) && activeHex) {
											el.src = `https://robohash.org/${activeHex}.png?bgset=bg1`;
										}
									}}

								/>
							)}
						</IonAvatar>


					</IonButton>
					<IonMenuButton color="primary"></IonMenuButton>
				</IonButtons>
			</IonToolbar>
			{children}
		</IonHeader>
	);
};

export default HomeHeader;
