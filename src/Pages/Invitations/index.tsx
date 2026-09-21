import { useEffect, useMemo, useState } from "react";
import {
	IonButton,
	IonContent,
	IonFooter,
	IonHeader,
	IonList,
	IonPage,
	IonToolbar,
} from "@ionic/react";
import { shieldOutline } from "ionicons/icons";
import { nip19 } from "nostr-tools";
import { useHistory } from "react-router-dom";
import CopyMorphButton from "@/Components/CopyMorphButton";
import QrCode from "@/Components/QrCode";
import { SourceItemView } from "@/Components/Source/SourceItemView";
import { sourceDisplayName } from "@/Components/Source/sourceDisplayName";
import { SourceReachabilityHint } from "@/Components/Source/SourceReachabilityHint";
import EmptyState from "@/Components/common/ui/EmptyState";
import RootPageToolbar from "@/Layout2/RootPageToolbar";
import StackPageToolbar from "@/Layout2/StackPageToolbar";
import { WALLET_URL } from "@/constants";
import { selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import {
	type SourceView,
	selectAdminSourceViews,
} from "@/State/scoped/backups/sources/selectors";
import { useAppSelector } from "@/State/store/hooks";
import { navToSources } from "@/Pages/Sources/nav";

export default function Invitations() {
	const admins = useAppSelector(selectAdminSourceViews);

	return (
		<IonPage className="ion-page-width">
			{admins.length === 0 ? (
				<InvitationsNoAdmin />
			) : (
				<AdminSourceGate admins={admins} />
			)}
		</IonPage>
	);
}

function InvitationsNoAdmin() {
	const history = useHistory();

	return (
		<>
			<IonHeader className="ion-no-border">
				<RootPageToolbar title="Invitations" />
			</IonHeader>
			<IonContent className="ion-padding">
				<EmptyState
					title="No admin node"
					description="Connect as admin to a Pub node to share invite links for that node."
					ionicon={shieldOutline}
					action={
						<IonButton
							onClick={() => navToSources(history, { from: history.location })}
						>
							Manage connections
						</IonButton>
					}
				/>
			</IonContent>
		</>
	);
}

function pickDefaultPendingId(
	admins: SourceView[],
	favoriteSourceId: string | null,
): string | null {
	if (admins.length === 1) return admins[0].sourceId;
	return admins.find((s) => s.sourceId === favoriteSourceId)?.sourceId ?? null;
}

function AdminSourceGate({ admins }: { admins: SourceView[] }) {
	const [sourceId, setSourceId] = useState<string | null>(() =>
		admins.length === 1 ? admins[0].sourceId : null,
	);

	useEffect(() => {
		if (sourceId && !admins.some((a) => a.sourceId === sourceId)) {
			setSourceId(admins.length === 1 ? admins[0].sourceId : null);
			return;
		}
		if (!sourceId && admins.length === 1) {
			setSourceId(admins[0].sourceId);
		}
	}, [admins, sourceId]);

	const source = useMemo(
		() => admins.find((a) => a.sourceId === sourceId) ?? null,
		[admins, sourceId],
	);

	if (!source) {
		return (
			<AdminSelectStep
				admins={admins}
				onConfirm={setSourceId}
			/>
		);
	}

	return <InvitationsInviteStep source={source} />;
}

function AdminSelectStep({
	admins,
	onConfirm,
}: {
	admins: SourceView[];
	onConfirm: (sourceId: string) => void;
}) {
	const favoriteSourceId = useAppSelector(selectFavoriteSourceId);
	const [pendingId, setPendingId] = useState<string | null>(() =>
		pickDefaultPendingId(admins, favoriteSourceId),
	);

	useEffect(() => {
		if (pendingId && admins.some((a) => a.sourceId === pendingId)) return;
		setPendingId(pickDefaultPendingId(admins, favoriteSourceId));
	}, [admins, pendingId, favoriteSourceId]);

	return (
		<>
			<IonHeader className="ion-no-border">
				<StackPageToolbar title="Select admin node" />
			</IonHeader>
			<IonContent>
				<div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-8 pt-4">
					<p className="m-0 text-sm leading-6 text-muted">
						Choose which Pub node you want to invite people to.
					</p>
					<IonList lines="full" className="bg-transparent">
						{admins.map((admin) => (
							<SourceItemView
								key={admin.sourceId}
								source={admin}
								selected={pendingId === admin.sourceId}
								onClick={() => setPendingId(admin.sourceId)}
								showBalance={false}
							/>
						))}
					</IonList>
				</div>
			</IonContent>
			<IonFooter className="ion-no-border">
				<IonToolbar className="![--background:transparent] [--min-height:0px] [--padding-top:0] [--padding-bottom:0] [--padding-start:0] [--padding-end:0]">
					<div className="mx-auto w-full max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
						<IonButton
							expand="block"
							disabled={!pendingId}
							onClick={() => {
								if (pendingId) onConfirm(pendingId);
							}}
						>
							Continue
						</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>
		</>
	);
}

function InvitationsInviteStep({
	source,
}: {
	source: SourceView;
}) {
	return (
		<>
			<IonHeader className="ion-no-border">
				<RootPageToolbar title="Invitations" />
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 pb-8 pt-2">
					<div className="min-w-0">
						<p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
							Admin node
						</p>
						<p className="m-0 mt-1 truncate text-base font-semibold text-primary">
							{sourceDisplayName(source)}
						</p>
					</div>

					<SourceReachabilityHint source={source} />
					<ReusableInviteLink source={source} />
				</div>
			</IonContent>
		</>
	);
}

function ReusableInviteLink({ source }: { source: SourceView }) {
	const nprofile = useMemo(
		() =>
			nip19.nprofileEncode({
				pubkey: source.lpk,
				relays: source.relays,
			}),
		[source.lpk, source.relays],
	);

	const link = `${WALLET_URL}/sources?addSource=${nprofile}`;

	return (
		<section className="flex flex-col gap-3">
			<p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
				Reusable link
			</p>
			<p className="m-0 text-sm text-muted">
				Anyone with this link can add this node as a connection.
			</p>

			<div className="flex items-center gap-1 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
				<p className="code-string m-0 min-w-0 flex-1 break-all text-xs leading-5 text-primary">
					{link}
				</p>
				<CopyMorphButton
					value={link}
					fill="clear"
					size="small"
					shape="round"
					className="m-0 shrink-0"
					aria-label="Copy invite link"
				/>
			</div>

			<div className="mx-auto w-full max-w-[22rem] sm:max-w-[24rem]  py-2">
				<QrCode value={link} uppercase={false} />
			</div>
		</section>
	);
}
