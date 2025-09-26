import React, { useEffect, useMemo, useState } from "react";
import {
	IonBadge,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonModal,
	IonNote,
	IonPage,
	IonSelect,
	IonSelectOption,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import {
	addOutline,
	checkmarkCircle,
	closeOutline,
	cloudUploadOutline,
	saveOutline,
	trashOutline,
} from "ionicons/icons";
import { RouteComponentProps, useHistory, useLocation } from "react-router";
import { useAppDispatch, useAppSelector } from "@/State/store/hooks";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import {
	identityActions,
	selectIdentityDraft,
	selectIsIdentityDirty,
} from "@/State/scoped/backups/identity/slice";
import { selectSourceViews } from "@/State/scoped/backups/sources/selectors";
import {
	docsSelectors,
	sourcesActions,
} from "@/State/scoped/backups/sources/slice";
import { SourceType } from "@/State/scoped/common";
import { getDeviceId } from "@/constants";
import { addSource } from "@/State/scoped/backups/sources/thunks";
import { toast } from "react-toastify";
import HomeHeader from "@/Layout2/HomeHeader";



const useDeviceId = () => getDeviceId();



const IdentityOverviewPage = (props: RouteComponentProps) => {
	const dispatch = useAppDispatch();
	const history = useHistory();
	const location = useLocation<{ from?: "created" } | undefined>();
	const deviceId = useDeviceId();

	// registry + doc
	const registry = useAppSelector(selectActiveIdentity)!; // protected route
	const idDoc = useAppSelector(selectIdentityDraft)!;



	// identity fields (local form state)
	const [label, setLabel] = useState(idDoc.label.value ?? "");
	const [bridgeUrl, setBridgeUrl] = useState(idDoc.bridge_url.value ?? "");
	const [favoriteId, setFavoriteId] = useState<string | null>(
		idDoc.favorite_source_id.value ?? null
	);
	const isDirty = useAppSelector(selectIsIdentityDirty);
	const lastPublishedAt = useAppSelector(
		(s) => s.scoped?.identity?.lastPublishedAt
	);

	// reflect external changes (remote merges / other tabs)
	useEffect(() => setLabel(idDoc.label.value ?? ""), [idDoc.label.value]);
	useEffect(
		() => setBridgeUrl(idDoc.bridge_url.value ?? ""),
		[idDoc.bridge_url.value]
	);
	useEffect(
		() => setFavoriteId(idDoc.favorite_source_id.value ?? null),
		[idDoc.favorite_source_id.value]
	);

	// sources view
	const sourceViews = useAppSelector(selectSourceViews);


	const favoriteOptions = useMemo(
		() => sourceViews.map((s) => ({ id: s.sourceId, label: s.label })),
		[sourceViews]
	);

	const onSaveIdentity = () => {
		if (label !== idDoc.label.value) {
			dispatch(identityActions.updateIdentityLabel({ label, by: deviceId }));
		}
		const nextBridge = bridgeUrl.trim() || null;
		if (nextBridge !== (idDoc.bridge_url.value ?? null)) {
			dispatch(identityActions.setBridgeUrl({ url: nextBridge, by: deviceId }));
		}
		if (favoriteId !== (idDoc.favorite_source_id.value ?? null)) {
			dispatch(
				identityActions.setFavoriteSource({ sourceId: favoriteId, by: deviceId })
			);
		}

	};

	const [addSourceModalOpen, setAddSourceModalOpen] = useState(false);

	// “Continue” CTA if redirected from identity creation
	const cameFromCreate = location.state?.from === "created";
	const onContinue = () => {
		// clear “from” so going back here doesn’t show CTA again
		history.replace({ pathname: "/identity/overview", state: undefined });
		history.push("/home");
	};

	return (
		<IonPage className="ion-page-width">
			<HomeHeader {...props}>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton color="primary" routerLink="/identities" routerDirection="root" >
							Go to Identities
						</IonButton>

					</IonButtons>
					<div slot="end" className="ion-margin-end ion-text-right">
						{isDirty ? (
							<IonBadge color="warning">
								<IonIcon icon={cloudUploadOutline} className="ion-margin-end" />
								pending publish…
							</IonBadge>
						) : (
							<IonBadge color="success">
								<IonIcon icon={checkmarkCircle} className="ion-margin-end" />
								synced
							</IonBadge>
						)}
					</div>
				</IonToolbar>
			</HomeHeader>
			<IonHeader>

			</IonHeader>

			<IonContent>
				<IonList inset className="ion-margin-vertical">
					<SectionTitle title="Profile" />

					<ReadRow
						label="Pubkey"
						value={<code style={{ fontSize: 12 }}>{registry.pubkey}</code>}
					/>

					{"relays" in registry && Array.isArray(registry.relays) && (
						<>
							<ReadRow label="Relays" value={`${registry.relays.length} configured`} />
							{registry.relays.map((r) => (
								<IonItem key={r} lines="none">
									<IonLabel className="ion-text-wrap">
										<code style={{ fontSize: 12 }}>{r}</code>
									</IonLabel>
								</IonItem>
							))}
						</>
					)}

					{/* Editable identity fields */}
					<FieldRow label="Label" help="Local display name">
						<IonInput
							value={label}
							placeholder="e.g. Main Wallet"
							onIonChange={(e) => setLabel(e.detail.value ?? "")}
							inputmode="text"
						/>
					</FieldRow>

					<FieldRow label="Bridge URL" help="Optional service endpoint">
						<IonInput
							value={bridgeUrl}
							placeholder="https://…"
							onIonChange={(e) => setBridgeUrl(e.detail.value ?? "")}
							inputmode="url"
						/>
					</FieldRow>

					<FieldRow label="Favorite Source" help="Used as default in UI">
						<IonSelect
							interface="popover"
							value={favoriteId ?? undefined}
							placeholder="None"
							onIonChange={(e) => setFavoriteId((e.detail.value as string) ?? null)}
						>
							<IonSelectOption value={undefined}>None</IonSelectOption>
							{favoriteOptions.map((o) => (
								<IonSelectOption key={o.id} value={o.id}>
									{o.label}
								</IonSelectOption>
							))}
						</IonSelect>
					</FieldRow>

					<IonItem lines="none">
						<IonButton onClick={onSaveIdentity}>
							<IonIcon slot="start" icon={saveOutline} />
							Save Changes
						</IonButton>
					</IonItem>

					<SectionTitle title="Sources" />
					<IonButton onClick={() => setAddSourceModalOpen(true)}>Add source</IonButton>

					{/* Editable source rows */}
					{sourceViews.map((s) => (
						<SourceRow key={s.sourceId} sourceId={s.sourceId} defaultLabel={s.label} />
					))}

					{lastPublishedAt && (
						<IonItem lines="none">
							<IonLabel>Last Published</IonLabel>
							<IonNote slot="end" color="medium">
								{new Date(lastPublishedAt).toLocaleString()}
							</IonNote>
						</IonItem>
					)}

					{/* “Continue” CTA if arrived from create-identity flow */}
					{cameFromCreate && (
						<IonItem lines="none" className="ion-margin-top">
							<IonButton expand="block" onClick={onContinue}>
								Continue
							</IonButton>
						</IonItem>
					)}
				</IonList>

				{/* Modal for adding a source */}
				<AddSourceModal open={addSourceModalOpen} onClose={() => setAddSourceModalOpen(false)} />
			</IonContent>
		</IonPage>
	);
};

export default IdentityOverviewPage;

// ---------- Add Source Modal ----------------------------------------------

const AddSourceModal = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
	const dispatch = useAppDispatch();

	const [input, setInput] = useState("");
	const [label, setLabel] = useState("");

	const onAdd = async () => {
		const trimmed = input.trim();
		if (!trimmed) return;
		try {
			await dispatch(addSource(trimmed, label.trim() || undefined));
			setInput("");
			setLabel("");
			onClose()
		} catch (err: any) {
			toast.error(err?.message || "addSource failed");
		}
	};

	return (
		<IonModal isOpen={open} onDidDismiss={onClose}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Add Source</IonTitle>
					<IonButton slot="end" fill="clear" onClick={onClose}>
						<IonIcon icon={closeOutline} />
					</IonButton>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<IonList inset className="ion-margin-vertical">
					<FieldRow label="Input" help="nprofile / LN Address / LNURL-p">
						<IonInput
							value={input}
							onIonChange={(e) => setInput(e.detail.value ?? "")}
							placeholder="Paste nprofile, LN address, or LNURL"
						/>
					</FieldRow>
					<FieldRow label="Label (optional)">
						<IonInput
							value={label}
							onIonChange={(e) => setLabel(e.detail.value ?? "")}
							placeholder="Display label"
						/>
					</FieldRow>
					<IonItem lines="none">
						<IonButton expand="block" onClick={onAdd} disabled={!input.trim()}>
							<IonIcon slot="start" icon={addOutline} />
							Add
						</IonButton>
					</IonItem>
				</IonList>
			</IonContent>
		</IonModal>
	);
};




const SourceRow: React.FC<{ sourceId: string; defaultLabel: string }> = ({
	sourceId,
	defaultLabel,
}) => {
	const dispatch = useAppDispatch();
	const deviceId = getDeviceId();
	const doc = useAppSelector(state => docsSelectors.selectById(state, sourceId))!;

	const [label, setLabel] = useState(defaultLabel);
	useEffect(() => setLabel(defaultLabel), [defaultLabel]);




	const onSaveLabel = () => {
		if (label !== doc.draft.label.value) {
			dispatch(
				sourcesActions.updateSourceLabel({
					sourceId,
					label,
					by: deviceId,
					now: Date.now(),
				})
			);
		}
	};

	const [newRelay, setNewRelay] = useState("");

	const toggleRelay = (relayUrl: string, nextPresent: boolean) => {
		dispatch(
			sourcesActions.setRelayPresence({
				sourceId,
				relayUrl,
				present: nextPresent,
				by: deviceId,
				now: Date.now(),
			})
		);
	};

	const addRelay = () => {
		const url = newRelay.trim();
		if (!url) return;
		toggleRelay(url, true);
		setNewRelay("");
	};

	const removeSource = () => {
		dispatch(sourcesActions.markDeleted({ sourceId, by: deviceId }))
	};

	return (
		<IonItem lines="full">
			<IonLabel className="ion-text-wrap">
				<div className="ion-margin-bottom">
					<strong>Source</strong>
					<IonNote className="ion-margin-start" color="medium">
						&nbsp;({doc.draft.type})
					</IonNote>
				</div>

				<div className="ion-margin-bottom">
					<strong>Label</strong>
					<IonInput
						className="ion-margin-top"
						value={label}
						onIonChange={(e) => setLabel(e.detail.value ?? "")}
						onKeyDown={(e) => e.key === "Enter" && onSaveLabel()}
					/>
					{label !== doc.draft.label.value && (
						<IonButton size="small" className="ion-margin-top" onClick={onSaveLabel}>
							<IonIcon slot="start" icon={saveOutline} />
							Save
						</IonButton>
					)}
				</div>

				{doc.draft.type === SourceType.NPROFILE_SOURCE && (
					<>
						<div className="ion-margin-top">
							<strong>Relays</strong>
						</div>
						{Object.entries(doc.draft.relays).length === 0 && (
							<IonNote color="medium">No relays</IonNote>
						)}
						{Object.entries(doc.draft.relays).filter(([_, value]) => value.present).map(([url, flag]) => (
							<IonItem key={url} lines="none">
								<IonLabel className="ion-text-wrap">
									<code style={{ fontSize: 12 }}>{url}</code>
								</IonLabel>

							</IonItem>
						))}
						<IonItem lines="none" className="ion-margin-top">
							<IonInput
								value={newRelay}
								onIonChange={(e) => setNewRelay(e.detail.value ?? "")}
								placeholder="wss://relay.example.com"
							/>
							<IonButton slot="end" size="small" onClick={addRelay}>
								Add Relay
							</IonButton>
						</IonItem>
					</>
				)}
			</IonLabel>

			<IonButton slot="end" color="danger" fill="clear" onClick={removeSource}>
				<IonIcon icon={trashOutline} />
			</IonButton>
		</IonItem>
	);
};


const FieldRow = ({
	label,
	help,
	children,
}: {
	label: string;
	help?: string;
	children: React.ReactNode;
}) => (
	<IonItem lines="full">
		<IonLabel position="stacked">
			{label} {help && <IonNote color="medium" className="ion-margin-start">{help}</IonNote>}
		</IonLabel>
		{children}
	</IonItem>
);

const ReadRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
	<IonItem lines="none">
		<IonLabel>{label}</IonLabel>
		<div slot="end">
			<IonText>{value ?? "—"}</IonText>
		</div>
	</IonItem>
);

const SectionTitle = ({ title }: { title: string }) => (
	<IonItem color="light">
		<IonLabel>
			<strong>{title}</strong>
		</IonLabel>
	</IonItem>
);
