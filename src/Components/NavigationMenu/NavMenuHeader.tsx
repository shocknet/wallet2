// Components/nav/NavMenuHeader.tsx
import React, { useMemo } from 'react';
import {
	IonHeader, IonToolbar, IonTitle, IonAvatar, IonLabel, IonItem,
	IonSkeletonText, IonNote, IonBadge, IonButtons, IonButton, IonIcon,
	IonItemDivider
} from '@ionic/react';
import { checkmarkCircle, alertCircle } from 'ionicons/icons';
import { useAppSelector } from '@/State/store/hooks';
import { selectActiveIdentityId } from '@/State/identitiesRegistry/slice';
import { useGetProfileQuery } from '@/State/api/api';
import { nip19 } from 'nostr-tools';


const truncate = (s: string, head = 8, tail = 6) =>
	!s ? '' : s.length <= head + tail ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;

export const NavMenuHeader: React.FC = () => {
	const activeHex = useAppSelector(selectActiveIdentityId);
	const { data: profile, isLoading } = useGetProfileQuery(activeHex!, { skip: !activeHex });

	const displayName = profile?.display_name || profile?.name || 'Anonymous';
	const npub = useMemo(() => (activeHex ? nip19.npubEncode(activeHex) : ''), [activeHex]);
	const img = profile?.picture;



	return (
		<IonHeader className="ion-no-border">
			<IonToolbar>

				<IonItem
					lines="none"
					detail={false}
					aria-label={`Active identity: ${displayName}`}
					button

				>
					<IonAvatar aria-hidden="true" slot="start">
						{isLoading ? (
							<IonSkeletonText animated style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
						) : (
							<img
								src={img || `https://robohash.org/${activeHex}.png?bgset=bg1`}
								alt={displayName}
								referrerPolicy="no-referrer"
								onError={(e) => {
									const el = e.currentTarget as HTMLImageElement;
									if (!el.dataset.fallback) {
										el.dataset.fallback = "1";
										el.src = `https://robohash.org/${activeHex}.png?bgset=bg1`;
									}
								}}
							/>
						)}
					</IonAvatar>

					<IonLabel>
						{isLoading ? (
							<>
								<IonSkeletonText animated style={{ width: '60%', height: '16px' }} />
								<IonSkeletonText animated style={{ width: '40%', height: '12px', marginTop: 4 }} />
							</>
						) : (
							<>
								<h2 className="text-high" style={{ margin: 0 }}>{displayName}</h2>
								<IonNote style={{ display: 'block', "--color": "var(--ion-text-color-step-450)" }}>{truncate(npub)}</IonNote>
							</>
						)}
					</IonLabel>


					{profile?.nip05 ? (
						<IonBadge slot="end" color="tertiary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
							{profile.nip05}
							<IonIcon icon={checkmarkCircle} />
						</IonBadge>
					) : null}
				</IonItem>


				<IonItemDivider style={{ minHeight: "0.5px" }} color="primary"> </IonItemDivider>


			</IonToolbar>
		</IonHeader>
	);
};
