import { SourceView } from "@/State/scoped/backups/sources/selectors";
import {
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonIcon,
	IonContent,
	IonFooter,
	IonItem,
	IonInput,
	IonToggle,
	IonText,
	IonList,
	IonListHeader,
	IonLabel,
	IonGrid,
	IonRow,
	IonCol
} from "@ionic/react";
import { closeOutline, trashOutline, pencilOutline, starOutline, star } from "ionicons/icons";
import classNames from "classnames";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { useCallback, useState } from "react";
import { DEFAULT_BRIDGE_URL, getDeviceId } from "@/constants";
import { Avatar } from "@/Components/Avatar";
import { SourceReachabilityHint } from "@/Components/Source/SourceReachabilityHint";
import { identityActions, selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import CardishList from "@/Components/CardishList";
import { useNestedPromptDangerModal } from "@/Components/prompt";
import { HttpUrlSchema } from "@/lib/urlZod";
import { useOverlayCoordinator, type Dismiss, type OverlayResult } from "@/overlay";
import { removeSource } from "@/State/scoped/backups/sources/thunks";
import { useDraft, type FieldRules } from "@/Hooks/useDraft";
import { useValidatedInput } from "@/Hooks/useValidatedInput";
import type { AppDispatch } from "@/State/store/store";
import { RelayManager } from "@/Components/RelayManager";

const sectionListClassName =
	"rounded-xl pb-4 [&_ion-list-header]:min-h-9 [&_ion-list-header]:items-end [&_ion-list-header]:pb-[0.15rem]";

export type EditSourceOptions = {
	source: SourceView;
};

export type EditSourceResult =
	| OverlayResult<"change">
	| OverlayResult<"delete">
	| OverlayResult<"cancel">;

type EditSourceModalProps = EditSourceOptions & {
	dismiss: Dismiss<EditSourceResult>;
};

type SourceDraft = {
	label: string | null;
	bridgeUrl: string;
	relays: string[];
	isNDebitDiscoverable: boolean;
};

function SourceIdentity({ source }: { source: SourceView }) {
	const name = source.beaconName?.trim() || "Unnamed node";

	return (
		<div className="flex flex-col gap-2">
			<div className="rounded-xl bg-[var(--app-surface-muted)] px-3 pt-4 pb-2">
				<div className="flex items-center gap-2.5">
					<Avatar
						id={source.sourceId}
						avatarUrl={source.beaconAvatarUrl}
						size="sm"
						beacon={source.beaconStale}
					/>
					<p className="m-0 min-w-0 flex-1 truncate text-sm font-semibold text-primary">
						{name}
					</p>
				</div>
				<p className="code-string m-0 mt-2 break-all text-[0.65rem] leading-4 text-muted">
					{source.lpk}
				</p>
			</div>
			<SourceReachabilityHint sourceId={source.sourceId} />
		</div>
	);
}

function sourceFieldRules(
	sourceId: string,
	dispatch: AppDispatch,
): FieldRules<SourceDraft> {
	return {
		label: (previous, next) => {
			if (previous === next) return null;
			return () => dispatch(sourcesActions.updateSourceLabel({
				sourceId,
				label: next,
				by: getDeviceId(),
			}));
		},
		bridgeUrl: (previous, next) => {
			if (previous === next) return null;
			return () => dispatch(sourcesActions.updateBridgeUrl({
				sourceId,
				bridgeUrl: next === "" ? null : next,
				by: getDeviceId(),
			}));
		},
		relays: (previous, next) => {
			const before = new Set(previous);
			const after = new Set(next);
			const removed = previous.filter(url => !after.has(url));
			const added = next.filter(url => !before.has(url));
			if (added.length === 0 && removed.length === 0) return null;

			return () => {
				for (const relayUrl of added) {
					dispatch(sourcesActions.setRelayPresence({
						sourceId,
						relayUrl,
						present: true,
						by: getDeviceId(),
					}));
				}
				for (const relayUrl of removed) {
					dispatch(sourcesActions.setRelayPresence({
						sourceId,
						relayUrl,
						present: false,
						by: getDeviceId(),
					}));
				}
			};
		},
		isNDebitDiscoverable: (previous, next) => {
			if (previous === next) return null;
			return () => dispatch(sourcesActions.updateisNDebitDiscoverable({
				sourceId,
				isNdebitDiscoverable: next,
				by: getDeviceId(),
			}));
		},
	};
}

function validateBridgeUrl(raw: string) {
	const trimmed = raw.trim();
	if (!trimmed) return { ok: true as const, value: "" };

	const parsed = HttpUrlSchema.safeParse(trimmed);
	if (!parsed.success) {
		return {
			ok: false as const,
			error: parsed.error.issues[0]?.message ?? "Invalid URL",
		};
	}

	return { ok: true as const, value: parsed.data };
}

function EditSourceModal({ source, dismiss }: EditSourceModalProps) {
	const dispatch = useAppDispatch();
	const promptDanger = useNestedPromptDangerModal();
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);

	const snapshot: SourceDraft = {
		label: source.label,
		bridgeUrl: source.bridgeUrl ?? "",
		relays: source.relays,
		isNDebitDiscoverable: source.isNDebitDiscoverable,
	};
	const rules = sourceFieldRules(source.sourceId, dispatch);
	const { draft, operations, isDirty, setField } = useDraft(snapshot, rules);

	const [isEditingRelays, setIsEditingRelays] = useState(false);
	const bridge = useValidatedInput(
		source.bridgeUrl ?? "",
		(value) => setField("bridgeUrl", value),
		validateBridgeUrl,
	);
	const showBridgeError = bridge.isTouched && bridge.error !== null;

	const addRelay = (url: string) => {
		if (draft.relays.includes(url)) return;
		setField("relays", [...draft.relays, url]);
	};

	const removeRelay = (url: string) => {
		setField("relays", draft.relays.filter(relay => relay !== url));
	};

	const handleSave = () => {
		if (bridge.error !== null) return;
		for (const operation of operations) operation();
		dismiss({ role: "change" });
	};

	const isFavorite = source.sourceId === favoriteSourceId;

	const makeFavorite = useCallback(() => {
		if (favoriteSourceId === source.sourceId) return;
		dispatch(identityActions.setFavoriteSource({
			sourceId: source.sourceId,
			by: getDeviceId(),
		}));
	}, [source.sourceId, favoriteSourceId, dispatch]);

	const handleDelete = useCallback(() => {
		void promptDanger({
			title: "Delete source?",
			description: "Are you sure you wish to delete this source from your profile?",
			confirmButtonLabel: "Delete",
		}).then((confirmed) => {
			if (confirmed.role !== "confirm") return;
			dispatch(removeSource(source.sourceId));
			dismiss({ role: "delete" });
		});
	}, [promptDanger, dispatch, dismiss, source.sourceId]);

	const canSave = isDirty && bridge.error === null && bridge.isValid;

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>
						<span className="inline-flex items-center text-secondary">
							<IonIcon style={{ marginRight: "0.4rem" }} icon={pencilOutline} />
							Edit Source
						</span>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton color="secondary" fill="clear" shape="round" onClick={makeFavorite}>
							<IonIcon slot="icon-only" icon={isFavorite ? star : starOutline} />
						</IonButton>
						<IonButton onClick={() => dismiss({ role: "cancel" })}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonList className={sectionListClassName} lines="none">
					<IonListHeader className="text-secondary font-semibold text-base" lines="full">
						<IonLabel>Node</IonLabel>
					</IonListHeader>
					<div className="px-4 pt-2">
						<SourceIdentity source={source} />
					</div>
				</IonList>

				<CardishList listHeader="Source Info" className={sectionListClassName} lines="none">
					<IonItem className="[--padding-bottom:0.7rem]">
						<IonInput
							placeholder="My savings source"
							color="primary"
							labelPlacement="stacked"
							label="Label"
							value={draft.label ?? ""}
							onIonInput={(e) => setField("label", e.detail.value || null)}
							mode="md"
							fill="outline"
							style={{ "--padding-end": "50px" }}
							className="mt-2"
						/>
					</IonItem>
					<IonItem>
						<IonInput
							color="primary"
							label="Bridge URL"
							labelPlacement="stacked"
							inputmode="url"
							placeholder={DEFAULT_BRIDGE_URL}
							value={bridge.value}
							mode="md"
							fill="outline"
							className={classNames({
								["ion-invalid"]: showBridgeError,
								["ion-touched"]: bridge.isTouched,
								["ion-margin-top"]: true,
							})}
							style={{ "--padding-end": "50px" }}
							errorText={bridge.error ?? "Invalid URL"}
							onIonInput={(e) => bridge.onChange(e.detail.value ?? "")}
							onIonBlur={bridge.onBlur}
							helperText="Enter a valid http URL"
						/>
					</IonItem>
				</CardishList>

				<IonList className={`${sectionListClassName} mt-2 pt-4`} lines="none">
					<IonItem lines="none">
						<IonToggle
							checked={draft.isNDebitDiscoverable}
							onIonChange={(e) => {
								if (e.detail.checked === draft.isNDebitDiscoverable) return;
								setField("isNDebitDiscoverable", e.detail.checked);
							}}
						>
							<IonText className="text-secondary">ndebit discoverable</IonText>
						</IonToggle>
					</IonItem>
				</IonList>

				<div>
					<IonList
						className={`${sectionListClassName} mt-2`}
						lines="none"
					>
						<IonListHeader className="text-secondary font-semibold text-base" lines="full">
							<IonLabel>Relays</IonLabel>
							{
								isEditingRelays
									?
									<IonButton style={{ marginRight: "0.5rem" }} onClick={() => setIsEditingRelays(false)}>
										<IonIcon icon={closeOutline} slot="icon-only" />
									</IonButton>
									:
									<IonButton style={{ marginRight: "0.5rem" }} onClick={() => setIsEditingRelays(true)}>
										Edit
									</IonButton>
							}
						</IonListHeader>
						{
							isEditingRelays
								? (
									<>
										<IonItem>
											<IonLabel color="warning">
												<IonText>
													Your node should be listening on relays you add here
												</IonText>
											</IonLabel>
										</IonItem>
										<RelayManager
											relays={draft.relays}
											onAdd={addRelay}
											onRemove={removeRelay}
										/>
									</>
								)
								: draft.relays.map(r => (
									<IonItem key={r}>
										<IonText className="text-secondary text-weight-medium" style={{ textDecoration: "underline" }}>
											{r}
										</IonText>
									</IonItem>
								))
						}
					</IonList>
				</div>
			</IonContent>
			<IonFooter>
				<IonToolbar className="ion-border">
					<IonGrid>
						<IonRow className="ion-align-items-center ion-justify-content-end">
							<IonCol
								size="auto"
								style={{ marginRight: "0.5rem" }}
							>
								<IonButton color="danger" onClick={handleDelete}>
									<IonIcon icon={trashOutline} />
									Delete
								</IonButton>
							</IonCol>
							<IonCol size="auto">
								<IonButton color="primary" disabled={!canSave} onClick={handleSave}>
									Save Changes
								</IonButton>
							</IonCol>
						</IonRow>
					</IonGrid>
				</IonToolbar>
			</IonFooter>
		</>
	);
}

export function useEditSourceModal() {
	const { present } = useOverlayCoordinator();
	return useCallback((source: SourceView) => {
		return present<EditSourceResult>(
			(dismiss) => <EditSourceModal source={source} dismiss={dismiss} />,
			{ cssClass: "wallet-modal" },
		);
	}, [present]);
}
