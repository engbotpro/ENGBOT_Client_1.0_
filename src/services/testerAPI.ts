import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface TesterRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const testerAPI = {
  // Criar solicitação de testador
  createTesterRequest: async (description: string): Promise<TesterRequest> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tester-requests`,
        { description },
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao criar solicitação de testador:', error);
      throw new Error(error.response?.data?.error || 'Erro ao criar solicitação de testador');
    }
  },

  // Obter solicitações do próprio usuário
  getMyTesterRequests: async (): Promise<TesterRequest[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tester-requests/my-requests`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar solicitações do usuário:', error);
      throw new Error(error.response?.data?.error || 'Erro ao buscar solicitações');
    }
  },

  // Obter todas as solicitações (apenas admin)
  getAllTesterRequests: async (): Promise<TesterRequest[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tester-requests/all`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar todas as solicitações:', error);
      throw new Error(error.response?.data?.error || 'Erro ao buscar solicitações');
    }
  },

  // Aprovar solicitação (apenas admin)
  approveTesterRequest: async (id: string): Promise<TesterRequest> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tester-requests/${id}/approve`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao aprovar solicitação:', error);
      throw new Error(error.response?.data?.error || 'Erro ao aprovar solicitação');
    }
  },

  // Rejeitar solicitação (apenas admin)
  rejectTesterRequest: async (id: string): Promise<TesterRequest> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tester-requests/${id}/reject`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Erro ao rejeitar solicitação:', error);
      throw new Error(error.response?.data?.error || 'Erro ao rejeitar solicitação');
    }
  },
};

export default testerAPI;
