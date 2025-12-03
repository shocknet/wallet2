import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchNostrUserMetadataEvent } from "@/Api/nostrHandler";

export type NostrProfile = {
	pubkey: string;
	name?: string;
	display_name?: string;
	picture?: string;
	about?: string;
	nip05?: string;
};

export const appApi = createApi({
	reducerPath: "appApi",
	baseQuery: fakeBaseQuery(),
	endpoints: (b) => ({
		getProfile: b.query<NostrProfile | null, { pubkey: string, relays: string[] }>({
			queryFn: async ({ pubkey, relays }) => {
				try {
					const meta = await fetchNostrUserMetadataEvent(pubkey, relays);
					return { data: JSON.parse(meta!.content!) ?? null };
				} catch (e: any) {
					return { error: { status: 'CUSTOM_ERROR', error: e?.message ?? 'failed' } as any };
				}
			},
		}),
	}),
});


export const { useGetProfileQuery } = appApi;
