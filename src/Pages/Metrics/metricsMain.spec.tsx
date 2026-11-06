import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./metricsMain";

const queries = vi.hoisted(() => {
	const query = () => ({
		data: undefined as unknown,
		error: undefined as { message: string } | undefined,
		isFetching: false,
		refetch: vi.fn(),
	});
	return { lndInfo: query(), apps: query(), lnd: query() };
});

vi.mock("./pubDashApi", () => ({
	useGetLndInfoQuery: vi.fn(() => queries.lndInfo),
	useGetAppsMetricsQuery: vi.fn(() => queries.apps),
	useGetLndMetricsQuery: vi.fn(() => queries.lnd),
}));

vi.mock("./pubDashboardCapabilityApi", () => ({
	useGetPubDashboardCapabilityQuery: vi.fn(),
}));

vi.mock("@ionic/react", () => ({
	IonIcon: () => null,
	IonSkeletonText: () => <div />,
	useIonRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/Layout2/Metrics/DashBoardPageChrome", () => ({
	DashBoardPageChrome: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("./DashboardSourceContext", () => ({
	useDashboardSource: () => ({ sourceId: "node-1", lpk: "a".repeat(64), relays: [] }),
	useDashboardSourceSwitch: () => ({ open: vi.fn(), canSwitch: false }),
}));

vi.mock("@/State/store/hooks", () => ({ useAppSelector: () => "https://mempool.space" }));
vi.mock("@/Hooks/useEffectiveTheme", () => ({ useEffectiveTheme: () => "dark" }));
vi.mock("./OverviewEventDialog", () => ({ OverviewEventDialog: () => null }));

vi.mock("@/Components/Dropdowns/PeriodDropdown/PeriodSelector", () => ({
	default: ({ period, offset, prevOffset }: { period: string; offset: number; prevOffset: () => void }) => (
		<div>
			<span>{period}:{offset}</span>
			<button type="button" onClick={prevOffset}>Previous period</button>
		</div>
	),
}));

describe("overview refresh", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		for (const query of Object.values(queries)) {
			query.isFetching = false;
			query.error = undefined;
		}
		queries.lndInfo.data = { synced_to_chain: true, synced_to_graph: true, watchdog_barking: false };
		queries.apps.data = {
			apps: [{ app: { id: "example", name: "Example app" }, fees: 42, users: { total: 3 }, invoices: 4 }],
		};
		queries.lnd.data = { nodes: [] };
	});

	it("refetches all overview data without resetting the selected period", async () => {
		const user = userEvent.setup();
		render(<Dashboard />);
		await user.click(screen.getByRole("button", { name: "Previous period" }));
		await user.click(screen.getByRole("button", { name: "Refresh" }));

		for (const query of Object.values(queries)) {
			expect(query.refetch).toHaveBeenCalledTimes(1);
		}
		expect(screen.getByText("Week:-1")).toBeInTheDocument();
		expect(screen.getByText("Example app")).toBeInTheDocument();
	});

	it.each(["lndInfo", "apps", "lnd"] as const)("disables refresh while %s is fetching and retains cached data", async (name) => {
		const user = userEvent.setup();
		queries[name].isFetching = true;
		const { rerender } = render(<Dashboard />);
		const button = screen.getByRole("button", { name: "Refreshing..." });

		expect(button).toBeDisabled();
		expect(button).toHaveAttribute("aria-busy", "true");
		expect(screen.getByText("Example app")).toBeInTheDocument();
		await user.click(button);
		for (const query of Object.values(queries)) {
			expect(query.refetch).not.toHaveBeenCalled();
		}

		queries[name].isFetching = false;
		queries[name].error = { message: "Request timed out" };
		rerender(<Dashboard />);
		expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
		expect(screen.getByText("Example app")).toBeInTheDocument();
	});

	it("retries all three queries when the overview could not load", async () => {
		for (const query of Object.values(queries)) {
			query.data = undefined;
			query.error = { message: "Request timed out" };
		}
		const user = userEvent.setup();
		render(<Dashboard />);
		expect(screen.getByText("Couldn't load overview")).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Retry" }));
		for (const query of Object.values(queries)) {
			expect(query.refetch).toHaveBeenCalledTimes(1);
		}
	});
});
