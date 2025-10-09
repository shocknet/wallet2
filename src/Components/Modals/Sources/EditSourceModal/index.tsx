import { LnAddrView, NprofileView, SourceView } from "@/State/scoped/backups/sources/selectors";
import { SourceType } from "@/State/scoped/common";
import {
	IonModal,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonIcon,
	IonContent,
	IonFooter
} from "@ionic/react";
import { closeOutline, trashOutline, pencilOutline, starOutline, star } from "ionicons/icons";
import styles from "../styles/index.module.scss";
import classNames from "classnames";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { useCallback, useMemo, useState } from "react";
import { getDeviceId } from "@/constants";
import { BasicSourceInfoEdit, PubSourceStatus } from "../helpers";
import { identityActions, selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";

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

	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);

	const original = useMemo<SourceView>(() => structuredClone(source), [source]);

	const [label, setLabel] = useState<string>(source.label || "");
	const [bridgeUrl, setBridgeUrl] =
		useState<string>(source.type === SourceType.NPROFILE_SOURCE ? source.bridgeUrl || "" : "");
	const [relays, setRelays] = useState<string[]>(
		source.type === SourceType.NPROFILE_SOURCE ? source.relays : []
	);
	const [isNDebitDiscoverable, setIsNDebitDiscoverable] = useState(
		source.type === SourceType.NPROFILE_SOURCE ? source.isNDebitDiscoverable : false
	);


	const draft: SourceView = useMemo(() => {
		if (original.type === SourceType.NPROFILE_SOURCE) {
			return {
				...original,
				label,
				bridgeUrl,
				relays: relays,
				isNDebitDiscoverable
			} as NprofileView;
		} else {
			return {
				...original,
				label,
			} as LnAddrView;
		}
	}, [original, label, bridgeUrl, relays, isNDebitDiscoverable]);


	const locallyDirty = useMemo(() => {
		return buildSourceChanges(original, draft).length > 0;
	}, [original, draft]);



	const handleSave = useCallback(() => {
		const ops = buildSourceChanges(original, draft);
		if (ops.length === 0) {
			return;
		}

		const now = Date.now();
		const by = getDeviceId();


		for (const op of ops) {
			switch (op.kind) {
				case "label":
					dispatch(sourcesActions.updateSourceLabel({ sourceId: original.sourceId, label: op.value, now, by }));
					break;
				case "bridgeUrl":
					if (original.type === SourceType.NPROFILE_SOURCE) {
						dispatch(sourcesActions.updateBridgeUrl({ sourceId: original.sourceId, bridgeUrl: op.value, now, by }));
					}
					break;
				case "relaySet":
					if (original.type === SourceType.NPROFILE_SOURCE) {
						dispatch(sourcesActions.setRelayPresence({
							sourceId: original.sourceId,
							relayUrl: op.relayUrl,
							present: op.present,
							by,
							now
						}));
					}
					break;
				case "isNDebitDiscoverable":
					if (original.type === SourceType.NPROFILE_SOURCE) {
						dispatch(sourcesActions.updateisNDebitDiscoverable({
							sourceId: original.sourceId,
							isNdebitDiscoverable: op.discoverable,
							by,
							now
						}));
					}
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
		onClose()
		onDelete(source.sourceId);
	}, [onDelete, onClose, source.sourceId]);

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>
						<span className={classNames("text-medium", styles["modal-header"])}>
							<IonIcon style={{ marginRight: "0.4rem" }} icon={pencilOutline} />
							Edit Source
						</span>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton color="light" fill="clear" shape="round" onClick={makeFavorite}>
							<IonIcon slot="icon-only" icon={isFavorite ? star : starOutline} />
						</IonButton>
						<IonButton onClick={onClose}><IonIcon icon={closeOutline} /></IonButton>
					</IonButtons>

				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				{
					original.type === SourceType.NPROFILE_SOURCE
					&&
					<PubSourceStatus pubkey={original.lpk} relays={original.relays} />
				}
				{
					original.type === SourceType.NPROFILE_SOURCE
					&&
					<BasicSourceInfoEdit
						label={label}
						setLabel={setLabel}
						relays={relays}
						setRelays={setRelays}
						bridgeUrl={bridgeUrl}
						setBridgeUrl={setBridgeUrl}
						isNDebitDiscoverable={isNDebitDiscoverable}
						setIsNDebitDiscoverable={setIsNDebitDiscoverable}
					/>

				}
				{
					original.type === SourceType.LIGHTNING_ADDRESS_SOURCE
					&&
					<BasicSourceInfoEdit
						label={label}
						setLabel={setLabel}
					/>

				}
			</IonContent>
			<IonFooter className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="end">

						<IonButton color="primary" disabled={!locallyDirty} onClick={handleSave}>
							Save Changes
						</IonButton>

					</IonButtons>
					<IonButtons slot="start">
						<IonButton color="danger" onClick={handleDelete}>
							<IonIcon icon={trashOutline} />
							Delete
						</IonButton>
					</IonButtons>
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
	return (a ?? null) !== (b ?? null);
}



const buildSourceChanges = (
	original: SourceView,
	draft: SourceView
): (
	| { kind: "label"; value: string | undefined }
	| { kind: "bridgeUrl"; value: string | null }
	| { kind: "relaySet"; relayUrl: string; present: boolean }
	| { kind: "isNDebitDiscoverable"; discoverable: boolean }
)[] => {
	const ops: ReturnType<typeof buildSourceChanges> = [];

	if (changedStr(original.label, draft.label)) {
		ops.push({ kind: "label", value: draft.label ?? undefined });
	}

	if (original.type === SourceType.NPROFILE_SOURCE && draft.type === SourceType.NPROFILE_SOURCE) {
		// bridgeUrl
		if (changedStr(original.bridgeUrl ?? null, draft.bridgeUrl ?? null)) {
			ops.push({ kind: "bridgeUrl", value: draft.bridgeUrl ?? null });
		}

		if (original.isNDebitDiscoverable !== draft.isNDebitDiscoverable) {
			ops.push({ kind: "isNDebitDiscoverable", discoverable: draft.isNDebitDiscoverable });
		}

		// relays: original.relays is string[] in your SourceView;
		const { added, removed } = diffSets(original.relays, draft.relays);
		for (const r of added) ops.push({ kind: "relaySet", relayUrl: r, present: true });
		for (const r of removed) ops.push({ kind: "relaySet", relayUrl: r, present: false });
	}

	return ops;
}
