export interface UserStats {
  id: string;
  name: string;
  email: string;
  tokens: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalProfit: number;
  avatar?: string;
}

export enum ChallengeType {
  MANUAL_TRADING = 'manual_trading',
  BOT_DUEL = 'bot_duel'
}

export enum ChallengeStatus {
  PENDING = 'pending',
  WAITING_START = 'waiting_start',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challenger: UserStats;
  challenged: UserStats;
  type: ChallengeType;
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date;
  startTime: string; // horário de início (HH:mm)
  endTime: string; // horário de término (HH:mm)
  duration: number; // em dias
  betAmount: number; // tokens apostados por cada jogador
  initialBalance: number; // valor inicial para cada participante
  winner?: UserStats;
  loser?: UserStats;
  createdAt: Date;
  updatedAt: Date;
  
  // Para desafios de robôs
  challengerBotId?: string;
  challengedBotId?: string;
  
  // Para desafios manuais
  challengerTrades?: ManualTrade[];
  challengedTrades?: ManualTrade[];
  
  // Resultados
  challengerProfit?: number;
  challengedProfit?: number;
  challengerReturn?: number; // percentual
  challengedReturn?: number; // percentual
  
  // Resultados parciais (durante o desafio)
  challengerCurrentBalance?: number;
  challengedCurrentBalance?: number;
  challengerCurrentReturn?: number; // percentual atual
  challengedCurrentReturn?: number; // percentual atual
}

export interface ManualTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: Date;
  profit?: number;
}

export interface CreateChallengeRequest {
  title: string;
  description: string;
  challengedUserId: string;
  challengerId?: string; // ID do usuário que está criando o desafio
  type: ChallengeType;
  duration?: number; // Calculado automaticamente baseado nas datas
  betAmount: number;
  startDate?: string; // Data de início no formato YYYY-MM-DD
  endDate?: string; // Data de término no formato YYYY-MM-DD
  startTime?: string; // Horário de início no formato HH:mm
  endTime?: string; // Horário de término no formato HH:mm
  challengerBotId?: string;
  challengedBotId?: string;
}

export interface ChallengeResponse {
  accept: boolean;
  message?: string;
} 