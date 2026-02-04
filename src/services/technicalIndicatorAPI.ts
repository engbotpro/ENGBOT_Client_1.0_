import { IndicatorConfig } from '../features/Graph/indicators';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

// Função para obter o token de autenticação
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  console.log('Token obtido:', token ? 'Sim' : 'Não');
  console.log('Token completo:', token);
  return token;
};

// Função para aguardar o token estar disponível
const waitForToken = async (maxAttempts = 10): Promise<string | null> => {
  for (let i = 0; i < maxAttempts; i++) {
    const token = getAuthToken();
    if (token) {
      console.log('Token encontrado na tentativa:', i + 1);
      return token;
    }
    console.log('Aguardando token, tentativa:', i + 1);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('Token não encontrado após', maxAttempts, 'tentativas');
  return null;
};

// Função para fazer requisições autenticadas
const authenticatedRequest = async (url: string, options: RequestInit = {}) => {
  // Aguardar o token estar disponível
  const token = await waitForToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  console.log('Fazendo requisição para:', `${API_BASE_URL}${url}`);
  console.log('Headers:', config.headers);

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na requisição:', response.status, errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Servidor não está disponível. Verifique se o backend está rodando.');
    }
    throw error;
  }
};

// Buscar indicadores do usuário
export const getUserIndicators = async (): Promise<any[]> => {
  return authenticatedRequest('/indicators');
};

// Criar novo indicador
export const createIndicator = async (type: string, config: any): Promise<any> => {
  return authenticatedRequest('/indicators', {
    method: 'POST',
    body: JSON.stringify({ type, config }),
  });
};

// Atualizar indicador
export const updateIndicator = async (id: string, config: any): Promise<any> => {
  return authenticatedRequest(`/indicators/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ config }),
  });
};

// Deletar indicador
export const deleteIndicator = async (id: string): Promise<any> => {
  return authenticatedRequest(`/indicators/${id}`, {
    method: 'DELETE',
  });
};

// Atualizar ordem dos indicadores
export const updateIndicatorsOrder = async (indicators: any[]): Promise<any> => {
  return authenticatedRequest('/indicators/order/update', {
    method: 'PUT',
    body: JSON.stringify({ indicators }),
  });
};

// Converter indicadores do banco para o formato do frontend
export const convertDbIndicatorsToFrontend = (dbIndicators: any[]): IndicatorConfig[] => {
  return dbIndicators.map(dbIndicator => {
    const config = dbIndicator.config as any;
    
    switch (dbIndicator.type) {
      case 'moving_average':
        return {
          type: 'moving_average',
          movingAverage: config,
        } as IndicatorConfig;
      
      case 'bollinger_bands':
        return {
          type: 'bollinger_bands',
          bollingerBands: config,
        } as IndicatorConfig;
      
      case 'macd':
        return {
          type: 'macd',
          macd: config,
        } as IndicatorConfig;
      
      case 'ichimoku_cloud':
        return {
          type: 'ichimoku_cloud',
          ichimokuCloud: config,
        } as IndicatorConfig;
      
      case 'stochastic_oscillator':
        return {
          type: 'stochastic_oscillator',
          stochasticOscillator: config,
        } as IndicatorConfig;
      
      case 'rsi':
        return {
          type: 'rsi',
          rsi: config,
        } as IndicatorConfig;
      
      case 'hilo':
        return {
          type: 'hilo',
          hilo: config,
        } as IndicatorConfig;
      
      case 'williamsr':
        return {
          type: 'williamsr',
          williamsr: config,
        } as IndicatorConfig;
      
      case 'cci':
        return {
          type: 'cci',
          cci: config,
        } as IndicatorConfig;
      
      case 'adx':
        return {
          type: 'adx',
          adx: config,
        } as IndicatorConfig;
      
      case 'atr':
        return {
          type: 'atr',
          atr: config,
        } as IndicatorConfig;
      
      case 'parabolic_sar':
        return {
          type: 'parabolic_sar',
          parabolicSAR: config,
        } as IndicatorConfig;
      
      case 'obv':
        return {
          type: 'obv',
          obv: config,
        } as IndicatorConfig;
      
      case 'volume':
        return {
          type: 'volume',
          volume: config,
        } as IndicatorConfig;
      
      case 'wma':
        return {
          type: 'wma',
          wma: config,
        } as IndicatorConfig;
      
      case 'hma':
        return {
          type: 'hma',
          hma: config,
        } as IndicatorConfig;
      
      case 'fibonacci':
        return {
          type: 'fibonacci',
          fibonacci: config,
        } as IndicatorConfig;
      
      case 'elliott':
        return {
          type: 'elliott',
          elliott: config,
        } as IndicatorConfig;
      
      default:
        return {
          type: 'moving_average',
          movingAverage: config,
        } as IndicatorConfig;
    }
  });
};

// Converter indicadores do frontend para o formato do banco
export const convertFrontendIndicatorsToDb = (indicators: IndicatorConfig[]): any[] => {
  return indicators.map((indicator, index) => {
    let config: any;
    
    switch (indicator.type) {
      case 'moving_average':
        config = indicator.movingAverage;
        break;
      case 'bollinger_bands':
        config = indicator.bollingerBands;
        break;
      case 'macd':
        config = indicator.macd;
        break;
      case 'ichimoku_cloud':
        config = indicator.ichimokuCloud;
        break;
      case 'stochastic_oscillator':
        config = indicator.stochasticOscillator;
        break;
      case 'rsi':
        config = indicator.rsi;
        break;
      case 'hilo':
        config = indicator.hilo;
        break;
      case 'williamsr':
        config = indicator.williamsr;
        break;
      case 'cci':
        config = indicator.cci;
        break;
      case 'adx':
        config = indicator.adx;
        break;
      case 'atr':
        config = indicator.atr;
        break;
      case 'parabolic_sar':
        config = indicator.parabolicSAR;
        break;
      case 'obv':
        config = indicator.obv;
        break;
      case 'volume':
        config = indicator.volume;
        break;
      case 'wma':
        config = indicator.wma;
        break;
      case 'hma':
        config = indicator.hma;
        break;
      case 'fibonacci':
        config = indicator.fibonacci;
        break;
      case 'elliott':
        config = indicator.elliott;
        break;
      default:
        config = indicator.movingAverage || indicator.wma || indicator.hma || indicator.fibonacci || indicator.elliott;
    }
    
    return {
      type: indicator.type,
      config,
      order: index,
    };
  });
}; 