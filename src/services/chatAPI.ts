const API_BASE_URL = 'http://localhost:5000/api';

// Função para fazer requisições autenticadas
const authenticatedFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
};

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  sender: 'user' | 'support';
  read: boolean;
  createdAt: string;
}

class ChatAPI {
  private baseUrl = '/chat';

  async getMessages(): Promise<ChatMessage[]> {
    return authenticatedFetch<ChatMessage[]>(`${this.baseUrl}/messages`, {
      method: 'GET',
    });
  }

  async sendMessage(text: string, sender: 'user' | 'support' = 'user'): Promise<ChatMessage> {
    return authenticatedFetch<ChatMessage>(`${this.baseUrl}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, sender }),
    });
  }

  async markMessagesAsRead(): Promise<void> {
    return authenticatedFetch<void>(`${this.baseUrl}/messages/read`, {
      method: 'PUT',
    });
  }
}

export default new ChatAPI();

