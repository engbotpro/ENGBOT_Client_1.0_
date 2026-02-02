import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../types';

import authReducer, { AuthState } from '../features/auth/authSlice';
import { authAPI } from '../features/auth/authAPI';
import { userAPI } from '../features/users/userAPI';
import { calculateAPI } from '../features/calculate/CalculateAPI';
import { platformSettingsAPI } from '../services/platformSettingsAPI';
import { bitcoinTransactionAPI } from '../services/bitcoinTransactionAPI';
import { expenseTypesAPI } from '../services/expenseTypesAPI';
import notificationSlice from '../features/notificationSlice';

// Estado inicial padrão para autenticação
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  needsPasswordChange: false,
  email: null,
  name: null,
};

// Carrega dados de autenticação do localStorage, sem causar redirects
function loadAuthDataFromLocalStorage(): AuthState {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return initialAuthState;
    }
    const { exp, ...decodedUser } = jwtDecode<JwtPayload>(token);
    if (exp) {
      const expirationDate = new Date(exp * 1000);
      if (expirationDate < new Date()) {
        // token expirado: remove e retorna estado não autenticado
        localStorage.removeItem('authToken');
        return initialAuthState;
      }
    }
    return {
      ...initialAuthState,
      user: decodedUser,
      isAuthenticated: true,
    };
  } catch (e) {
    console.error('Failed to load auth data from localStorage', e);
    return initialAuthState;
  }
}

const preloadedState = {
  auth: loadAuthDataFromLocalStorage(),
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationSlice,

    // RTK Query API slices
    [authAPI.reducerPath]: authAPI.reducer,
    [userAPI.reducerPath]: userAPI.reducer,
    [calculateAPI.reducerPath]: calculateAPI.reducer,
    [platformSettingsAPI.reducerPath]: platformSettingsAPI.reducer,
    [bitcoinTransactionAPI.reducerPath]: bitcoinTransactionAPI.reducer,
    [expenseTypesAPI.reducerPath]: expenseTypesAPI.reducer,
  },
  preloadedState,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authAPI.middleware)
      .concat(userAPI.middleware)
      .concat(calculateAPI.middleware)
      .concat(platformSettingsAPI.middleware)
      .concat(bitcoinTransactionAPI.middleware)
      .concat(expenseTypesAPI.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
// Hook customizado para usar o dispatch tipado
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
