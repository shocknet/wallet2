import { useEffect, useMemo, useState } from "react";
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import {
	chevronBackOutline,
	saveOutline,
	swapHorizontalOutline,
} from "ionicons/icons";
import { nip19 } from "nostr-tools";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	selectActiveIdentity,
	selectIdentityByPubkey,
} from "@/State/identitiesRegistry/slice";
import { setIdentityRelays } from "@/State/identitiesRegistry/identitySyncThunks";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { SwitchProfileSheet } from "@/Components/User/SwitchProfileSheet";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { RelayManager } from "@/Components/RelayManager";
import { getActiveIdentityNostrApi } from "@/State/identitiesRegistry/helpers/identityNostrApi";

import { useToast } from "@/lib/contexts/useToast";
import { normalizeWsUrl } from "@/lib/url";
import { ProfileCard } from "@/Components/User/ProfileCard";
import { IdentitySecuritySection } from "./IdentitySecuritySection";

const sameSet = (a: string[], b: string[]) => {
	if (a.length === 0 && b.length === 0) return true;
	const A = new Set(a);
	const B = new Set(b);
	if (A.size !== B.size) return false;
	for (const x of A) if (!B.has(x)) return false;
	return true;
};

const IdentityOverviewPage = () => {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const runtime = useAppSelector(selectActiveIdentity);
	const registryIdentity = useAppSelector((state) =>
		runtime ? selectIdentityByPubkey(state, runtime.pubkey) : null,
	);

	const [switchOpen, setSwitchOpen] = useState(false);
	const [editingRelays, setEditingRelays] = useState(false);
	const [relays, setRelays] = useState<string[]>([]);

	useEffect(() => {
		if (!runtime) return;
		if (runtime.type === IdentityType.SANCTUM) {
			void getActiveIdentityNostrApi()
				.then((api) => api.getRelays())
				.then((r) => {
					setRelays(Object.keys(r).map(normalizeWsUrl));
				})
				.catch(() => {
					/* sanctum relays are informational */
				});
			return;
		}
		setRelays(runtime.relays);
	}, [runtime]);

	const registryRelays = useMemo(() => {
		return registryIdentity && registryIdentity.type !== IdentityType.SANCTUM
			? registryIdentity.relays
			: [];
	}, [registryIdentity]);

	const relaysDirty = useMemo(() => {

		if (!runtime || runtime.type === IdentityType.SANCTUM) return false;
		return !sameSet(registryRelays, relays);
	}, [runtime, registryRelays, relays]);

	const npub = runtime ? nip19.npubEncode(runtime.pubkey) : "";




	const saveRelays = () => {
		if (!runtime || runtime.type === IdentityType.SANCTUM) return;
		dispatch(
			setIdentityRelays({
				pubkey: runtime.pubkey,
				relays,
			}),
		);
		setEditingRelays(false);
		showToast({
			color: "success",
			message: "Relays updated",
		});
	};

	if (!runtime || !registryIdentity) {
		return (
			<IonPage className="ion-page-width">
				<IonContent className="ion-padding">
					<p className="text-muted text-center mt-12">
						No active profile.
					</p>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage className="ion-page-width">
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton
							icon={chevronBackOutline}
							defaultHref="/home"
						/>
					</IonButtons>
					<IonTitle>Active profile</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="mx-auto w-full max-w-md flex flex-col gap-8 pb-8">
					<section>
						<ProfileCard
							identity={registryIdentity}
							variant="elevated"
						/>
						<div className="mt-3 flex items-center justify-center gap-1">
							<span className="font-mono text-xs text-faint break-all text-center">
								{npub}
							</span>
							<CopyMorphButton
								value={npub}
								fill="clear"
								size="small"
								shape="round"
							/>
						</div>
					</section>
					<IdentitySecuritySection runtimeIdentity={runtime} />
					<section className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
						<div className="flex items-center justify-between gap-2 mb-2">
							<h2 className="text-base font-semibold tracking-tight text-primary">
								Backup / sync relays
							</h2>
							{runtime.type !== IdentityType.SANCTUM ? (
								<IonButton
									fill="clear"
									size="small"
									onClick={() =>
										setEditingRelays((v) => !v)
									}
								>
									{editingRelays ? "Done" : "Edit"}
								</IonButton>
							) : null}
						</div>

						{runtime.type === IdentityType.SANCTUM ? (
							<p className="text-sm leading-6 text-muted mb-3">
								Relays are managed by Sanctum.
							</p>
						) : null}

						{editingRelays &&
							runtime.type !== IdentityType.SANCTUM ? (
							<>
								<RelayManager
									relays={relays}
									setRelays={setRelays}
								/>
								<IonButton
									expand="block"
									className="mt-3 [--border-radius:12px]"
									disabled={!relaysDirty}
									onClick={saveRelays}
								>
									<IonIcon
										slot="start"
										icon={saveOutline}
									/>
									Save relays
								</IonButton>
							</>
						) : relays.length > 0 ? (
							<ul className="flex flex-col gap-2">
								{relays.map((relay) => (
									<li key={relay}>
										<IonText className="text-sm text-secondary break-all">
											{relay}
										</IonText>
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-muted">
								No relays configured.
							</p>
						)}
					</section>

					<section>
						<IonButton
							expand="block"
							fill="outline"
							color="medium"
							size="large"
							className="[--border-radius:12px]"
							onClick={() => setSwitchOpen(true)}
						>
							<IonIcon
								slot="start"
								icon={swapHorizontalOutline}
							/>
							Use another profile
						</IonButton>
					</section>
				</div>
			</IonContent>

			<SwitchProfileSheet
				isOpen={switchOpen}
				onDidDismiss={() => setSwitchOpen(false)}
			/>
		</IonPage>
	);
};

export default IdentityOverviewPage;
