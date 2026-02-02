import { Bot, BackendBot } from '../types/bot';
import type { BotConfig, BotPerformance } from '../types/bot';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class BotAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}/api/bots${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Buscar todos os robôs
  async getBots(): Promise<BackendBot[]> {
    return this.request<BackendBot[]>('');
  }

  // Buscar robô por ID
  async getBotById(id: string): Promise<BackendBot | null> {
    return this.request<BackendBot>(`/${id}`);
  }

  // Buscar robô por ID sem restrição de usuário (para desafios - apenas nome)
  async getBotByIdPublic(id: string): Promise<{ id: string; name: string; symbol: string } | null> {
    try {
      return await this.request<{ id: string; name: string; symbol: string }>(`/public/${id}`);
    } catch (error) {
      console.error('Erro ao buscar robô público:', error);
      return null;
    }
  }

  // Criar novo robô
  async createBot(config: BotConfig): Promise<BackendBot> {
    // Encontrar os indicadores no array
    const primaryIndicator = config.indicators.find(ind => ind.type === 'primary')?.name || '';
    const secondaryIndicator = config.indicators.find(ind => ind.type === 'secondary')?.name;
    const confirmationIndicator = config.indicators.find(ind => ind.type === 'confirmation')?.name;

    // Converter a estrutura do frontend para o formato do backend
    const backendConfig = {
      name: config.name,
      environment: config.environment,
      symbol: config.symbol,
      timeframe: config.timeframe,
      startDate: config.startDate,
      operationMode: config.operationMode,
      operationTime: config.operationTime,
      primaryIndicator,
      secondaryIndicator,
      confirmationIndicator,
      indicators: JSON.stringify(config.indicators), // Array completo de indicadores
      strategyId: config.strategyId,
      strategyName: config.strategyName,
      entryType: config.entryMethod.type,
      entryCondition: config.entryMethod.condition,
      entryValue: config.entryMethod.value,
      exitType: config.exitMethod.type,
      exitCondition: config.exitMethod.condition,
      exitValue: config.exitMethod.value,
      positionSizingType: config.positionSizing.type,
      positionSizingValue: config.positionSizing.value,
      maxPosition: config.positionSizing.maxPosition,
      partialExitsEnabled: config.partialExits.enabled,
      partialExitsLevels: config.partialExits.levels,
      stopLossEnabled: config.stopLoss.enabled,
      stopLossType: config.stopLoss.type,
      stopLossValue: config.stopLoss.value,
      takeProfitEnabled: config.takeProfit.enabled,
      takeProfitType: config.takeProfit.type,
      takeProfitValue: config.takeProfit.value,
      maxDailyLoss: config.riskManagement.maxDailyLoss,
      maxDrawdown: config.riskManagement.maxDrawdown,
      maxOpenPositions: config.riskManagement.maxOpenPositions,
      timeFilterEnabled: config.advancedSettings.timeFilter.enabled,
      timeFilterStart: config.advancedSettings.timeFilter.startTime,
      timeFilterEnd: config.advancedSettings.timeFilter.endTime,
      newsFilterEnabled: config.advancedSettings.newsFilter.enabled,
      avoidNewsMinutes: config.advancedSettings.newsFilter.avoidNewsMinutes,
      correlationFilterEnabled: config.advancedSettings.correlationFilter.enabled,
      maxCorrelation: config.advancedSettings.correlationFilter.maxCorrelation,
      entryExecutionMode: config.advancedSettings.entryExecution.mode,
      exitExecutionMode: config.advancedSettings.exitExecution.mode
    };

    return this.request<BackendBot>('', {
      method: 'POST',
      body: JSON.stringify(backendConfig)
    });
  }

  // Atualizar robô
  async updateBot(id: string, config: BotConfig): Promise<BackendBot | null> {
    // Encontrar os indicadores no array
    const primaryIndicator = config.indicators.find(ind => ind.type === 'primary')?.name || '';
    const secondaryIndicator = config.indicators.find(ind => ind.type === 'secondary')?.name;
    const confirmationIndicator = config.indicators.find(ind => ind.type === 'confirmation')?.name;

    // Converter a estrutura do frontend para o formato do backend
    const backendConfig = {
      name: config.name,
      environment: config.environment,
      symbol: config.symbol,
      timeframe: config.timeframe,
      startDate: config.startDate,
      operationMode: config.operationMode,
      operationTime: config.operationTime,
      primaryIndicator,
      secondaryIndicator,
      confirmationIndicator,
      indicators: JSON.stringify(config.indicators), // Array completo de indicadores
      strategyId: config.strategyId,
      strategyName: config.strategyName,
      entryType: config.entryMethod.type,
      entryCondition: config.entryMethod.condition,
      entryValue: config.entryMethod.value,
      exitType: config.exitMethod.type,
      exitCondition: config.exitMethod.condition,
      exitValue: config.exitMethod.value,
      positionSizingType: config.positionSizing.type,
      positionSizingValue: config.positionSizing.value,
      maxPosition: config.positionSizing.maxPosition,
      partialExitsEnabled: config.partialExits.enabled,
      partialExitsLevels: config.partialExits.levels,
      stopLossEnabled: config.stopLoss.enabled,
      stopLossType: config.stopLoss.type,
      stopLossValue: config.stopLoss.value,
      takeProfitEnabled: config.takeProfit.enabled,
      takeProfitType: config.takeProfit.type,
      takeProfitValue: config.takeProfit.value,
      maxDailyLoss: config.riskManagement.maxDailyLoss,
      maxDrawdown: config.riskManagement.maxDrawdown,
      maxOpenPositions: config.riskManagement.maxOpenPositions,
      timeFilterEnabled: config.advancedSettings.timeFilter.enabled,
      timeFilterStart: config.advancedSettings.timeFilter.startTime,
      timeFilterEnd: config.advancedSettings.timeFilter.endTime,
      newsFilterEnabled: config.advancedSettings.newsFilter.enabled,
      avoidNewsMinutes: config.advancedSettings.newsFilter.avoidNewsMinutes,
      correlationFilterEnabled: config.advancedSettings.correlationFilter.enabled,
      maxCorrelation: config.advancedSettings.correlationFilter.maxCorrelation,
      entryExecutionMode: config.advancedSettings.entryExecution.mode,
      exitExecutionMode: config.advancedSettings.exitExecution.mode
    };

    return this.request<BackendBot>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendConfig)
    });
  }

  // Deletar robô
  async deleteBot(id: string): Promise<boolean> {
    await this.request(`/${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  // Ativar/desativar robô
  async toggleBotActive(id: string, isActive: boolean): Promise<BackendBot | null> {
    return this.request<BackendBot>(`/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  }

  // Atualizar performance do bot
  async updateBotPerformance(id: string, performance: Partial<BotPerformance>): Promise<BackendBot | null> {
    return this.request<BackendBot>(`/${id}/performance`, {
      method: 'PATCH',
      body: JSON.stringify(performance)
    });
  }

  // Buscar robôs por status
  async getBotsByStatus(isActive: boolean): Promise<BackendBot[]> {
    return this.request<BackendBot[]>(`/status?isActive=${isActive}`);
  }

  // Buscar robôs por ambiente
  async getBotsByEnvironment(environment: 'real' | 'virtual'): Promise<BackendBot[]> {
    return this.request<BackendBot[]>(`/environment/${environment}`);
  }

  // Buscar robôs por símbolo
  async getBotsBySymbol(symbol: string): Promise<BackendBot[]> {
    return this.request<BackendBot[]>(`/symbol/${symbol}`);
  }

  // Buscar robôs por userId (para desafios)
  async getBotsByUserId(userId: string): Promise<BackendBot[]> {
    return this.request<BackendBot[]>(`/user/${userId}`);
  }

  // Buscar trades (abertos e fechados) de um bot
  async getBotOpenTrades(botId: string): Promise<{ success: boolean; data: { open: any[]; closed: any[] }; total: number; openCount: number; closedCount: number }> {
    return this.request<{ success: boolean; data: { open: any[]; closed: any[] }; total: number; openCount: number; closedCount: number }>(`/${botId}/trades/open`);
  }

  // Buscar todos os trades (abertos e fechados) de um bot (alias para getBotOpenTrades)
  async getBotAllTrades(botId: string): Promise<{ success: boolean; data: { open: any[]; closed: any[] }; total: number; openCount: number; closedCount: number }> {
    return this.getBotOpenTrades(botId);
  }

  // Fechar todas as posições abertas de um bot
  async closeAllBotTrades(botId: string): Promise<{ success: boolean; message: string; closedCount: number; totalPnL: number }> {
    return this.request<{ success: boolean; message: string; closedCount: number; totalPnL: number }>(`/${botId}/trades/close-all`, {
      method: 'POST'
    });
  }
}

export default new BotAPI(); 