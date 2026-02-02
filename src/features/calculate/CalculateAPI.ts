// src/services/calculateAPI.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CompoundParams, CompoundResult, FinancialIndependenceType, SpendingEntry, SpendingPlanType } from '../../types/calculate';

const baseQuery = fetchBaseQuery({
  baseUrl: '',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const calculateAPI = createApi({
  reducerPath: 'calculateAPI',
  baseQuery,
  tagTypes: ['Compound', 'SpendingPlan'],
  endpoints: (builder) => ({
    /** POST – cria/atualiza cálculo */
    calculateCompound: builder.mutation<CompoundResult, CompoundParams>({
      query: (params) => ({
        url: '/calculate/compound-interest',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Compound'],
    }),

    /** GET – obtém cálculo salvo */
    getCompound: builder.query<CompoundResult, string>({
      query: (userId) => `/calculate/compound-interest/${userId}`,
      providesTags: ['Compound'],
    }),

    /** DELETE – remove cálculo salvo */
    deleteCompound: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/calculate/compound-interest/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Compound'],
    }),

     calculateFinancialIndependence: builder.mutation<FinancialIndependenceType, CompoundParams>({
      query: (params) => ({
        url: '/calculate/FinancialIndependence',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Compound'],
    }),

    /** GET – obtém cálculo salvo */
    getFinancialIndependence: builder.query<FinancialIndependenceType, string>({
      query: (userId) => `/calculate/FinancialIndependence/${userId}`,
      providesTags: ['Compound'],
    }),

    /** DELETE – remove cálculo salvo */
    deleteFinancialIndependence: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/calculate/FinancialIndependence/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Compound'],
    }),
    getSpendingPlan: builder.query<SpendingPlanType, string>({
      query: (userId) => `/calculate/spending/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'SpendingPlan', id: userId }],
    }),

    /** POST – salva (cria/atualiza) planejamento de gastos */
    saveSpendingPlan: builder.mutation<void, { userId: string; receitas: SpendingEntry[]; despesas: SpendingEntry[]; receitasReais?: SpendingEntry[]; despesasReais?: SpendingEntry[] }>({
      query: (data) => ({
        url: `/calculate/spending/${data.userId}`,
        method: 'POST',
        body: { 
          receitas: data.receitas, 
          despesas: data.despesas,
          receitasReais: data.receitasReais,
          despesasReais: data.despesasReais,
        },
      }),
      invalidatesTags: (result, error, data) => [{ type: 'SpendingPlan', id: data.userId }],
    }),
  }),
});

export const {
  useCalculateFinancialIndependenceMutation,
  useGetFinancialIndependenceQuery,
  useDeleteFinancialIndependenceMutation, 
  useCalculateCompoundMutation,
  useGetCompoundQuery,
  useDeleteCompoundMutation,
  useGetSpendingPlanQuery,
  useSaveSpendingPlanMutation,   
} = calculateAPI;
