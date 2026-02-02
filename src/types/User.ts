export interface User {
  id: string; 
  senha: string;
  password:string;
  createdAt: string;
  foto: string;
  name:string;
  perfil: string;
  email:string;
  updatedAt: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Campos relacionados ao plano
  currentPlan?: string;             // Nome do plano atual
  billingCycle?: string;            // 'mensal' | 'anual'
  planActivatedAt?: string;         // Data de ativação do plano
  planExpiresAt?: string;           // Data de expiração do plano
}

export interface JwtPayload extends User {
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

export enum PerfilTypes {
  ADMIN = "Admin",
  ALUNO = "Aluno",
  PROFESSOR = "Professor",
  OUTROS = "Outros",
}

export interface ChangePasswordRequest {
  email: string;
  password: string;
  newpassword: string;

}

export interface UpdatePasswordAltRequest {
  
  email: string;
  password: string;
  newpw: string;
  newpwrep: string;
}

export interface LoginResponse {
  token: string;
  primeiroAcesso: boolean;
  message: string;
  name?: string;   // se o backend já devolve
  nip?:  string;   // idem
}


