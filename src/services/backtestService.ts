import { Candle, fetchHistoricalKlines } from './binanceAPI';
import { Bot } from '../types/bot';
import * as indicatorCalculations from '../features/Graph/indicators/calculations';

interface Trade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  side: 'buy' | 'sell';
  quantity: number;
  profit: number;
  profitPercent: number;
}

interface BacktestResult {
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
  trades: Trade[];
  equityCurve: number[];
}

// Mapear intervalos do bot para intervalos da Binance
const mapTimeframeToBinanceInterval = (timeframe: string): string => {
  const mapping: { [key: string]: string } = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };
  return mapping[timeframe] || '1h';
};

// Calcular indicadores baseados na configuração do bot
const calculateIndicators = (candles: Candle[], bot: Bot) => {
  const indicators: any = {};
  
  console.log('🔧 Calculando indicadores para:', {
    indicatorsCount: bot.config.indicators?.length || 0,
    primaryIndicator: bot.config.primaryIndicator,
    indicators: bot.config.indicators?.map(ind => ({ name: ind.name, type: ind.type }))
  });
  
  if (bot.config.indicators && bot.config.indicators.length > 0) {
    bot.config.indicators.forEach(indicator => {
      try {
        const indicatorName = indicator.name.toLowerCase();
        console.log(`📊 Calculando indicador: ${indicator.name} (${indicator.type})`);
        
        switch (indicatorName) {
          case 'sma':
          case 'ema':
            const maType = indicatorName === 'sma' ? 'simple' : 'exponential';
            const maPeriod = indicator.parameters?.period || 20;
            const maResult = indicatorCalculations.calculateMovingAverage(
              candles,
              { period: maPeriod, type: maType }
            );
            indicators[indicator.type] = maResult;
            console.log(`✅ ${indicator.name} calculado: ${maResult.filter(v => !isNaN(v)).length} valores válidos`);
            break;
          
          case 'rsi':
            const rsiPeriod = indicator.parameters?.period || 14;
            const rsiResult = indicatorCalculations.calculateRSI(
              candles,
              { period: rsiPeriod }
            );
            indicators[indicator.type] = rsiResult;
            console.log(`✅ RSI calculado: ${rsiResult.filter(v => !isNaN(v)).length} valores válidos`);
            break;
          
          case 'macd':
            const macdResult = indicatorCalculations.calculateMACD(
              candles,
              {
                fastPeriod: indicator.parameters?.fastPeriod || 12,
                slowPeriod: indicator.parameters?.slowPeriod || 26,
                signalPeriod: indicator.parameters?.signalPeriod || 9
              }
            );
            indicators[indicator.type] = macdResult.macd;
            if (!indicators.confirmation) {
              indicators.confirmation = {};
            }
            indicators.confirmation.signal = macdResult.signal;
            indicators.confirmation.histogram = macdResult.histogram;
            console.log(`✅ MACD calculado: ${macdResult.macd.filter(v => !isNaN(v)).length} valores válidos`);
            break;
          
          case 'bollinger':
          case 'bb':
          case 'bollinger bands':
            const bbResult = indicatorCalculations.calculateBollingerBands(
              candles,
              {
                period: indicator.parameters?.period || 20,
                standardDeviation: indicator.parameters?.standardDeviation || 2
              }
            );
            indicators[indicator.type] = bbResult.middle;
            if (!indicators.confirmation) {
              indicators.confirmation = {};
            }
            indicators.confirmation.upper = bbResult.upper;
            indicators.confirmation.lower = bbResult.lower;
            console.log(`✅ Bollinger Bands calculado`);
            break;
          
          default:
            console.warn(`⚠️ Indicador não reconhecido: ${indicator.name}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao calcular indicador ${indicator.name}:`, error);
      }
    });
  } else {
    console.warn('⚠️ Nenhum indicador configurado no bot');
  }
  
  // Se não há indicador primário calculado, tentar usar primaryIndicator do bot
  if (!indicators.primary && bot.config.primaryIndicator) {
    console.log('⚠️ Tentando calcular indicador primário do campo primaryIndicator:', bot.config.primaryIndicator);
    // Tentar calcular baseado no nome do indicador primário
    const primaryName = bot.config.primaryIndicator.toLowerCase();
    if (primaryName.includes('rsi')) {
      indicators.primary = indicatorCalculations.calculateRSI(candles, { period: 14 });
    } else if (primaryName.includes('sma')) {
      indicators.primary = indicatorCalculations.calculateMovingAverage(candles, { period: 20, type: 'simple' });
    } else if (primaryName.includes('ema')) {
      indicators.primary = indicatorCalculations.calculateMovingAverage(candles, { period: 20, type: 'exponential' });
    }
  }
  
  return indicators;
};

// Verificar condição de entrada
const checkEntryCondition = (
  candle: Candle,
  index: number,
  candles: Candle[],
  indicators: any,
  bot: Bot
): boolean => {
  if (!bot.config.entryMethod || index < 1) return false;
  
  const condition = (bot.config.entryMethod.condition || '').toLowerCase();
  const primaryIndicator = indicators.primary;
  const secondaryIndicator = indicators.secondary;
  const confirmationIndicator = indicators.confirmation;
  
  // Verificar condições básicas
  let entrySignal = false;
  
  // Se não há indicador primário calculado, retornar false
  if (!primaryIndicator || !Array.isArray(primaryIndicator) || primaryIndicator.length <= index) {
    return false;
  }
  
  const currentValue = primaryIndicator[index];
  const previousValue = primaryIndicator[index - 1];
  
  // Verificar se os valores são válidos
  if (isNaN(currentValue) || isNaN(previousValue)) {
    return false;
  }
  
  // Detectar tipo de indicador pelo nome
  const primaryIndicatorName = bot.config.primaryIndicator?.toLowerCase() || '';
  const indicatorName = bot.config.indicators?.find(ind => ind.type === 'primary')?.name?.toLowerCase() || '';
  
  // RSI específico
  if (primaryIndicatorName.includes('rsi') || indicatorName.includes('rsi')) {
    if (condition.includes('sobrevenda') || condition.includes('oversold') || condition === '') {
      // Entrada quando RSI sai de sobrevenda (cruzou acima de 30)
      const prevRsi = primaryIndicator[index - 1];
      entrySignal = prevRsi < 30 && currentValue >= 30;
    } else if (condition.includes('sobrecompra') || condition.includes('overbought')) {
      // Entrada quando RSI sai de sobrecompra (cruzou abaixo de 70)
      const prevRsi = primaryIndicator[index - 1];
      entrySignal = prevRsi > 70 && currentValue <= 70;
    } else if (condition.includes('cruzou') || condition.includes('cross') || condition.includes('crossover')) {
      // Cruzamento de médias móveis com RSI
      if (secondaryIndicator && Array.isArray(secondaryIndicator) && secondaryIndicator.length > index) {
        const secCurrent = secondaryIndicator[index];
        const secPrevious = secondaryIndicator[index - 1];
        if (!isNaN(secCurrent) && !isNaN(secPrevious)) {
          entrySignal = previousValue < secPrevious && currentValue > secCurrent;
        }
      }
    }
  }
  // MACD específico
  else if (primaryIndicatorName.includes('macd') || indicatorName.includes('macd')) {
    if (confirmationIndicator?.signal && Array.isArray(confirmationIndicator.signal)) {
      const macd = currentValue;
      const signal = confirmationIndicator.signal[index];
      const prevMacd = previousValue;
      const prevSignal = confirmationIndicator.signal[index - 1];
      
      if (!isNaN(macd) && !isNaN(signal) && !isNaN(prevMacd) && !isNaN(prevSignal)) {
        // Entrada quando MACD cruza acima da linha de sinal
        if (condition.includes('cruzou') || condition.includes('cross') || condition.includes('crossover') || condition === '') {
          entrySignal = prevMacd < prevSignal && macd > signal;
        }
      }
    }
  }
  // Médias móveis (SMA/EMA)
  else if (primaryIndicatorName.includes('sma') || primaryIndicatorName.includes('ema') || 
           indicatorName.includes('sma') || indicatorName.includes('ema')) {
    if (condition.includes('cruzou acima') || condition.includes('cross above') || 
        condition.includes('cruzou') || condition.includes('cross') || 
        condition.includes('crossover') || condition === '') {
      // Cruzamento de preço acima da média
      entrySignal = previousValue > candles[index - 1].close && currentValue <= candle.close;
    } else if (condition.includes('cruzou abaixo') || condition.includes('cross below')) {
      // Cruzamento de preço abaixo da média
      entrySignal = previousValue < candles[index - 1].close && currentValue >= candle.close;
    } else if (condition.includes('acima') || condition.includes('above')) {
      entrySignal = candle.close > currentValue;
    } else if (condition.includes('abaixo') || condition.includes('below')) {
      entrySignal = candle.close < currentValue;
    }
    
    // Se há indicador secundário, verificar cruzamento entre médias
    if (!entrySignal && secondaryIndicator && Array.isArray(secondaryIndicator) && secondaryIndicator.length > index) {
      const secCurrent = secondaryIndicator[index];
      const secPrevious = secondaryIndicator[index - 1];
      if (!isNaN(secCurrent) && !isNaN(secPrevious)) {
        if (condition.includes('cruzou') || condition.includes('cross') || condition.includes('crossover') || condition === '') {
          entrySignal = previousValue < secPrevious && currentValue > secCurrent;
        }
      }
    }
  }
  // Bollinger Bands
  else if (primaryIndicatorName.includes('bollinger') || indicatorName.includes('bollinger')) {
    if (confirmationIndicator && confirmationIndicator.lower && confirmationIndicator.upper) {
      const lower = confirmationIndicator.lower[index];
      const upper = confirmationIndicator.upper[index];
      if (!isNaN(lower) && !isNaN(upper)) {
        if (condition.includes('tocou') || condition.includes('touch') || condition === '') {
          // Entrada quando preço toca a banda inferior
          entrySignal = candle.low <= lower;
        } else if (condition.includes('acima') || condition.includes('above')) {
          entrySignal = candle.close > currentValue; // Média
        }
      }
    }
  }
  // Condição genérica - se não encontrou tipo específico, usar lógica básica
  else {
    if (condition.includes('cruzou acima') || condition.includes('cross above') || 
        condition.includes('cruzou') || condition.includes('cross') || 
        condition.includes('crossover') || condition === '') {
      entrySignal = previousValue < candles[index - 1].close && currentValue >= candle.close;
    } else if (condition.includes('acima') || condition.includes('above')) {
      entrySignal = candle.close > currentValue;
    } else if (condition.includes('abaixo') || condition.includes('below')) {
      entrySignal = candle.close < currentValue;
    }
  }
  
  return entrySignal;
};

// Verificar condição de saída
const checkExitCondition = (
  candle: Candle,
  index: number,
  candles: Candle[],
  indicators: any,
  bot: Bot,
  entryPrice: number,
  entryIndex: number
): boolean => {
  if (!bot.config.exitMethod) return false;
  
  const condition = bot.config.exitMethod.condition.toLowerCase();
  const primaryIndicator = indicators.primary;
  
  let exitSignal = false;
  
  // Stop Loss
  if (bot.config.stopLoss?.enabled && bot.config.stopLoss.value) {
    const stopLossPrice = entryPrice * (1 - bot.config.stopLoss.value / 100);
    if (candle.low <= stopLossPrice) {
      return true;
    }
  }
  
  // Take Profit
  if (bot.config.takeProfit?.enabled && bot.config.takeProfit.value) {
    const takeProfitPrice = entryPrice * (1 + bot.config.takeProfit.value / 100);
    if (candle.high >= takeProfitPrice) {
      return true;
    }
  }
  
  // Condições baseadas no indicador
  if (primaryIndicator && Array.isArray(primaryIndicator)) {
    const currentValue = primaryIndicator[index];
    const previousValue = primaryIndicator[index - 1];
    
    if (!isNaN(currentValue) && !isNaN(previousValue)) {
      if (condition.includes('cruzou acima') || condition.includes('cross above')) {
        exitSignal = previousValue < candle.close && currentValue >= candle.close;
      } else if (condition.includes('cruzou abaixo') || condition.includes('cross below')) {
        exitSignal = previousValue > candle.close && currentValue <= candle.close;
      }
    }
  }
  
  return exitSignal;
};

// Executar backtest
export const runBacktest = async (
  bot: Bot,
  startDate: Date,
  endDate: Date,
  initialCapital: number,
  commission: number = 0.1,
  slippage: number = 0.05
): Promise<BacktestResult> => {
  try {
    console.log('🚀 Iniciando backtest...', {
      bot: bot.config.name,
      symbol: bot.config.symbol,
      startDate,
      endDate
    });
    
    // Buscar dados históricos
    const interval = mapTimeframeToBinanceInterval(bot.config.timeframe || '1h');
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    console.log('📊 Buscando dados históricos...');
    const candles = await fetchHistoricalKlines(
      bot.config.symbol,
      interval,
      startTime,
      endTime
    );
    
    if (candles.length === 0) {
      throw new Error('Nenhum dado histórico encontrado para o período especificado');
    }
    
    console.log(`✅ ${candles.length} candles carregados`);
    
    // Calcular indicadores
    console.log('📈 Calculando indicadores...');
    const indicators = calculateIndicators(candles, bot);
    
    // Simular trades
    const trades: Trade[] = [];
    let balance = initialCapital;
    let position: { entryPrice: number; entryIndex: number; quantity: number } | null = null;
    const equityCurve: number[] = [initialCapital];
    let maxBalance = initialCapital;
    let maxDrawdown = 0;
    
    console.log('💹 Simulando trades...');
    console.log('📊 Indicadores calculados:', {
      primary: indicators.primary ? indicators.primary.length : 0,
      secondary: indicators.secondary ? indicators.secondary.length : 0,
      confirmation: indicators.confirmation ? Object.keys(indicators.confirmation).length : 0
    });
    console.log('🔍 Configuração do bot:', {
      entryCondition: bot.config.entryMethod?.condition,
      primaryIndicator: bot.config.primaryIndicator,
      indicators: bot.config.indicators?.map(ind => ({ name: ind.name, type: ind.type }))
    });
    
    let entrySignalsDetected = 0;
    let entrySignalsExecuted = 0;
    
    for (let i = 1; i < candles.length; i++) {
      const candle = candles[i];
      const prevCandle = candles[i - 1];
      
      // Se não há posição aberta, verificar entrada
      if (!position) {
        const shouldEnter = checkEntryCondition(candle, i, candles, indicators, bot);
        
        if (shouldEnter) {
          entrySignalsDetected++;
          // Calcular quantidade baseada no position sizing
          let quantity = 0;
          if (bot.config.positionSizing) {
            if (bot.config.positionSizing.type === 'fixed') {
              quantity = bot.config.positionSizing.value / candle.close;
            } else if (bot.config.positionSizing.type === 'percentage') {
              const amount = balance * (bot.config.positionSizing.value / 100);
              quantity = amount / candle.close;
            } else {
              quantity = (balance * 0.1) / candle.close; // Default 10%
            }
            
            // Limitar ao máximo
            if (bot.config.positionSizing.maxPosition) {
              quantity = Math.min(quantity, bot.config.positionSizing.maxPosition / candle.close);
            }
          } else {
            quantity = (balance * 0.1) / candle.close; // Default 10%
          }
          
          const entryPrice = candle.close * (1 + slippage / 100);
          const entryValue = quantity * entryPrice;
          // Comissão na entrada: aplicada sobre o valor da entrada
          const entryCommission = entryValue * (commission / 100);
          const totalEntryCost = entryValue + entryCommission;
          
          if (totalEntryCost <= balance) {
            position = {
              entryPrice,
              entryIndex: i,
              quantity
            };
            // Deduzir o custo total (valor + comissão) do balance
            balance -= totalEntryCost;
            entrySignalsExecuted++;
            if (entrySignalsExecuted <= 5) {
              console.log(`✅ Entrada detectada no candle ${i}, preço: ${entryPrice.toFixed(2)}`);
            }
          } else {
            if (entrySignalsDetected <= 10) {
              console.log(`⚠️ Sinal de entrada detectado mas sem capital suficiente (${balance.toFixed(2)} < ${cost.toFixed(2)})`);
            }
          }
        }
      } else {
        // Verificar saída e determinar o preço real de saída
        let exitReason: 'tp' | 'sl' | 'signal' | 'end' = 'signal';
        let actualExitPrice: number | null = null;
        
        // Verificar Stop Loss primeiro
        if (bot.config.stopLoss?.enabled && bot.config.stopLoss.value) {
          const stopLossPrice = position.entryPrice * (1 - bot.config.stopLoss.value / 100);
          if (candle.low <= stopLossPrice) {
            exitReason = 'sl';
            // Se o candle tocou o SL, usar o preço do SL (com slippage)
            actualExitPrice = stopLossPrice * (1 - slippage / 100);
          }
        }
        
        // Verificar Take Profit
        if (!actualExitPrice && bot.config.takeProfit?.enabled && bot.config.takeProfit.value) {
          const takeProfitPrice = position.entryPrice * (1 + bot.config.takeProfit.value / 100);
          if (candle.high >= takeProfitPrice) {
            exitReason = 'tp';
            // Se o candle tocou o TP, usar o preço do TP (com slippage)
            actualExitPrice = takeProfitPrice * (1 - slippage / 100);
          }
        }
        
        // Verificar condição de saída por sinal
        const shouldExit = !actualExitPrice && checkExitCondition(
          candle,
          i,
          candles,
          indicators,
          bot,
          position.entryPrice,
          position.entryIndex
        );
        
        if (shouldExit || actualExitPrice || i === candles.length - 1) {
          // Fechar posição
          // Se não há preço específico (TP/SL), usar o preço de fechamento do candle
          const exitPrice = actualExitPrice || candle.close * (1 - slippage / 100);
          const exitValue = position.quantity * exitPrice;
          // Comissão na saída: aplicada sobre o valor da saída
          const exitCommission = exitValue * (commission / 100);
          const netExitValue = exitValue - exitCommission;
          
          // Calcular valores para o trade
          const entryValue = position.quantity * position.entryPrice;
          const totalCommission = exitCommission; // Comissão de entrada já foi deduzida do balance
          
          // Calcular lucro: receita líquida de saída - valor de entrada
          // A comissão de entrada já foi deduzida do balance quando a posição foi aberta
          // A comissão de saída é deduzida da receita de saída
          const profit = netExitValue - entryValue;
          const profitPercent = entryValue > 0 ? (profit / entryValue) * 100 : 0;
          
          // Adicionar receita líquida ao balance (já descontando comissão de saída)
          balance += netExitValue;
          
          // Log para debug (apenas primeiros trades)
          if (trades.length < 3) {
            console.log(`💰 Trade ${trades.length + 1}:`, {
              entryPrice: position.entryPrice.toFixed(2),
              exitPrice: exitPrice.toFixed(2),
              quantity: position.quantity.toFixed(4),
              entryValue: entryValue.toFixed(2),
              exitValue: exitValue.toFixed(2),
              entryCommission: (entryValue * (commission / 100)).toFixed(4),
              exitCommission: exitCommission.toFixed(4),
              totalCommission: (entryValue * (commission / 100) + exitCommission).toFixed(4),
              netExitValue: netExitValue.toFixed(2),
              profit: profit.toFixed(4),
              profitPercent: profitPercent.toFixed(2) + '%',
              slippage: slippage.toFixed(2) + '%',
              commissionRate: commission.toFixed(2) + '%'
            });
          }
          
          trades.push({
            entryTime: candles[position.entryIndex].time,
            exitTime: candle.time,
            entryPrice: position.entryPrice,
            exitPrice,
            side: 'buy',
            quantity: position.quantity,
            profit,
            profitPercent
          });
          
          position = null;
        }
      }
      
      // Atualizar equity curve e drawdown
      const currentEquity = position 
        ? balance + (position.quantity * candle.close)
        : balance;
      
      equityCurve.push(currentEquity);
      
      if (currentEquity > maxBalance) {
        maxBalance = currentEquity;
      }
      
      const drawdown = ((currentEquity - maxBalance) / maxBalance) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    console.log(`📈 Sinais de entrada detectados: ${entrySignalsDetected}, executados: ${entrySignalsExecuted}`);
    console.log(`💼 Trades executados: ${trades.length}`);
    
    // Calcular métricas
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit <= 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    
    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    const largestWin = winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.profit))
      : 0;
    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.profit))
      : 0;
    
    // Calcular sequências
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentStreak = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    
    for (const trade of trades) {
      if (trade.profit > 0) {
        consecutiveWins++;
        consecutiveLosses = 0;
        if (consecutiveWins > maxConsecutiveWins) {
          maxConsecutiveWins = consecutiveWins;
        }
      } else {
        consecutiveLosses++;
        consecutiveWins = 0;
        if (consecutiveLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = consecutiveLosses;
        }
      }
    }
    
    currentStreak = trades.length > 0 
      ? (trades[trades.length - 1].profit > 0 ? consecutiveWins : -consecutiveLosses)
      : 0;
    
    // Calcular Sharpe Ratio (simplificado)
    const returns = equityCurve.slice(1).map((equity, i) => 
      (equity - equityCurve[i]) / equityCurve[i]
    );
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Anualizado
    
    // Profit Factor
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const result: BacktestResult = {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalProfit,
      totalLoss,
      netProfit: balance - initialCapital,
      maxDrawdown,
      sharpeRatio,
      profitFactor: profitFactor === Infinity ? 999 : profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      currentStreak,
      trades,
      equityCurve
    };
    
    console.log('✅ Backtest concluído:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao executar backtest:', error);
    throw error;
  }
};

