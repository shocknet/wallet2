import {
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonFooter,
	IonHeader,
	IonIcon,
	IonImg,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonText,
	IonToolbar,
} from '@ionic/react';

import logo from "@/Assets/Images/isolated logo.png";

import { cloudOutline, keyOutline } from 'ionicons/icons';

import { useAppSelector } from '@/State/store/hooks';
import { identitiesSelectors, } from '@/State/identitiesRegistry/slice';
import { selectActiveIdentity } from '@/State/identitiesRegistry/slice';
import { ShockwalletHero } from '@/Components/common/ui/ShockwalletHero';
import { DisclaimerFooter } from '@/Components/common/info/disclaimerFooter';



const CreateIdentityPage = () => {
	const isBoostrapped = useAppSelector(state => state.appState.bootstrapped);

	const activeIdentity = useAppSelector(selectActiveIdentity);
	const identitiesCount = useAppSelector(identitiesSelectors.selectTotal);

	const canLeave = !!isBoostrapped && !!activeIdentity;
	const canGoToIdentities = identitiesCount > 0;

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					{canLeave && (
						<IonButtons slot="start">
							<IonButton shape="round" routerLink="/home">
								<IonImg
									slot="start"
									src={logo}
									style={{ width: "30px", height: "auto" }}
								/>
							</IonButton>
						</IonButtons>
					)}

					{canGoToIdentities && (
						<IonButtons slot="end">
							<IonButton fill="clear" color="primary" routerLink="/identities">
								My identities
							</IonButton>
						</IonButtons>
					)}
				</IonToolbar>
				<div className="w-[93%] mx-auto flex flex-col justify-center items-center gap-10">
					<ShockwalletHero />
				</div>
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="min-h-full flex flex-col gap-12 justify-center items-center ">
					<div className="text-lg font-normal tracking-tight text-center text-secondary">
						Set up your profile
					</div>
					<IonCard
						className="rounded-xl"
					>
						<IonCardHeader>
							<IonCardTitle>
								<IonText
									className="text-lg md:text-xl font-medium leading-snug text-primary"
								>
									Select a method for device sync, backups and user settings
								</IonText>
							</IonCardTitle>
						</IonCardHeader>

						<IonCardContent>
							<IonList className="round" lines="none">
								<IonItem
									detail
									routerLink="/identity/create/sanctum"
									routerDirection="forward"
								>
									<IonIcon
										slot="start"
										icon={cloudOutline}
										size="large"
										className="text-secondary"
									/>
									<IonLabel>
										<h2
											className="text-base font-medium leading-snug text-primary"
										>
											Log-In or Sign-Up with Email
										</h2>
										<IonText
											className="block text-sm leading-snug text-muted"
										>
											Use the Nostr network via a cloud based policy engine.
										</IonText>
									</IonLabel>
								</IonItem>

								<IonItem
									detail
									routerLink="/identity/create/keys"
									routerDirection="forward"
								>
									<IonIcon
										slot="start"
										icon={keyOutline}
										size="large"
										className="text-secondary"
									/>
									<IonLabel>
										<h2
											className="text-base font-medium leading-snug text-primary"
										>
											Nostr Keys
										</h2>

										<IonText
											className="block text-sm leading-snug text-muted"
										>
											Use your existing Nostr key or generate a new one.
										</IonText>

										<IonText
											className="block text-sm leading-snug text-muted mt-2"
										>
											Includes a file based backup and NIP-07 extensions.
										</IonText>
									</IonLabel>
								</IonItem>
							</IonList>
						</IonCardContent>
					</IonCard>
				</div>


			</IonContent>
			<IonFooter className="ion-no-border">
				<DisclaimerFooter />
			</IonFooter>

		</IonPage>
	);
};

export default CreateIdentityPage;
