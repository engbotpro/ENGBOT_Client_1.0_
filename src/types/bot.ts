export interface BotConfig {
  id: string;
  name: string;
  environment: 'real' | 'virtual';
  symbol: string;
  timeframe: string; // Tempo gráfico (ex: '1m', '5m', '15m', '1h', '4h', '1d')
  isActive: boolean;
  startDate: string;
  operationMode: 'immediate' | 'scheduled';
  operationTime?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[]; // 0-6 (domingo-sábado)
  };
  strategyId?: string; // ID da estratégia aplicada (ex: 'moving_average_crossover', 'rsi_oversold_overbought')
  strategyName?: string; // Nome da estratégia aplicada (ex: 'Cruzamento de Médias')
  indicators: Array<{
    name: string;
    type: 'primary' | 'confirmation';
    parameters: Record<string, any>; // Parâmetros específicos do indicador
    description?: string;
    entryMethod?: {
      type: 'market' | 'limit' | 'stop';
      condition: string;
      value?: number;
    };
    exitMethod?: {
      type: 'market' | 'limit' | 'stop';
      condition: string;
      value?: number;
    };
  }>;
  indicatorLogic?: {
    primary: 'all' | 'any'; // 'all' = todos os principais devem sinalizar, 'any' = qualquer principal pode sinalizar
    confirmation: 'all' | 'any'; // 'all' = todos os de confirmação devem confirmar, 'any' = qualquer confirmação pode confirmar
  };
  // Métodos globais (mantidos para compatibilidade, mas serão usados apenas se o indicador não tiver métodos próprios)
  entryMethod: {
    type: 'market' | 'limit' | 'stop';
    condition: string;
    value?: number;
  };
  exitMethod: {
    type: 'market' | 'limit' | 'stop';
    condition: string;
    value?: number;
  };
  positionSizing: {
    type: 'fixed' | 'percentage' | 'kelly';
    value: number;
    maxPosition: number;
  };
  partialExits: {
    enabled: boolean;
    levels: Array<{
      percentage: number;
      quantity: number;
    }>;
  };
  stopLoss: {
    enabled: boolean;
    type: 'fixed' | 'trailing' | 'atr';
    value?: number;
  };
  takeProfit: {
    enabled: boolean;
    type: 'trailing' | 'fixed' | 'atr';
    value?: number;
  };
  riskManagement: {
    maxDailyLoss: number;
    maxDrawdown: number;
    maxOpenPositions: number;
  };
  advancedSettings: {
    timeFilter: {
      enabled: boolean;
      startTime?: string;
      endTime?: string;
    };
    newsFilter: {
      enabled: boolean;
      avoidNewsMinutes: number;
    };
    correlationFilter: {
      enabled: boolean;
      maxCorrelation: number;
    };
    entryExecution: {
      mode: 'candle_close' | 'price_condition';
    };
    exitExecution: {
      mode: 'candle_close' | 'price_condition';
    };
  };
}

export interface BotPerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  currentStreak: number;
}

export interface Bot {
  id: string;
  config: BotConfig;
  performance: BotPerformance;
  createdAt: string;
  updatedAt: string;
}

// Tipo para o bot retornado pelo backend
export interface BackendBot {
  id: string;
  userId: string;
  name: string;
  environment: string;
  symbol: string;
  timeframe: string;
  isActive: boolean;
  startDate: string;
  operationMode: string;
  operationTime: string | null;
  primaryIndicator: string;
  secondaryIndicator: string | null;
  confirmationIndicator: string | null;
  indicators?: string | null; // JSON string do array de indicadores
  strategyId?: string | null;
  strategyName?: string | null;
  entryType: string;
  entryCondition: string;
  entryValue: number | null;
  exitType: string;
  exitCondition: string;
  exitValue: number | null;
  positionSizingType: string;
  positionSizingValue: number;
  maxPosition: number;
  partialExitsEnabled: boolean;
  partialExitsLevels: string | null;
  stopLossEnabled: boolean;
  stopLossType: string;
  stopLossValue: number | null;
  takeProfitEnabled: boolean;
  takeProfitType: string;
  takeProfitValue: number | null;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxOpenPositions: number;
  timeFilterEnabled: boolean;
  timeFilterStart: string | null;
  timeFilterEnd: string | null;
  newsFilterEnabled: boolean;
  avoidNewsMinutes: number;
  correlationFilterEnabled: boolean;
  maxCorrelation: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  sharpeRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  currentStreak: number;
  createdAt: string;
  updatedAt: string;
}

export type IndicatorType = 
  | 'SMA' | 'EMA' | 'WMA' | 'HMA' | 'HILO'
  | 'RSI' | 'MACD' | 'Stochastic' 
  | 'BollingerBands' | 'IchimokuCloud' | 'WilliamsR' | 'CCI' | 'ADX'
  | 'ATR' | 'ParabolicSAR' | 'OBV' | 'Volume';

// Condições específicas para cada tipo de indicador
export interface IndicatorConditions {
  entryConditions: string[];
  exitConditions: string[];
  description: string;
}

export const INDICATOR_CONDITIONS: Record<string, IndicatorConditions> = {
  // Médias Móveis
  'SMA': {
    entryConditions: ['crossover', 'crossunder', 'above', 'below', 'breakout', 'breakdown'],
    exitConditions: ['crossover', 'crossunder', 'above', 'below', 'time', 'profit', 'loss'],
    description: 'Média Móvel Simples - Suaviza preços para identificar tendências'
  },
  'EMA': {
    entryConditions: ['crossover', 'crossunder', 'above', 'below', 'breakout', 'breakdown'],
    exitConditions: ['crossover', 'crossunder', 'above', 'below', 'time', 'profit', 'loss'],
    description: 'Média Móvel Exponencial - Mais responsiva que SMA para mudanças de preço'
  },
  'WMA': {
    entryConditions: ['crossover', 'crossunder', 'above', 'below', 'breakout', 'breakdown'],
    exitConditions: ['crossover', 'crossunder', 'above', 'below', 'time', 'profit', 'loss'],
    description: 'Média Móvel Ponderada - Dá mais peso aos preços recentes'
  },
  'HMA': {
    entryConditions: ['crossover', 'crossunder', 'above', 'below', 'breakout', 'breakdown'],
    exitConditions: ['crossover', 'crossunder', 'above', 'below', 'time', 'profit', 'loss'],
    description: 'Média Móvel de Hull - Reduz lag e melhora responsividade'
  },
  'HILO': {
    entryConditions: ['crossover', 'crossunder', 'above', 'below', 'breakout', 'breakdown'],
    exitConditions: ['crossover', 'crossunder', 'above', 'below', 'time', 'profit', 'loss'],
    description: 'High-Low - Identifica níveis de suporte e resistência dinâmicos'
  },

  // Osciladores
  'RSI': {
    entryConditions: ['oversold', 'overbought', 'crossover', 'crossunder', 'divergence'],
    exitConditions: ['overbought', 'oversold', 'crossover', 'crossunder', 'time', 'profit', 'loss'],
    description: 'Índice de Força Relativa - Identifica condições de sobrecompra/sobrevenda'
  },
  'MACD': {
    entryConditions: ['crossover', 'crossunder', 'divergence', 'histogram_change'],
    exitConditions: ['crossover', 'crossunder', 'time', 'profit', 'loss'],
    description: 'Convergência/Divergência de Médias Móveis - Sinais de momentum'
  },
  'Stochastic': {
    entryConditions: ['oversold', 'overbought', 'crossover', 'crossunder', 'divergence'],
    exitConditions: ['overbought', 'oversold', 'crossover', 'crossunder', 'time', 'profit', 'loss'],
    description: 'Oscilador Estocástico - Identifica reversões de preço'
  },
  'WilliamsR': {
    entryConditions: ['oversold', 'overbought', 'crossover', 'crossunder', 'divergence'],
    exitConditions: ['overbought', 'oversold', 'crossover', 'crossunder', 'time', 'profit', 'loss'],
    description: 'Williams %R - Oscilador de momentum similar ao Stochastic'
  },
  'CCI': {
    entryConditions: ['oversold', 'overbought', 'crossover', 'crossunder', 'divergence'],
    exitConditions: ['overbought', 'oversold', 'crossover', 'crossunder', 'time', 'profit', 'loss'],
    description: 'Índice do Canal de Commodities - Identifica ciclos e reversões'
  },

  // Indicadores de Tendência
  'ADX': {
    entryConditions: ['above_threshold', 'below_threshold', 'rising', 'falling'],
    exitConditions: ['below_threshold', 'above_threshold', 'time', 'profit', 'loss'],
    description: 'Índice Direcional Médio - Mede força da tendência'
  },
  'ATR': {
    entryConditions: ['high_volatility', 'low_volatility', 'breakout', 'breakdown'],
    exitConditions: ['low_volatility', 'high_volatility', 'time', 'profit', 'loss'],
    description: 'Faixa Média Verdadeira - Mede volatilidade do mercado'
  },
  'ParabolicSAR': {
    entryConditions: ['crossover', 'crossunder', 'trend_change'],
    exitConditions: ['crossover', 'crossunder', 'time', 'profit', 'loss'],
    description: 'Stop and Reverse Parabólico - Identifica reversões de tendência'
  },

  // Indicadores de Volume
  'OBV': {
    entryConditions: ['crossover', 'crossunder', 'divergence', 'breakout'],
    exitConditions: ['crossover', 'crossunder', 'time', 'profit', 'loss'],
    description: 'On-Balance Volume - Confirma movimentos de preço com volume'
  },
  'Volume': {
    entryConditions: ['high_volume', 'low_volume', 'volume_spike', 'divergence'],
    exitConditions: ['low_volume', 'high_volume', 'time', 'profit', 'loss'],
    description: 'Volume - Confirma força dos movimentos de preço'
  },

  // Indicadores de Volatilidade
  'BollingerBands': {
    entryConditions: ['upper_touch', 'lower_touch', 'squeeze', 'breakout', 'breakdown'],
    exitConditions: ['middle_cross', 'opposite_band', 'time', 'profit', 'loss'],
    description: 'Bandas de Bollinger - Identifica volatilidade e níveis de preço'
  },
  'IchimokuCloud': {
    entryConditions: ['cloud_breakout', 'cloud_breakdown', 'line_crossover', 'price_cloud_position'],
    exitConditions: ['cloud_breakdown', 'cloud_breakout', 'line_crossover', 'time', 'profit', 'loss'],
    description: 'Nuvem de Ichimoku - Sistema completo de análise técnica'
  }
};

export type EntryCondition = 
  | 'crossover' | 'crossunder' | 'above' | 'below'
  | 'divergence' | 'convergence' | 'breakout' | 'breakdown'
  | 'squeeze' | 'expansion' | 'trend_strength' | 'trend_change'
  | 'spike' | 'decline';

export type ExitCondition = 
  | 'crossover' | 'crossunder' | 'above' | 'below'
  | 'time' | 'profit' | 'loss' | 'trailing'; 