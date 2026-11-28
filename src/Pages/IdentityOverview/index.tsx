import { useEffect, useState } from "react";
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonText,
	IonTitle,
	IonToolbar,
	useIonRouter,
} from "@ionic/react";
import {
	saveOutline,
	swapHorizontalOutline,
} from "ionicons/icons";
import { nip19 } from "nostr-tools";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import {
	selectActiveIdentityRuntime,
	selectIdentityByPubkey,
} from "@/State/identitiesRegistry/slice";
import { setIdentityRelays } from "@/State/identitiesRegistry/identitySyncThunks";
import { IdentityType } from "@/State/identitiesRegistry/types";
import { useSwitchProfileModal } from "@/Components/User/SwitchProfileSheet";
import CopyMorphButton from "@/Components/CopyMorphButton";
import { RelayManager } from "@/Components/RelayManager";
import { getIdentityNostrApi } from "@/State/identitiesRegistry/helpers/identityNostrApi";

import { useToast } from "@/lib/contexts/useToast";
import { useDraft } from "@/Hooks/useDraft";
import { sameSet } from "@/utils/array";
import { WsUrlSchema } from "@/lib/urlZod";
import { ProfileCard } from "@/Components/User/ProfileCard";
import { IdentitySecuritySection } from "./IdentitySecuritySection";
import { CircledBackButton } from "@/Layout2/CircledBackButton";

const IdentityOverviewPage = () => {
	const dispatch = useAppDispatch();
	const { showToast } = useToast();
	const router = useIonRouter();
	const ShowProfileSheet = useSwitchProfileModal();
	const runtime = useAppSelector(selectActiveIdentityRuntime);
	const registryIdentity = useAppSelector((state) =>
		runtime ? selectIdentityByPubkey(state, runtime.pubkey) : null,
	);

	const [editingRelays, setEditingRelays] = useState(false);
	const [sanctumRelays, setSanctumRelays] = useState<string[]>([]);

	const savedRelays =
		registryIdentity && registryIdentity.type !== IdentityType.SANCTUM
			? registryIdentity.relays
			: [];
	const { draft, operations, isDirty, setField } = useDraft(
		{ relays: savedRelays },
		{
			relays: (previous, next) => {
				if (!runtime || runtime.type === IdentityType.SANCTUM) return null;
				if (sameSet(previous, next)) return null;
				const pubkey = runtime.pubkey;
				return () => {
					dispatch(setIdentityRelays({ pubkey, relays: next }));
				};
			},
		},
	);

	const addRelay = (url: string) => {
		if (draft.relays.includes(url)) return;
		setField("relays", [...draft.relays, url]);
	};

	const removeRelay = (url: string) => {
		setField("relays", draft.relays.filter(relay => relay !== url));
	};

	useEffect(() => {
		if (!runtime || runtime.type !== IdentityType.SANCTUM) return;

		let ignore = false;
		getIdentityNostrApi(runtime)
			.then((api) => api.getRelays())
			.then((r) => {
				if (ignore) return;
				const urls: string[] = [];
				for (const url of Object.keys(r)) {
					const parsed = WsUrlSchema.safeParse(url);
					if (parsed.success) urls.push(parsed.data);
				}
				setSanctumRelays(urls);
			})
			.catch(() => {
				/* sanctum relays are informational */
			});
		return () => {
			ignore = true;
		};
	}, [runtime]);

	const visibleRelays = runtime?.type === IdentityType.SANCTUM
		? sanctumRelays
		: draft.relays;

	const npub = runtime ? nip19.npubEncode(runtime.pubkey) : "";




	const saveRelays = () => {
		if (!runtime || runtime.type === IdentityType.SANCTUM) return;
		for (const operation of operations) operation();
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
						<CircledBackButton
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
					<section className="app-panel">
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
									relays={draft.relays}
									onAdd={addRelay}
									onRemove={removeRelay}
								/>
								<IonButton
									expand="block"
									className="mt-3 [--border-radius:12px]"
									disabled={!isDirty}
									onClick={saveRelays}
								>
									<IonIcon
										slot="start"
										icon={saveOutline}
									/>
									Save relays
								</IonButton>
							</>
						) : visibleRelays.length > 0 ? (
							<ul className="flex flex-col gap-2">
								{visibleRelays.map((relay) => (
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
							onClick={() => {
								void ShowProfileSheet().then((result) => {
									if (result.role === "create") {
										router.push("/profile/create", "forward", "push");
									}
								});
							}}
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
		</IonPage>
	);
};

export default IdentityOverviewPage;
