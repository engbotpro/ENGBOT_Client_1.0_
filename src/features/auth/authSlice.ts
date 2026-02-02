import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../../types';
import { RootState } from '../../store';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  needsPasswordChange: boolean;
  email: string | null; // Armazena o nip
  name: string | null; 
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  needsPasswordChange: false,
  email: null, // Inicialmente null
  name: null
  
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string | boolean, email?: string, name?: string }>) => {
      if (typeof action.payload.token === 'boolean') {
        // Se o token for booleano true, definir needsPasswordChange como true
        state.needsPasswordChange = action.payload.token;
        // Armazena o nip se fornecido
        
        state.email = action.payload.email ?? null;
        state.name = action.payload.name ?? null;       
        state.user = null; // Opcional, dependendo de como você quer lidar com isso
      } else {
        try {
          // Decodifica o token JWT
          console.log('🔍 Decodificando token:', action.payload.token);
          const { exp, iat, ...decodedUser } = jwtDecode<JwtPayload>(action.payload.token);
          console.log('👤 Usuário decodificado:', decodedUser);
          state.user = { ...decodedUser };
          state.isAuthenticated = true;
          state.needsPasswordChange = false; // Garantir que não precisa mudar a senha
          state.email = null; // Limpa o nip, já que o login foi bem-sucedido
          localStorage.setItem('authToken', action.payload.token);
          console.log('💾 Token salvo no localStorage');
        } catch (err) {
          console.error('❌ Erro ao decodificar token:', err);
          throw new Error("Token inválido");
        }
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.needsPasswordChange = false;
      state.email = null; // Limpa o nip ao fazer logout
      localStorage.removeItem('authToken');
    },
  },
});

export const { login, logout } = authSlice.actions;
export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
