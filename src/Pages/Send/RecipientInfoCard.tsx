import {
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonNote,
	IonText,
	IonThumbnail,
} from "@ionic/react";
import {
	atCircleOutline,
	flash,
	globeOutline,
} from "ionicons/icons";
import type { ReactNode } from "react";
import { useState } from "react";
import { FiatDisplay } from "@/Components/FiatDisplay";
import { truncateTextMiddle } from "@/lib/format";
import { priceTypeToString } from "@/lib/noffer";
import {
	InputClassification,
	type ParsedInput,
	type ParsedInvoiceInput,
	type ParsedLightningAddressInput,
	type ParsedLnurlPayInput,
	type ParsedNofferInput,
} from "@/lib/types/parse";
import { formatSatoshi, satoshi } from "@/lib/units";
import type { AmountRange } from "./types";

type RecipientInfoCardProps = {
	parsed: ParsedInput;
	nofferRange?: AmountRange | null;
};

export function RecipientInfoCard({ parsed, nofferRange }: RecipientInfoCardProps) {
	switch (parsed.type) {
		case InputClassification.LN_INVOICE:
			return <InvoiceInfoCard invoice={parsed} />;
		case InputClassification.LNURL_PAY:
		case InputClassification.LN_ADDRESS:
			return <LnurlInfoCard lnurl={parsed} />;
		case InputClassification.NOFFER:
			return <NofferInfoCard noffer={parsed} range={nofferRange} />;
		default:
			return null;
	}
}

function InvoiceInfoCard({ invoice }: { invoice: ParsedInvoiceInput }) {
	return (
		<RecipientCard
			icon={flash}
			title="Lightning invoice"
			subtitle={truncateTextMiddle(invoice.data, 10, 8)}
		>
			{invoice.memo ? (
				<InfoItem label="Description" wrap lines="none">
					{invoice.memo}
				</InfoItem>
			) : null}
		</RecipientCard>
	);
}

function LnurlInfoCard({
	lnurl,
}: {
	lnurl: ParsedLnurlPayInput | ParsedLightningAddressInput;
}) {
	const isLnurl = lnurl.type === InputClassification.LNURL_PAY;
	const [expandImage, setExpandImage] = useState(false);

	return (
		<RecipientCard
			icon={isLnurl ? globeOutline : atCircleOutline}
			title={isLnurl ? "LNURL Pay" : "Lightning address"}
			subtitle={lnurl.identifier || lnurl.domain}
		>
			<InfoItem label="Amount range">
				{`${formatSatoshi(lnurl.min)} – ${formatSatoshi(lnurl.max)} sats`}
			</InfoItem>
			{lnurl.description ? (
				<InfoItem label="Description" wrap>
					{lnurl.description}
				</InfoItem>
			) : null}
			{lnurl.image ? (
				<IonItem button detail={false} lines="none" onClick={() => setExpandImage(true)}>
					<IonThumbnail slot="start">
						<img alt="" src={lnurl.image} />
					</IonThumbnail>
					<IonLabel>Tap to expand image</IonLabel>
				</IonItem>
			) : null}
			{expandImage && lnurl.image ? (
				<button
					type="button"
					className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-6"
					onClick={() => setExpandImage(false)}
				>
					<img
						src={lnurl.image}
						alt=""
						className="max-h-full max-w-full object-contain"
					/>
				</button>
			) : null}
		</RecipientCard>
	);
}

function NofferInfoCard({
	noffer,
	range,
}: {
	noffer: ParsedNofferInput;
	range?: AmountRange | null;
}) {
	const amount = noffer.noffer.price != null ? satoshi(noffer.noffer.price) : null;

	return (
		<RecipientCard
			icon="nostr"
			title="Noffer"
			subtitle={priceTypeToString(noffer.noffer.priceType)}
		>
			{amount != null ? (
				<InfoItem
					label="Amount"
					value={
						<span className="flex items-baseline justify-end gap-1.5">
							{formatSatoshi(amount)} sats
							<FiatDisplay sats={amount} />
						</span>
					}
				/>
			) : null}
			{range ? (
				<InfoItem label="Amount range">
					{`${formatSatoshi(range.min)} – ${formatSatoshi(range.max)} sats`}
				</InfoItem>
			) : null}
			<InfoItem label="Offer" wrap>
				{truncateTextMiddle(noffer.noffer.offer, 10, 8)}
			</InfoItem>
			<InfoItem label="Relay" wrap lines="none">
				{noffer.noffer.relay}
			</InfoItem>
		</RecipientCard>
	);
}

function RecipientCard({
	icon,
	title,
	subtitle,
	children,
}: {
	icon: string;
	title: string;
	subtitle?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<IonText className="px-1 text-sm text-muted">Sending to</IonText>
			<IonCard className="m-0 rounded-lg [--background:var(--app-surface)] [--ion-item-background:var(--app-surface)]">
				<IonCardHeader>
					<div className="flex items-center gap-2">
						<IonIcon icon={icon} color="warning" className="text-xl" aria-hidden />
						<div className="min-w-0">
							<IonCardTitle className="text-base">{title}</IonCardTitle>
							{subtitle ? (
								<IonCardSubtitle className="normal-case">{subtitle}</IonCardSubtitle>
							) : null}
						</div>
					</div>
				</IonCardHeader>
				{children ? (
					<IonCardContent className="ion-no-padding">
						<IonList className="m-0 bg-transparent [--background:transparent]">
							{children}
						</IonList>
					</IonCardContent>
				) : null}
			</IonCard>
		</div>
	);
}

function InfoItem({
	label,
	value,
	wrap = false,
	lines,
	children,
}: {
	label: string;
	value?: ReactNode;
	wrap?: boolean;
	lines?: "full" | "inset" | "none";
	children?: ReactNode;
}) {
	const content = value ?? children;

	if (wrap) {
		return (
			<IonItem lines={lines}>
				<IonLabel>
					{label}
					<IonNote className="ion-text-wrap mt-0.5 block text-muted">
						{content}
					</IonNote>
				</IonLabel>
			</IonItem>
		);
	}

	return (
		<IonItem lines={lines}>
			<IonLabel>{label}</IonLabel>
			<IonText slot="end" className="text-right text-sm text-muted">
				{content}
			</IonText>
		</IonItem>
	);
}
