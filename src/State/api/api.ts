import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
	fetchProfile,
	normalizeRelays,
	type NostrProfile,
	verifyNip05Claim,
} from "../../lib/profile";



const ONE_HOUR_SECONDS = 60 * 60;

export const appApi = createApi({
	reducerPath: "appApi",
	baseQuery: fakeBaseQuery(),
	endpoints: (b) => ({
		getProfile: b.query<NostrProfile | null, { pubkey: string; relays: string[] }>({
			serializeQueryArgs: ({ queryArgs }) => ({
				pubkey: queryArgs.pubkey,
				relays: normalizeRelays(queryArgs.relays),
			}),
			queryFn: async ({ pubkey, relays }) => {
				try {
					const profile = await fetchProfile(pubkey, relays);
					return { data: profile };
				} catch (e: unknown) {
					const message = e instanceof Error ? e.message : "failed";
					return { error: { status: "CUSTOM_ERROR", error: message } };
				}
			},
		}),
		verifyNip05: b.query<boolean, { pubkey: string; nip05: string }>({
			keepUnusedDataFor: ONE_HOUR_SECONDS,
			queryFn: async ({ pubkey, nip05 }) => {
				try {
					const verification = await verifyNip05Claim(pubkey, nip05);
					return { data: verification };
				} catch (e: unknown) {
					const message = e instanceof Error ? e.message : "failed";
					return { error: { status: "CUSTOM_ERROR", error: message } };
				}
			},
		}),
	}),
});

export const { useGetProfileQuery, useVerifyNip05Query } = appApi;
