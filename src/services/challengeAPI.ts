import { Challenge, CreateChallengeRequest, ChallengeResponse, UserStats } from '../types/challenge';

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;

// Função para fazer requisições autenticadas
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  console.log('📡 authenticatedFetch - Iniciando:', { url, method: options.method || 'GET' });
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    console.log('📡 authenticatedFetch - Resposta recebida:', { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      console.error('❌ authenticatedFetch - Erro na resposta:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('📡 authenticatedFetch - Dados parseados:', data);
    return data;
  } catch (error) {
    console.error('❌ authenticatedFetch - Erro na requisição:', error);
    throw error;
  }
};

const challengeAPI = {
  // Buscar estatísticas do usuário atual
  getUserStats: async (userId: string): Promise<UserStats> => {
    try {
      const stats = await authenticatedFetch(`/challenges/stats/${userId}`);
      
      // Formatar dados para o frontend
      return {
        id: stats.user.id,
        name: stats.user.name,
        email: stats.user.email,
        tokens: stats.tokens,
        totalWins: stats.totalWins,
        totalLosses: stats.totalLosses,
        winRate: stats.winRate,
        totalProfit: stats.totalProfit,
        avatar: stats.user.foto || '/src/assets/images/avatar.jpg'
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      throw error;
    }
  },

  // Listar todos os usuários disponíveis para desafio
  getAvailableUsers: async (currentUserId?: string, search?: string): Promise<UserStats[]> => {
    try {
      const params = new URLSearchParams();
      if (currentUserId) params.append('currentUserId', currentUserId);
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      const url = `/challenges/available-users${queryString ? `?${queryString}` : ''}`;
      const users = await authenticatedFetch(url);
      
      // Os dados já vêm formatados do backend
      return users;
    } catch (error) {
      console.error('Erro ao buscar usuários disponíveis:', error);
      throw error;
    }
  },

  // Listar desafios do usuário
  getUserChallenges: async (userId: string): Promise<Challenge[]> => {
    try {
      const challenges = await authenticatedFetch(`/challenges/user/${userId}`);
      return challenges;
    } catch (error) {
      console.error('Erro ao buscar desafios do usuário:', error);
      return [];
    }
  },

  // Listar todos os desafios ativos
  getActiveChallenges: async (): Promise<Challenge[]> => {
    try {
      const challenges = await authenticatedFetch('/challenges/active');
      return challenges;
    } catch (error) {
      console.error('Erro ao buscar desafios ativos:', error);
      return [];
    }
  },

  // Criar novo desafio
  createChallenge: async (challengeData: CreateChallengeRequest): Promise<Challenge> => {
    try {
      const challenge = await authenticatedFetch('/challenges/create', {
        method: 'POST',
        body: JSON.stringify({
          title: challengeData.title,
          description: challengeData.description,
          challengerId: challengeData.challengerId,
          challengedId: challengeData.challengedUserId,
          type: challengeData.type,
          duration: challengeData.duration || 1, // Fallback para 1 dia se não calculado
          betAmount: challengeData.betAmount,
          initialBalance: 1000, // Valor padrão
          startTime: challengeData.startTime || '09:00',
          endTime: challengeData.endTime || '18:00',
          startDate: challengeData.startDate ? new Date(challengeData.startDate).toISOString() : new Date().toISOString(),
          endDate: challengeData.endDate ? new Date(challengeData.endDate).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          challengerBotId: challengeData.challengerBotId,
          challengedBotId: challengeData.challengedBotId
        })
      });
      return challenge;
    } catch (error) {
      console.error('Erro ao criar desafio:', error);
      throw error;
    }
  },

  // Aceitar ou rejeitar desafio
  respondToChallenge: async (challengeId: string, response: ChallengeResponse): Promise<Challenge> => {
    try {
      console.log('📡 challengeAPI.respondToChallenge - Iniciando requisição:', { challengeId, response });
      const challenge = await authenticatedFetch(`/challenges/${challengeId}/respond`, {
        method: 'POST',
        body: JSON.stringify(response)
      });
      console.log('📡 challengeAPI.respondToChallenge - Resposta recebida:', challenge);
      return challenge;
    } catch (error) {
      console.error('❌ challengeAPI.respondToChallenge - Erro:', error);
      throw error;
    }
  },

  // Finalizar desafio
  finalizeChallenge: async (challengeId: string): Promise<Challenge> => {
    try {
      const challenge = await authenticatedFetch(`/challenges/${challengeId}/finalize`, {
        method: 'POST'
      });
      return challenge;
    } catch (error) {
      console.error('Erro ao finalizar desafio:', error);
      throw error;
    }
  },

  // Adicionar trade manual ao desafio
  addManualTrade: async (challengeId: string, userId: string, trade: any): Promise<Challenge> => {
    try {
      const challenge = await authenticatedFetch(`/challenges/${challengeId}/trade`, {
        method: 'POST',
        body: JSON.stringify({ userId, trade })
      });
      return challenge;
    } catch (error) {
      console.error('Erro ao adicionar trade:', error);
      throw error;
    }
  },

  // Cancelar desafio
  cancelChallenge: async (challengeId: string, userId: string): Promise<Challenge> => {
    try {
      const challenge = await authenticatedFetch(`/challenges/${challengeId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      return challenge;
    } catch (error) {
      console.error('Erro ao cancelar desafio:', error);
      throw error;
    }
  },

  // Buscar trades de um desafio
  getChallengeTrades: async (challengeId: string): Promise<any[]> => {
    try {
      const trades = await authenticatedFetch(`/challenges/${challengeId}/trades`);
      return trades;
    } catch (error) {
      console.error('Erro ao buscar trades do desafio:', error);
      throw error;
    }
  },

  // Buscar desafio por ID
  getChallengeById: async (challengeId: string): Promise<Challenge> => {
    try {
      const challenge = await authenticatedFetch(`/challenges/${challengeId}`);
      return challenge;
    } catch (error) {
      console.error('Erro ao buscar desafio:', error);
      throw error;
    }
  },

  // Verificar e atualizar desafios expirados
  checkExpiredChallenges: async (): Promise<any> => {
    try {
      const result = await authenticatedFetch('/challenges/check-expired', {
        method: 'POST'
      });
      return result;
    } catch (error) {
      console.error('Erro ao verificar desafios expirados:', error);
      throw error;
    }
  },

  // Verificar tokens de um usuário
  getUserTokens: async (userId: string): Promise<any> => {
    try {
      const result = await authenticatedFetch(`/challenges/tokens/${userId}`);
      return result;
    } catch (error) {
      console.error('Erro ao buscar tokens do usuário:', error);
      throw error;
    }
  },

  // Buscar histórico de transações de tokens
  getTokenHistory: async (): Promise<any> => {
    try {
      const result = await authenticatedFetch('/challenges/token-history');
      return result;
    } catch (error) {
      console.error('Erro ao buscar histórico de tokens:', error);
      throw error;
    }
  }
};

// Exportar de ambas as formas para garantir compatibilidade
export { challengeAPI };
export default challengeAPI; 