export interface Trade {
  id: string;
  userId: string;
  
  // Informações básicas do trade
  symbol: string; // Par de trading (ex: BTCUSDT)
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  quantity: number; // Quantidade negociada
  price: number; // Preço de execução
  total: number; // Valor total (quantity * price)
  
  // Identificação do tipo de trade
  tradeType: 'manual' | 'automated' | 'bot';
  environment: 'real' | 'simulated' | 'paper';
  
  // Informações do bot (se aplicável)
  botId?: string; // ID do bot que executou o trade
  botName?: string; // Nome do bot
  
  // Resultado do trade
  pnl?: number; // Profit/Loss
  pnlPercent?: number; // Profit/Loss percentual
  status: 'open' | 'closed' | 'cancelled';
  
  // Timestamps
  entryTime: string; // ISO date string
  exitTime?: string; // ISO date string
  
  // Metadados
  stopLoss?: number; // Stop loss definido
  takeProfit?: number; // Take profit definido
  fees?: number; // Taxas pagas
  exitPrice?: number; // Preço de encerramento da posição
  notes?: string; // Observações do usuário
  
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalFees: number;
  averagePnL: number;
  byType: {
    manual: {
      count: number;
      pnl: number;
    };
    automated: {
      count: number;
      pnl: number;
    };
  };
  byEnvironment: {
    real: {
      count: number;
      pnl: number;
    };
    simulated: {
      count: number;
      pnl: number;
    };
  };
}

export interface CreateTradeRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  quantity: number;
  price: number;
  total: number;
  tradeType: 'manual' | 'automated' | 'bot';
  environment: 'real' | 'simulated' | 'paper';
  status?: 'open' | 'closed' | 'cancelled';
  botId?: string;
  botName?: string;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}

export interface UpdateTradeRequest {
  pnl?: number;
  pnlPercent?: number;
  status?: 'open' | 'closed' | 'cancelled';
  exitTime?: string;
  exitPrice?: number;
  fees?: number;
  notes?: string;
} 