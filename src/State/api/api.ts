import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchNostrUserMetadataEvent } from "@/Api/nostrHandler";

export type NostrProfile = {
	pubkey: string;
	username?: string;
	name?: string;
	display_name?: string;
	picture?: string;
	banner?: string;
	about?: string;
	nip05?: string;
	lud16?: string;
	lud06?: string;
};

export const appApi = createApi({
	reducerPath: "appApi",
	baseQuery: fakeBaseQuery(),
	endpoints: (b) => ({
		getProfile: b.query<NostrProfile | null, { pubkey: string, relays: string[] }>({
			queryFn: async ({ pubkey, relays }) => {
				try {
					const meta = await fetchNostrUserMetadataEvent(pubkey, relays);
					if (!meta?.content) {
						return { data: null };
					}
					const parsed = JSON.parse(meta.content) as Omit<NostrProfile, "pubkey"> | null;
					if (!parsed || typeof parsed !== "object") {
						return { data: null };
					}
					return { data: { pubkey, ...parsed } };
				} catch (e: any) {
					return { error: { status: 'CUSTOM_ERROR', error: e?.message ?? 'failed' } as any };
				}
			},
		}),
	}),
});


export const { useGetProfileQuery } = appApi;
