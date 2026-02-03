import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL ?? ''; // vazio = URLs relativas (ex.: Docker com proxy nginx)

export interface ExpenseType {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseTypeRequest {
  name: string;
}

export interface UpdateExpenseTypeRequest {
  name: string;
}

export const expenseTypesAPI = createApi({
  reducerPath: 'expenseTypesAPI',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/expense-types`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ExpenseType'],
  endpoints: (builder) => ({
    // Obter todos os tipos de gastos do usuário
    getExpenseTypes: builder.query<ExpenseType[], void>({
      query: () => ({
        url: '/',
        method: 'GET',
      }),
      providesTags: ['ExpenseType'],
    }),

    // Criar novo tipo de gasto
    createExpenseType: builder.mutation<ExpenseType, CreateExpenseTypeRequest>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ExpenseType'],
    }),

    // Atualizar tipo de gasto existente
    updateExpenseType: builder.mutation<ExpenseType, { id: string } & UpdateExpenseTypeRequest>({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ExpenseType'],
    }),

    // Deletar tipo de gasto
    deleteExpenseType: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ExpenseType'],
    }),
  }),
});

export const {
  useGetExpenseTypesQuery,
  useCreateExpenseTypeMutation,
  useUpdateExpenseTypeMutation,
  useDeleteExpenseTypeMutation,
} = expenseTypesAPI;