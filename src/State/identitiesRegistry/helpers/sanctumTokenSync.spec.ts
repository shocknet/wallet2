import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TokenDataAdapter, TokensData } from "sanctum-sdk";
import { IdentityType } from "../types";
import { ensureFreshSanctumTokens } from "./sanctumTokenSync";

const { disk } = vi.hoisted(() => ({
	disk: { tokensData: null as TokensData | null },
}));

vi.mock("redux-persist", () => ({
	getStoredState: vi.fn(async () => ({
		entities: {
			pub: {
				type: IdentityType.SANCTUM,
				sanctumTokens: { storage: "inline", tokensData: disk.tokensData },
			},
		},
	})),
}));
vi.mock("@/State/store/store", () => ({ default: {}, persistor: {} }));
vi.mock("@/storage/redux-persist-ionic-storage-adapter", () => ({ default: {} }));
vi.mock("../slice", () => ({ identitiesRegistryPersistKey: "_identities-registry" }));
vi.mock("../identitySyncThunks", () => ({ setIdentitySanctumTokensData: vi.fn() }));

const HOUR = 60 * 60 * 1000;

function makeTokens(refreshToken: string, expiresAt: number): TokensData {
	return {
		access_token: `access-${refreshToken}`,
		refresh_token: refreshToken,
		expires_at: expiresAt,
		refresh_expires_at: Date.now() + 24 * HOUR,
	} as TokensData;
}

function makeTab(initial: TokensData): { adapter: TokenDataAdapter; tokens: () => TokensData | null } {
	let tokens: TokensData | null = initial;
	return {
		tokens: () => tokens,
		adapter: {
			getTokenData: () => tokens,
			setTokenData: (next) => {
				tokens = next;
				disk.tokensData = next;
			},
			clearTokenData: () => {
				tokens = null;
			},
		},
	};
}

function installFakeLock() {
	let tail = Promise.resolve();
	vi.stubGlobal("navigator", {
		locks: {
			request: (_name: string, fn: () => Promise<unknown>) => {
				const run = tail.then(fn);
				tail = run.then(() => { }, () => { });
				return run;
			},
		},
	});
}

describe("ensureFreshSanctumTokens", () => {
	beforeEach(() => {
		installFakeLock();
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("does nothing while the access token is still valid", async () => {
		const tab = makeTab(makeTokens("r1", Date.now() + HOUR));
		const refresh = vi.fn(async () => { });

		await ensureFreshSanctumTokens({ pubkey: "pub", adapter: tab.adapter, refresh });

		expect(refresh).not.toHaveBeenCalled();
	});

	it("refreshes once across tabs and the other tab adopts the saved tokens", async () => {
		const expired = makeTokens("r1", Date.now() - HOUR);
		disk.tokensData = expired;
		const tabA = makeTab(expired);
		const tabB = makeTab(expired);
		const usedRefreshTokens: string[] = [];

		const refreshFor = (tab: ReturnType<typeof makeTab>) => async () => {
			usedRefreshTokens.push(tab.tokens()!.refresh_token);
			await tab.adapter.setTokenData(makeTokens("r2", Date.now() + HOUR));
		};

		await Promise.all([
			ensureFreshSanctumTokens({ pubkey: "pub", adapter: tabA.adapter, refresh: refreshFor(tabA) }),
			ensureFreshSanctumTokens({ pubkey: "pub", adapter: tabB.adapter, refresh: refreshFor(tabB) }),
		]);

		expect(usedRefreshTokens).toEqual(["r1"]);
		expect(tabA.tokens()?.refresh_token).toBe("r2");
		expect(tabB.tokens()?.refresh_token).toBe("r2");
	});
});
