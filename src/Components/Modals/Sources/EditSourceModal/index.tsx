import { SourceView } from "@/State/scoped/backups/sources/selectors";
import {
	IonModal,
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
import styles from "../styles/index.module.scss";
import classNames from "classnames";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_BRIDGE_URL, getDeviceId } from "@/constants";
import { PubSourceStatus } from "../helpers";
import { identityActions, selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import CardishList from "@/Components/CardishList";
import { RelayManager } from "@/Components/RelayManager";
import useDebounce from "@/Hooks/useDebounce";
import { useConfirmDialog } from "@/Hooks/useConfirmDialog";
import { normalizeHttpUrl } from "@/lib/url";

interface EditSourceModalProps {
	open: boolean;
	source: SourceView | null;
	onClose: () => void;
	onDelete: (id: string) => void;
}
export function EditSourceModal({ open, onClose, source, onDelete }: EditSourceModalProps) {



	return (
		<IonModal className="wallet-modal" isOpen={open} onDidDismiss={onClose}>
			{source ? (
				<Inner source={source} onClose={onClose} onDelete={onDelete} />
			) : null}
		</IonModal>
	);
}

const Inner = ({
	source,
	onClose,
	onDelete
}: {
	source: SourceView;
	onClose: () => void;
	onDelete: (id: string) => void;
}) => {
	const dispatch = useAppDispatch();

	const showConfirm = useConfirmDialog({
		header: "Delete source",
		message: "Are you sure you wish to delete this source from your profile?",
		confirmText: "Delete",
		danger: true
	});

	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);

	const original = useMemo<SourceView>(() => structuredClone(source), [source]);

	const [label, setLabel] = useState<string>(source.label || "");
	const [bridgeUrl, setBridgeUrl] =
		useState<string>(source.bridgeUrl || "");
	const [finalBridgeUrl, setFinalBridgeUrl] = useState<string | null>(null);
	const [isEditingRelays, setIsEditingRelays] = useState(false);
	const [bridgeInputTouched, setBridgeInputTouched] = useState(false);
	const bridgeInputRef = useRef<HTMLIonInputElement>(null);
	const [bridgeInputError, setBridgeInputError] = useState(false);

	const debouncedBridgeUrl = useDebounce(bridgeUrl, 500);

	const onBridgeInputChange = (e: CustomEvent) => {
		setBridgeUrl(e.detail.value || "");
		setBridgeInputError(false);
		bridgeInputRef.current?.classList.remove("ion-invalid");
	}

	const onBridgeBlur = () => {
		setBridgeInputTouched(true);

		// If we already computed a canonical good one, snap the field to it
		if (!bridgeInputError && finalBridgeUrl) {
			setBridgeUrl(finalBridgeUrl);
		}
	};

	useEffect(() => {
		if (bridgeInputTouched) {
			try {
				const res = normalizeHttpUrl(debouncedBridgeUrl);
				setFinalBridgeUrl(res);
			} catch {
				setBridgeInputError(true);
				setFinalBridgeUrl(null);
			}
		}
	}, [debouncedBridgeUrl, bridgeInputTouched])

	const [relays, setRelays] = useState<string[]>(source.relays);
	const [isNDebitDiscoverable, setIsNDebitDiscoverable] = useState(
		source.isNDebitDiscoverable
	);


	const draft: SourceView = useMemo(() => {
		return {
			...original,
			label,
			bridgeUrl: finalBridgeUrl,
			relays: relays,
			isNDebitDiscoverable
		};
	}, [original, label, finalBridgeUrl, relays, isNDebitDiscoverable]);


	const locallyDirty = useMemo(() => {
		return buildSourceChanges(original, draft).length > 0;
	}, [original, draft]);



	const handleSave = useCallback(() => {
		const ops = buildSourceChanges(original, draft);
		if (ops.length === 0) {
			return;
		}

		const by = getDeviceId();


		for (const op of ops) {
			switch (op.kind) {
				case "label":
					dispatch(sourcesActions.updateSourceLabel({ sourceId: original.sourceId, label: op.value, by }));
					break;
				case "bridgeUrl":
					dispatch(sourcesActions.updateBridgeUrl({ sourceId: original.sourceId, bridgeUrl: op.value, by }));
					break;
				case "relaySet":
					dispatch(sourcesActions.setRelayPresence({
						sourceId: original.sourceId,
						relayUrl: op.relayUrl,
						present: op.present,
						by,
					}));
					break;
				case "isNDebitDiscoverable":
					dispatch(sourcesActions.updateisNDebitDiscoverable({
						sourceId: original.sourceId,
						isNdebitDiscoverable: op.discoverable,
						by,
					}));
			}
		}
	}, [original, dispatch, draft])

	const isFavorite = source.sourceId === favoriteSourceId;

	const makeFavorite = useCallback(() => {
		if (favoriteSourceId === source.sourceId) return;
		const deviceId = getDeviceId();
		dispatch(identityActions.setFavoriteSource({ sourceId: source.sourceId, by: deviceId }));
	}, [source.sourceId, favoriteSourceId, dispatch]);

	const handleDelete = useCallback(() => {
		showConfirm().then(({ role }) => {
			if (role === "confirm") {
				onClose()
				onDelete(source.sourceId);
			}
		})

	}, [onDelete, onClose, source.sourceId, showConfirm]);

	const canSave = locallyDirty && !bridgeInputError;

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>
						<span className={classNames("text-secondary", styles["modal-header"])}>
							<IonIcon style={{ marginRight: "0.4rem" }} icon={pencilOutline} />
							Edit Source
						</span>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton color="secondary" fill="clear" shape="round" onClick={makeFavorite}>
							<IonIcon slot="icon-only" icon={isFavorite ? star : starOutline} />
						</IonButton>
						<IonButton onClick={onClose}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>

				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">

				<PubSourceStatus
					pubkey={original.lpk}
					relays={original.relays}
					passedBeacon={
						original.beaconLastSeenAtMs !== 0
							? {
								beaconLastSeenAtMs: original.beaconLastSeenAtMs,
								data: {
									type: "service",
									name: original.beaconName ?? "",
									avatarUrl: original.beaconAvatarUrl,
									fees: original.beaconFees,
									nextRelay: original.beaconNextRelay,
								},
							}
							: undefined
					}
				/>

				<CardishList listHeader="Source Info" className={classNames(styles["edit-list"], "ion-margin-top")} lines="none">
					<IonItem className={classNames(styles["edit-item-input"], "ion-margin-top")}>

						<IonInput
							placeholder="My savings source"
							color="primary"
							labelPlacement="stacked"
							label="Label"
							value={label}
							onIonInput={(e) => setLabel(e.detail.value ?? "")}
							mode="md"
							fill="outline"
							style={{ "--padding-end": "50px" }}
							className="ion-margin-top"

						/>
					</IonItem>
					<IonItem>
						<IonInput
							color="primary"
							label="Bridge URL"
							labelPlacement="stacked"
							inputmode="url"
							placeholder={DEFAULT_BRIDGE_URL}
							value={bridgeUrl}
							ref={bridgeInputRef}

							mode="md"
							fill="outline"
							className={classNames({
								["ion-invalid"]: bridgeInputError,
								["ion-touched"]: bridgeInputTouched,
								["ion-margin-top"]: true,

							})}
							style={{ "--padding-end": "50px" }}
							errorText="Invalid URL"
							onIonInput={onBridgeInputChange}
							onIonBlur={onBridgeBlur}
							helperText="Enter a valid http URL"
						/>
					</IonItem>
					<IonItem lines="none" className="ion-margin-top">
						<IonToggle checked={isNDebitDiscoverable} onIonChange={(e) => setIsNDebitDiscoverable(e.detail.checked)}>
							<IonText className="text-secondary">ndebit discoverable</IonText>
						</IonToggle>
					</IonItem>


				</CardishList>

				<div>
					<IonList

						lines="none"
						style={{ borderRadius: "12px", marginTop: "0.5rem" }}

					>
						<IonListHeader className="text-secondary" style={{ fontWeight: "600", fontSize: "1rem" }} lines="full">
							<IonLabel >Relays</IonLabel>
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
										<RelayManager relays={relays} setRelays={setRelays} />
									</>
								)
								: relays.map(r => (
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
	)
}


const diffSets = (a: string[], b: string[]) => {
	const A = new Set(a);
	const B = new Set(b);
	const added: string[] = [];
	const removed: string[] = [];
	for (const x of B) if (!A.has(x)) added.push(x);
	for (const x of A) if (!B.has(x)) removed.push(x);
	return { added, removed };
}

const changedStr = (a: string | null | undefined, b: string | null | undefined) => {
	return (a || null) !== (b || null);
}



const buildSourceChanges = (
	original: SourceView,
	draft: SourceView
): (
	| { kind: "label"; value: string | null }
	| { kind: "bridgeUrl"; value: string | null }
	| { kind: "relaySet"; relayUrl: string; present: boolean }
	| { kind: "isNDebitDiscoverable"; discoverable: boolean }
)[] => {
	const ops: ReturnType<typeof buildSourceChanges> = [];

	if (changedStr(original.label, draft.label)) {
		ops.push({ kind: "label", value: draft.label || null });
	}

	if (changedStr(original.bridgeUrl, draft.bridgeUrl)) {
		ops.push({ kind: "bridgeUrl", value: draft.bridgeUrl || null });
	}

	if (original.isNDebitDiscoverable !== draft.isNDebitDiscoverable) {
		ops.push({ kind: "isNDebitDiscoverable", discoverable: draft.isNDebitDiscoverable });
	}

	// relays: original.relays is string[] in your SourceView;
	const { added, removed } = diffSets(original.relays, draft.relays);
	for (const r of added) ops.push({ kind: "relaySet", relayUrl: r, present: true });
	for (const r of removed) ops.push({ kind: "relaySet", relayUrl: r, present: false });

	return ops;
}
