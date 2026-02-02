import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Wallet {
  id: string;
  userId: string;
  type: 'virtual' | 'real';
  symbol: string;
  name: string;
  balance: number;
  value: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  type: 'virtual' | 'real';
  symbol: string;
  name: string;
  balance: number;
  value: number;
}

export interface TransferRequest {
  fromSymbol: string;
  toSymbol: string;
  amount: number;
  price: number;
  walletType?: 'virtual' | 'real';
}

export interface WalletSummary {
  virtual: {
    totalValue: number;
    assetsCount: number;
  };
  real: {
    totalValue: number;
    assetsCount: number;
  };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const walletAPI = {
  // Obter todas as carteiras do usuário
  getUserWallets: async (type?: 'virtual' | 'real'): Promise<Wallet[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallets`, {
        headers: getAuthHeaders(),
        params: type ? { type } : {},
      });
      
      if (response.data.success) {
        return type ? response.data.data : response.data.data.virtual.concat(response.data.data.real);
      }
      throw new Error(response.data.message || 'Erro ao buscar carteiras');
    } catch (error: any) {
      console.error('Erro ao buscar carteiras:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar carteiras');
    }
  },

  // Obter carteiras agrupadas por tipo
  getGroupedWallets: async (): Promise<{ virtual: Wallet[]; real: Wallet[] }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallets`, {
        headers: getAuthHeaders(),
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Erro ao buscar carteiras');
    } catch (error: any) {
      console.error('Erro ao buscar carteiras agrupadas:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar carteiras');
    }
  },

  // Obter resumo das carteiras
  getWalletSummary: async (): Promise<WalletSummary> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/wallets/summary`, {
        headers: getAuthHeaders(),
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Erro ao buscar resumo das carteiras');
    } catch (error: any) {
      console.error('Erro ao buscar resumo das carteiras:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar resumo das carteiras');
    }
  },

  // Inicializar carteira virtual com $10,000
  initializeVirtualWallet: async (): Promise<Wallet> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wallets/initialize-virtual`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Erro ao inicializar carteira virtual');
    } catch (error: any) {
      console.error('Erro ao inicializar carteira virtual:', error);
      throw new Error(error.response?.data?.message || 'Erro ao inicializar carteira virtual');
    }
  },

  // Atualizar saldo da carteira
  updateWalletBalance: async (walletData: WalletBalance): Promise<Wallet> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/wallets/balance`,
        walletData,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Erro ao atualizar saldo da carteira');
    } catch (error: any) {
      console.error('Erro ao atualizar saldo da carteira:', error);
      
      // Se o erro for sobre saldo zero, isso é esperado
      if (error.response?.data?.message?.includes('saldo zero')) {
        console.log('Ativo removido automaticamente por ter saldo zero');
        return {} as Wallet; // Retornar objeto vazio para indicar remoção
      }
      
      throw new Error(error.response?.data?.message || 'Erro ao atualizar saldo da carteira');
    }
  },

  // Transferir saldo entre ativos (compra/venda)
  transferBalance: async (transferData: TransferRequest): Promise<void> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wallets/transfer`,
        transferData,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao transferir saldo');
      }
    } catch (error: any) {
      console.error('Erro ao transferir saldo:', error);
      throw new Error(error.response?.data?.message || 'Erro ao transferir saldo');
    }
  },

  // Remover ativo da carteira
  removeWalletAsset: async (type: 'virtual' | 'real', symbol: string): Promise<void> => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/wallets/${type}/${symbol}`,
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao remover ativo da carteira');
      }
    } catch (error: any) {
      console.error('Erro ao remover ativo da carteira:', error);
      throw new Error(error.response?.data?.message || 'Erro ao remover ativo da carteira');
    }
  },

  // Depositar fundos (simulação)
  depositFunds: async (type: 'virtual' | 'real', symbol: string, amount: number): Promise<Wallet> => {
    const walletData: WalletBalance = {
      type,
      symbol,
      name: symbol === 'USD' ? 'US Dollar' : symbol,
      balance: amount,
      value: amount // Assumindo valor 1:1 para simplificar
    };

    try {
      // Primeiro busca o saldo atual
      const existingWallets = await walletAPI.getUserWallets(type);
      const existingWallet = existingWallets.find(w => w.symbol === symbol);
      
      if (existingWallet) {
        walletData.balance = existingWallet.balance + amount;
        walletData.value = existingWallet.value + amount;
      }

      return await walletAPI.updateWalletBalance(walletData);
    } catch (error) {
      console.error('Erro ao depositar fundos:', error);
      throw error;
    }
  },

  // Sacar fundos
  withdrawFunds: async (type: 'virtual' | 'real', symbol: string, amount: number): Promise<Wallet> => {
    try {
      // Primeiro busca o saldo atual
      const existingWallets = await walletAPI.getUserWallets(type);
      const existingWallet = existingWallets.find(w => w.symbol === symbol);
      
      if (!existingWallet || existingWallet.balance < amount) {
        throw new Error('Saldo insuficiente');
      }

      const walletData: WalletBalance = {
        type,
        symbol,
        name: existingWallet.name,
        balance: existingWallet.balance - amount,
        value: existingWallet.value - amount
      };

      return await walletAPI.updateWalletBalance(walletData);
    } catch (error) {
      console.error('Erro ao sacar fundos:', error);
      throw error;
    }
  },

  // Limpar ativos com saldo zero ou muito baixo
  cleanupZeroBalances: async (): Promise<{ cleanedCount: number }> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wallets/cleanup-zero`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Erro ao limpar saldos zero');
    } catch (error: any) {
      console.error('Erro ao limpar saldos zero:', error);
      throw new Error(error.response?.data?.message || 'Erro ao limpar saldos zero');
    }
  }
};

export default walletAPI;