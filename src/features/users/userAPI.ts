import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { User } from "../../types";

// Interface para as estatísticas do dashboard
export interface DashboardStats {
  totalUsers: number;
  subscribers: number;
  monthlyRevenue: number;
  planDetails: Array<{
    plan: string;
    count: number;
    price: number;
    revenue: number;
  }>;
}

// Interface para o histórico de planos
export interface PlanHistoryEntry {
  id: string;
  userId: string;
  planName: string;
  oldPlan?: string;
  changeType: 'new' | 'upgrade' | 'downgrade' | 'cancelled';
  price: number;
  billingCycle: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Cria um baseQuery que inclui o header de Authorization a partir do localStorage
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

export const userAPI = createApi({
  // Use um reducerPath único para evitar conflitos com outros createApi
  reducerPath: "userAPI", 
  baseQuery,
  tagTypes: ["Events", "Units", "Users", "Plans", "Oil"],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),

    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "/users/stats",
      providesTags: ["Users"],
    }),

    getUserPlanHistory: builder.query<PlanHistoryEntry[], string>({
      query: (userId) => `/users/${userId}/plan-history`,
      providesTags: ["Users"],
    }),

    createUser: builder.mutation<{ message: string }, Partial<User>>({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),

    updateUser: builder.mutation<{ message: string }, Partial<User>>({
      query: (data) => ({
        url: `/users/${data.id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    // Aceitar termos de uso
    acceptTerms: builder.mutation<{ message: string; termsAccepted: boolean; termsAcceptedAt: string }, void>({
      query: () => ({
        url: "/users/terms/accept",
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),

    // Verificar se os termos foram aceitos
    checkTermsAccepted: builder.query<{ termsAccepted: boolean; termsAcceptedAt: string | null }, void>({
      query: () => "/users/terms/check",
      providesTags: ["Users"],
    }),
  }),
});

// Hooks gerados automaticamente pelo RTK Query
export const {
  useGetUsersQuery,
  useGetDashboardStatsQuery,
  useGetUserPlanHistoryQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useAcceptTermsMutation,
  useCheckTermsAcceptedQuery,
} = userAPI;
