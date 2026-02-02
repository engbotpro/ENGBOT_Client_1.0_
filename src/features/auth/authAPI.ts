import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ChangePasswordRequest, LoginResponse, UpdatePasswordAltRequest, User } from "../../types";

// Fetch base query with Authorization header
const baseQuery = fetchBaseQuery({
  baseUrl: "", // Use relative URLs since we have proxy configured
  prepareHeaders: (headers) => {
    // Get the token from localStorage
    const token = localStorage.getItem("authToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const authAPI = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Events", "Units", "Users", "Plans", "Oil"],
  endpoints: (builder) => ({
    
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),  
   
    
  
    updatePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      query: (data) => ({
        url: '/auth/changepassword',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    updatePasswordAlt: builder.mutation<{ message: string }, UpdatePasswordAltRequest>({
      query: (data) => ({
        url: `/auth/changepasswordAlt`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    
    resetPassword: builder.mutation<{ message: string }, { id: string; password: string }>({
      query: ({ id, password }) => ({
        url: `/auth/resetPassword/${id}`,
        method: "PUT",
        body: { password },
      }),
      invalidatesTags: ["Users"],
    }),

    register: builder.mutation<
      { message: string },           // resposta: { message: "E-mail enviado" }
      { perfil: string; name: string; email: string; password: string; active: boolean }
    >({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),
    confirmEmail: builder.mutation<
      { message: string },           // resposta: { message: "E-mail confirmado" }
      { token: string }
    >({
      query: ({ token }) => ({
        url: "/auth/confirm",
        method: "POST",
        body: { token },
      }),
    }),

   
   
     
    
  }),
});

export const {
  useLoginMutation,
  useUpdatePasswordMutation,  
  useResetPasswordMutation,
  useUpdatePasswordAltMutation, 
  useRegisterMutation,
  useConfirmEmailMutation  
  
} = authAPI;
