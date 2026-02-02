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

export interface BitcoinTransaction {
  id: string;
  userId: string;
  superCreditsAmount: number;
  amountBTC: number;
  txHash: string | null;
  walletAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const bitcoinTransactionAPI = createApi({
  reducerPath: "bitcoinTransactionAPI",
  baseQuery,
  tagTypes: ["BitcoinTransaction"],
  endpoints: (builder) => ({
    createBitcoinTransaction: builder.mutation<{ message: string; transaction: BitcoinTransaction }, { superCreditsAmount: number; txHash?: string }>({
      query: (data) => ({
        url: "/api/bitcoin-transactions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["BitcoinTransaction"],
    }),

    getMyBitcoinTransactions: builder.query<BitcoinTransaction[], void>({
      query: () => "/api/bitcoin-transactions/my-transactions",
      providesTags: ["BitcoinTransaction"],
    }),

    getAllBitcoinTransactions: builder.query<BitcoinTransaction[], void>({
      query: () => "/api/bitcoin-transactions/all",
      providesTags: ["BitcoinTransaction"],
    }),

    approveBitcoinTransaction: builder.mutation<{ message: string; transaction: BitcoinTransaction }, string>({
      query: (id) => ({
        url: `/api/bitcoin-transactions/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["BitcoinTransaction"],
    }),

    rejectBitcoinTransaction: builder.mutation<{ message: string; transaction: BitcoinTransaction }, { id: string; rejectionReason?: string }>({
      query: ({ id, rejectionReason }) => ({
        url: `/api/bitcoin-transactions/${id}/reject`,
        method: "POST",
        body: { rejectionReason },
      }),
      invalidatesTags: ["BitcoinTransaction"],
    }),
  }),
});

export const {
  useCreateBitcoinTransactionMutation,
  useGetMyBitcoinTransactionsQuery,
  useGetAllBitcoinTransactionsQuery,
  useApproveBitcoinTransactionMutation,
  useRejectBitcoinTransactionMutation,
} = bitcoinTransactionAPI;
