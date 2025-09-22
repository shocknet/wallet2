import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

export const appApi = createApi({
	reducerPath: "appApi",
	baseQuery: fakeBaseQuery(),
	tagTypes: ["History", "SourceMeta"],
	endpoints: () => ({}),
});

export const { usePrefetch } = appApi;
