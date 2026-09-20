import { useMemo, useState } from "react"
import { Period } from "../../Components/Dropdowns/LVDropdown"
import {
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonSkeletonText,
} from "@ionic/react";
import PeriodSelector from "@/Components/Dropdowns/PeriodDropdown/PeriodSelector";
import { DashBoardPageChrome } from "@/Layout2/Metrics/DashBoardPageChrome";
import { DashErrorBanner } from "./DashErrorBanner";
import type { AppApiError } from "@/State/api/api";
import { useDashboardSource } from "./DashboardSourceContext";
import { formatTableAmount } from "./metricsDataTable";
import { useGetLndForwardingMetricsQuery, useListChannelsQuery } from "./pubDashApi";

function periodFromSearch(): Period {
	const p = new URLSearchParams(window.location.search).get("period");
	if (p && (Object.values(Period) as string[]).includes(p)) return p as Period;
	return Period.WEEK;
}

function offsetFromSearch(): number {
	const raw = new URLSearchParams(window.location.search).get("offset");
	const n = raw != null ? parseInt(raw, 10) : 0;
	return Number.isFinite(n) ? n : 0;
}

export default function Routing() {
	const [period, setPeriod] = useState<Period>(periodFromSearch)
	const [offset, setOffset] = useState<number>(offsetFromSearch)
	const [showingHtlcs, setShowingHtlcs] = useState(false)
	const adminSource = useDashboardSource();
	const sourceId = adminSource.sourceId;

	const fw = useGetLndForwardingMetricsQuery({ sourceId, period, offset });
	const channels = useListChannelsQuery(
		{ sourceId },
		{ skip: !showingHtlcs },
	);
	const loading = !fw.data && (fw.isFetching || !fw.error);
	const totalOut = useMemo(
		() => fw.data?.events.reduce((sum, event) => sum + event.amt_out, 0) ?? 0,
		[fw.data],
	);
	const channelLabel = useMemo(() => {
		const map = new Map<string, string>();
		for (const channel of channels.data ?? []) {
			if (channel.label) map.set(channel.channel_id, channel.label);
		}
		return (id: string) => map.get(id) || id;
	}, [channels.data]);

	const nextOffset = () => {
		if (period === Period.ALL_TIME || offset >= 0) {
			return
		}
		setOffset(offset + 1)
	}

	const prevOffset = () => {
		if (period === Period.ALL_TIME) {
			return
		}
		setOffset(offset - 1)
	}

	return (
		<DashBoardPageChrome title="Routing">
			<PeriodSelector
				period={period}
				offset={offset}
				setPeriod={setPeriod}
				resetOffset={() => setOffset(0)}
				prevOffset={prevOffset}
				nextOffset={nextOffset}
				disabled={fw.isFetching}
			/>
			{loading ? (
				<RoutingSkeleton />
			) : !fw.data ? (
				<DashErrorBanner
					message={(fw.error as AppApiError | undefined)?.message || "Failed to fetch forwarding metrics"}
					onRetry={() => void fw.refetch()}
				/>
			) : (
				<IonCard style={{ width: "100%", marginTop: 10 }} color="secondary">
					<IonCardHeader>Lnd Forwarding</IonCardHeader>
					{fw.data.events.length === 0 ? (
						<IonCardContent>
							<div>No operations</div>
						</IonCardContent>
					) : (
						<IonCardContent>
							<div>Moved {formatTableAmount(totalOut)} sats in {fw.data.events.length} htlcs</div>
							<div>Earned {formatTableAmount(fw.data.total_fees)} sats</div>
							{!showingHtlcs ? (
								<IonButton onClick={() => setShowingHtlcs(true)}>Show Htlcs</IonButton>
							) : (
								<IonButton onClick={() => setShowingHtlcs(false)}>Hide Htlcs</IonButton>
							)}
							{showingHtlcs && (
								<IonList>
									<IonListHeader>
										<IonLabel>From</IonLabel>
										<IonLabel>Sats In</IonLabel>
										<IonLabel>Sats Out</IonLabel>
										<IonLabel>Fees</IonLabel>
										<IonLabel>To</IonLabel>
									</IonListHeader>
									{fw.data.events.map((event, i) => (
										<IonItem key={`${event.chan_id_in}-${event.chan_id_out}-${event.at_unix}-${i}`}>
											<IonLabel>{channelLabel(event.chan_id_in)}</IonLabel>
											<IonLabel>{formatTableAmount(event.amt_in)}</IonLabel>
											<IonLabel>{formatTableAmount(event.amt_out)}</IonLabel>
											<IonLabel>{formatTableAmount(event.fee)}</IonLabel>
											<IonLabel>{channelLabel(event.chan_id_out)}</IonLabel>
										</IonItem>
									))}
								</IonList>
							)}
						</IonCardContent>
					)}
				</IonCard>
			)}
		</DashBoardPageChrome>
	);
}

function RoutingSkeleton() {
	return (
		<IonCard style={{ width: "100%", marginTop: 10 }} color="secondary">
			<IonCardHeader>Lnd Forwarding</IonCardHeader>
			<IonCardContent>
				<IonSkeletonText animated style={{ width: "70%" }} />
				<IonSkeletonText animated style={{ width: "30%" }} />
			</IonCardContent>
		</IonCard>
	);
}
