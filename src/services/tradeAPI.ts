import { Trade, TradeStats, CreateTradeRequest, UpdateTradeRequest } from '../types/trade';

const API_BASE_URL = '/api/trades';

// Função para obter o token de autenticação
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  console.log('🔍 Token no localStorage:', token ? 'Presente' : 'Ausente');
  console.log('🔍 Token completo:', token);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  
  console.log('🔍 Headers sendo enviados:', headers);
  return headers;
};

// Buscar histórico de trades do usuário
export const fetchUserTrades = async (): Promise<Trade[]> => {
  try {
    console.log('🔍 Fazendo requisição para:', API_BASE_URL);
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('🔍 Status da resposta:', response.status);
    console.log('🔍 Status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 Erro da resposta:', errorText);
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 Dados recebidos:', data);
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar trades:', error);
    throw error;
  }
};

// Buscar estatísticas de trades do usuário
export const fetchTradeStats = async (): Promise<TradeStats> => {
  try {
    console.log('🔍 Fazendo requisição para estatísticas:', `${API_BASE_URL}/stats`);
    const response = await fetch(`${API_BASE_URL}/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('🔍 Status da resposta (stats):', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 Erro da resposta (stats):', errorText);
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 Dados de estatísticas recebidos:', data);
    return data.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de trades:', error);
    throw error;
  }
};

// Criar novo trade
export const createTrade = async (tradeData: CreateTradeRequest): Promise<Trade> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tradeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Erro ao criar trade:', error);
    throw error;
  }
};

// Atualizar trade
export const updateTrade = async (tradeId: string, updateData: UpdateTradeRequest): Promise<Trade> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${tradeId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Erro ao atualizar trade:', error);
    throw error;
  }
};

// Função utilitária para formatar data
export const formatTradeDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Função utilitária para formatar valor monetário
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// Função utilitária para obter cor baseada no PnL
export const getPnLColor = (pnl: number): string => {
  if (pnl > 0) return 'success';
  if (pnl < 0) return 'error';
  return 'default';
};

// Função utilitária para obter label do tipo de trade
export const getTradeTypeLabel = (tradeType: string): string => {
  switch (tradeType) {
    case 'manual':
      return 'Manual';
    case 'automated':
      return 'Automático';
    case 'bot':
      return 'Bot';
    default:
      return tradeType;
  }
};

// Função utilitária para obter label do ambiente
export const getEnvironmentLabel = (environment: string): string => {
  switch (environment) {
    case 'real':
      return 'Real';
    case 'simulated':
      return 'Simulado';
    case 'paper':
      return 'Paper Trading';
    default:
      return environment;
  }
};

// Função utilitária para obter cor do ambiente
export const getEnvironmentColor = (environment: string): string => {
  switch (environment) {
    case 'real':
      return 'error';
    case 'simulated':
      return 'warning';
    case 'paper':
      return 'info';
    default:
      return 'default';
  }
}; 