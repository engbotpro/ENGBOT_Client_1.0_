import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: '',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export interface PlatformSettings {
  id: string;
  bitcoinWalletAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export const platformSettingsAPI = createApi({
  reducerPath: "platformSettingsAPI",
  baseQuery,
  tagTypes: ["PlatformSettings"],
  endpoints: (builder) => ({
    getPlatformSettings: builder.query<PlatformSettings, void>({
      query: () => "/api/platform-settings",
      providesTags: ["PlatformSettings"],
    }),

    updatePlatformSettings: builder.mutation<{ message: string; settings: PlatformSettings }, { bitcoinWalletAddress: string }>({
      query: (data) => ({
        url: "/api/platform-settings",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["PlatformSettings"],
    }),
  }),
});

export const {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} = platformSettingsAPI;
