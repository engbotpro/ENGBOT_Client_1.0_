import { Candle } from '../../../services/binanceAPI';
import {
  MovingAverageConfig,
  BollingerBandsConfig,
  MACDConfig,
  IchimokuCloudConfig,
  StochasticOscillatorConfig,
  RSIConfig,
  HILOConfig,
  WilliamsRConfig,
  CCIConfig,
  ADXConfig,
  ATRConfig,
  ParabolicSARConfig,
  OBVConfig,
  VolumeConfig,
  WMAConfig,
  HMAConfig
} from './index';

// Média Móvel
export const calculateMovingAverage = (data: Candle[], config: MovingAverageConfig) => {
  const { period, type } = config;
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }

    const prices = data.slice(i - period + 1, i + 1).map(d => d.close);
    
    if (type === 'simple') {
      const sum = prices.reduce((acc, price) => acc + price, 0);
      result.push(sum / period);
    } else {
      // Média Móvel Exponencial
      const alpha = 2 / (period + 1);
      let ema = prices[0];
      for (let j = 1; j < prices.length; j++) {
        ema = alpha * prices[j] + (1 - alpha) * ema;
      }
      result.push(ema);
    }
  }

  return result;
};

// Bandas de Bollinger
export const calculateBollingerBands = (data: Candle[], config: BollingerBandsConfig) => {
  const { period, standardDeviation } = config;
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      middle.push(NaN);
      lower.push(NaN);
      continue;
    }

    const prices = data.slice(i - period + 1, i + 1).map(d => d.close);
    const sma = prices.reduce((acc, price) => acc + price, 0) / period;
    
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    middle.push(sma);
    upper.push(sma + (standardDeviation * stdDev));
    lower.push(sma - (standardDeviation * stdDev));
  }

  return { upper, middle, lower };
};

// MACD
export const calculateMACD = (data: Candle[], config: MACDConfig) => {
  const { fastPeriod, slowPeriod, signalPeriod } = config;
  const macd: number[] = [];
  const signal: number[] = [];
  const histogram: number[] = [];

  // Calcular EMAs
  const fastEMA = calculateEMA(data.map(d => d.close), fastPeriod);
  const slowEMA = calculateEMA(data.map(d => d.close), slowPeriod);

  // Calcular MACD
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macd.push(NaN);
      signal.push(NaN);
      histogram.push(NaN);
      continue;
    }
    macd.push(fastEMA[i] - slowEMA[i]);
  }

  // Calcular linha de sinal (EMA do MACD)
  const validMacdValues = macd.filter(val => !isNaN(val));
  if (validMacdValues.length === 0) {
    return { macd, signal: new Array(data.length).fill(NaN), histogram: new Array(data.length).fill(NaN) };
  }

  const signalEMA = calculateEMA(validMacdValues, signalPeriod);
  let signalIndex = 0;

  for (let i = 0; i < data.length; i++) {
    if (isNaN(macd[i])) {
      signal.push(NaN);
      histogram.push(NaN);
    } else {
      const signalValue = signalEMA[signalIndex] || NaN;
      signal.push(signalValue);
      histogram.push(isNaN(signalValue) ? NaN : macd[i] - signalValue);
      signalIndex++;
    }
  }

  return { macd, signal, histogram };
};

// Nuvem de Ichimoku
export const calculateIchimokuCloud = (data: Candle[], config: IchimokuCloudConfig) => {
  const { tenkanPeriod, kijunPeriod, senkouSpanBPeriod, displacement } = config;
  
  const tenkan: number[] = [];
  const kijun: number[] = [];
  const senkouSpanA: number[] = [];
  const senkouSpanB: number[] = [];
  const chikou: number[] = [];

  // Calcular Tenkan-sen (média do high/low)
  for (let i = 0; i < data.length; i++) {
    if (i < tenkanPeriod - 1) {
      tenkan.push(NaN);
    } else {
      const slice = data.slice(i - tenkanPeriod + 1, i + 1);
      const highs = slice.map(d => d.high);
      const lows = slice.map(d => d.low);
      const highest = Math.max(...highs);
      const lowest = Math.min(...lows);
      tenkan.push((highest + lowest) / 2);
    }
  }

  // Calcular Kijun-sen
  for (let i = 0; i < data.length; i++) {
    if (i < kijunPeriod - 1) {
      kijun.push(NaN);
    } else {
      const slice = data.slice(i - kijunPeriod + 1, i + 1);
      const highs = slice.map(d => d.high);
      const lows = slice.map(d => d.low);
      const highest = Math.max(...highs);
      const lowest = Math.min(...lows);
      kijun.push((highest + lowest) / 2);
    }
  }

  // Calcular Senkou Span A
  for (let i = 0; i < data.length; i++) {
    if (isNaN(tenkan[i]) || isNaN(kijun[i])) {
      senkouSpanA.push(NaN);
    } else {
      senkouSpanA.push((tenkan[i] + kijun[i]) / 2);
    }
  }

  // Calcular Senkou Span B
  for (let i = 0; i < data.length; i++) {
    if (i < senkouSpanBPeriod - 1) {
      senkouSpanB.push(NaN);
    } else {
      const slice = data.slice(i - senkouSpanBPeriod + 1, i + 1);
      const highs = slice.map(d => d.high);
      const lows = slice.map(d => d.low);
      const highest = Math.max(...highs);
      const lowest = Math.min(...lows);
      senkouSpanB.push((highest + lowest) / 2);
    }
  }

  // Calcular Chikou Span (preço deslocado)
  for (let i = 0; i < data.length; i++) {
    const displacedIndex = i + displacement;
    if (displacedIndex >= data.length) {
      chikou.push(NaN);
    } else {
      chikou.push(data[displacedIndex].close);
    }
  }

  return { tenkan, kijun, senkouSpanA, senkouSpanB, chikou };
};

// Oscilador Estocástico
export const calculateStochasticOscillator = (data: Candle[], config: StochasticOscillatorConfig) => {
  const { kPeriod, dPeriod, slowing } = config;
  const k: number[] = [];
  const d: number[] = [];

  // Calcular %K
  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      k.push(NaN);
      continue;
    }

    const slice = data.slice(i - kPeriod + 1, i + 1);
    const highs = slice.map(d => d.high);
    const lows = slice.map(d => d.low);
    const closes = slice.map(d => d.close);
    
    const highest = Math.max(...highs);
    const lowest = Math.min(...lows);
    const currentClose = closes[closes.length - 1];
    
    if (highest === lowest) {
      k.push(50); // Valor neutro quando não há variação
    } else {
      k.push(((currentClose - lowest) / (highest - lowest)) * 100);
    }
  }

  // Calcular %D (média móvel de %K)
  for (let i = 0; i < k.length; i++) {
    if (i < dPeriod - 1) {
      d.push(NaN);
      continue;
    }

    const slice = k.slice(i - dPeriod + 1, i + 1);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    d.push(sum / dPeriod);
  }

  return { k, d };
};

// RSI
export const calculateRSI = (data: Candle[], config: RSIConfig) => {
  const { period } = config;
  const rsi: number[] = [];

  if (data.length < period + 1) {
    return new Array(data.length).fill(NaN);
  }

  // Calcular mudanças de preço
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }

  // Calcular ganhos e perdas
  const gains: number[] = changes.map(change => change > 0 ? change : 0);
  const losses: number[] = changes.map(change => change < 0 ? Math.abs(change) : 0);

  // Calcular EMAs dos ganhos e perdas
  const avgGains = calculateEMA(gains, period);
  const avgLosses = calculateEMA(losses, period);

  // Calcular RSI
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(NaN);
      continue;
    }

    const avgGain = avgGains[i - 1]; // -1 porque changes tem um elemento a menos
    const avgLoss = avgLosses[i - 1];

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push(rsiValue);
    }
  }

  return rsi;
};

// Função auxiliar para calcular EMA
const calculateEMA = (data: number[], period: number): number[] => {
  const ema: number[] = [];
  const alpha = 2 / (period + 1);

  if (data.length === 0) {
    return [];
  }

  // Primeiro valor é a média simples dos primeiros 'period' valores
  let sum = 0;
  const initialPeriod = Math.min(period, data.length);
  for (let i = 0; i < initialPeriod; i++) {
    sum += data[i];
  }
  ema.push(sum / initialPeriod);

  // Calcular EMA para os valores restantes
  for (let i = 1; i < data.length; i++) {
    const newEMA = alpha * data[i] + (1 - alpha) * ema[i - 1];
    ema.push(newEMA);
  }

  return ema;
}; 

// HILO (High-Low)
export const calculateHILO = (data: Candle[], config: HILOConfig) => {
  const { period } = config; // Não usar multiplier, HiLo Activator usa apenas médias móveis
  const hilo: number[] = [];
  const trend: ('bull' | 'bear')[] = [];
  const highMA: number[] = [];
  const lowMA: number[] = [];

  // Inicializar arrays
  for (let i = 0; i < data.length; i++) {
    highMA.push(NaN);
    lowMA.push(NaN);
    hilo.push(NaN);
    trend.push('bear');
  }

  // Calcular médias móveis dos highs e lows
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highs = slice.map(d => d.high);
    const lows = slice.map(d => d.low);
    
    // Calcular média móvel simples dos highs e lows
    const avgHigh = highs.reduce((acc, val) => acc + val, 0) / period;
    const avgLow = lows.reduce((acc, val) => acc + val, 0) / period;
    
    highMA[i] = avgHigh;
    lowMA[i] = avgLow;
  }

  // Calcular HiLo baseado na tendência (stateful)
  // O HILO segue a média móvel correspondente (lowMA em bull, highMA em bear)
  // e muda de tendência quando o preço cruza o HILO
  let reversions = 0;
  
  for (let i = period - 1; i < data.length; i++) {
    if (i === period - 1) {
      // Primeiro valor: determinar tendência inicial baseado no close
      const currentClose = data[i].close;
      const prevClose = i > 0 ? data[i - 1].close : currentClose;
      trend[i] = currentClose >= prevClose ? 'bull' : 'bear';
      hilo[i] = trend[i] === 'bull' ? lowMA[i] : highMA[i];
    } else {
      const currentClose = data[i].close;
      const prevHilo = hilo[i - 1];
      const prevTrend = trend[i - 1];
      
      // Garantir que temos valores válidos
      if (isNaN(prevHilo) || !isFinite(prevHilo)) {
        // Se o valor anterior é inválido, recalcular baseado na tendência atual
        trend[i] = currentClose >= data[i - 1].close ? 'bull' : 'bear';
        hilo[i] = trend[i] === 'bull' ? lowMA[i] : highMA[i];
        continue;
      }
      
      // Inicialmente, herdar tendência anterior e seguir a média móvel correspondente
      let newTrend = prevTrend;
      let newHilo = prevTrend === 'bull' ? lowMA[i] : highMA[i];
      
      // Verificar se houve reversão: close cruzou o HILO anterior
      // Reversão de bear para bull: close cruzou acima do HILO anterior
      if (currentClose > prevHilo && prevTrend === 'bear') {
        newTrend = 'bull';
        newHilo = lowMA[i]; // Mudou para bull, usa lowMA
        reversions++;
      } 
      // Reversão de bull para bear: close cruzou abaixo do HILO anterior
      else if (currentClose < prevHilo && prevTrend === 'bull') {
        newTrend = 'bear';
        newHilo = highMA[i]; // Mudou para bear, usa highMA
        reversions++;
      }
      // Se não houve reversão, o HILO segue a média móvel correspondente à tendência atual
      // Isso cria a "escadinha" que acompanha os candles
      
      trend[i] = newTrend;
      hilo[i] = newHilo;
    }
  }
  
  // Verificar quantos valores únicos existem no HILO
  const uniqueHiloValues = [...new Set(hilo.filter(v => !isNaN(v) && isFinite(v)))];
  
  

  // Retornar no formato compatível (upper/lower) e também hilo/trend para renderização
  const upper: number[] = [];
  const lower: number[] = [];
  
  // Validar valores calculados
  let validCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || isNaN(hilo[i]) || !isFinite(hilo[i])) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      validCount++;
      // Para compatibilidade: upper quando bear, lower quando bull
      if (trend[i] === 'bear') {
        upper.push(hilo[i]);
        lower.push(NaN);
      } else {
        upper.push(NaN);
        lower.push(hilo[i]);
      }
    }
  }
  
  console.log('[calculateHILO] Valid HILO values:', validCount, 'out of', data.length, 
    validCount > 0 ? `sample: ${hilo.slice(period - 1, period + 5).filter(v => !isNaN(v)).join(', ')}` : '');

  return { upper, lower, hilo, trend };
};

// Williams %R
export const calculateWilliamsR = (data: Candle[], config: WilliamsRConfig) => {
  const { period } = config;
  const williamsR: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      williamsR.push(NaN);
      continue;
    }

    const slice = data.slice(i - period + 1, i + 1);
    const highs = slice.map(d => d.high);
    const lows = slice.map(d => d.low);
    const closes = slice.map(d => d.close);
    
    const highest = Math.max(...highs);
    const lowest = Math.min(...lows);
    const currentClose = closes[closes.length - 1];
    
    if (highest === lowest) {
      williamsR.push(-50); // Valor neutro quando não há variação
    } else {
      const wr = ((highest - currentClose) / (highest - lowest)) * -100;
      williamsR.push(wr);
    }
  }

  return williamsR;
};

// CCI (Commodity Channel Index)
export const calculateCCI = (data: Candle[], config: CCIConfig) => {
  const { period } = config;
  const cci: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      cci.push(NaN);
      continue;
    }

    const slice = data.slice(i - period + 1, i + 1);
    const typicalPrices = slice.map(d => (d.high + d.low + d.close) / 3);
    
    const sma = typicalPrices.reduce((acc, price) => acc + price, 0) / period;
    const meanDeviation = typicalPrices.reduce((acc, price) => acc + Math.abs(price - sma), 0) / period;
    
    if (meanDeviation === 0) {
      cci.push(0);
    } else {
      const currentTypicalPrice = typicalPrices[typicalPrices.length - 1];
      cci.push((currentTypicalPrice - sma) / (0.015 * meanDeviation));
    }
  }

  return cci;
};

// ADX (Average Directional Index)
export const calculateADX = (data: Candle[], config: ADXConfig) => {
  const { period } = config;
  const adx: number[] = [];
  const plusDI: number[] = [];
  const minusDI: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < 1) {
      adx.push(NaN);
      plusDI.push(NaN);
      minusDI.push(NaN);
      continue;
    }

    const current = data[i];
    const previous = data[i - 1];
    
    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;
    
    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;
    
    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );
    
    // Para simplificar, vamos usar valores básicos
    // Em uma implementação completa, seria necessário calcular EMAs
    plusDI.push(plusDM > 0 ? 100 : 0);
    minusDI.push(minusDM > 0 ? 100 : 0);
    
    const dx = Math.abs(plusDI[i] - minusDI[i]) / (plusDI[i] + minusDI[i]) * 100;
    adx.push(dx);
  }

  return { adx, plusDI, minusDI };
};

// ATR (Average True Range)
export const calculateATR = (data: Candle[], config: ATRConfig) => {
  const { period } = config;
  const atr: number[] = [];
  const trueRanges: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < 1) {
      atr.push(NaN);
      trueRanges.push(NaN);
      continue;
    }

    const current = data[i];
    const previous = data[i - 1];
    
    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );
    
    trueRanges.push(trueRange);
    
    if (i < period) {
      atr.push(NaN);
    } else {
      // Calcular média simples dos últimos 'period' True Ranges
      const trSlice = trueRanges.slice(i - period + 1, i + 1);
      const validTRs = trSlice.filter(tr => !isNaN(tr) && tr > 0);
      if (validTRs.length > 0) {
        const avgATR = validTRs.reduce((acc, val) => acc + val, 0) / validTRs.length;
        atr.push(avgATR);
      } else {
        atr.push(NaN);
      }
    }
  }

  return atr;
};

// Parabolic SAR
export const calculateParabolicSAR = (data: Candle[], config: ParabolicSARConfig) => {
  const { acceleration, maximum } = config;
  const sar: number[] = [];
  let isLong = true;
  let af = acceleration;
  let ep = data[0].low; // Extreme point

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      sar.push(data[0].low);
      continue;
    }

    const current = data[i];
    const previous = data[i - 1];
    
    if (isLong) {
      if (current.low < sar[i - 1]) {
        isLong = false;
        sar.push(ep);
        ep = current.high;
        af = acceleration;
      } else {
        if (current.high > ep) {
          ep = current.high;
          af = Math.min(af + acceleration, maximum);
        }
        const newSAR = sar[i - 1] + af * (ep - sar[i - 1]);
        sar.push(Math.min(newSAR, previous.low, data[Math.max(0, i - 2)].low));
      }
    } else {
      if (current.high > sar[i - 1]) {
        isLong = true;
        sar.push(ep);
        ep = current.low;
        af = acceleration;
      } else {
        if (current.low < ep) {
          ep = current.low;
          af = Math.min(af + acceleration, maximum);
        }
        const newSAR = sar[i - 1] + af * (ep - sar[i - 1]);
        sar.push(Math.max(newSAR, previous.high, data[Math.max(0, i - 2)].high));
      }
    }
  }

  return sar;
};

// OBV (On-Balance Volume)
export const calculateOBV = (data: Candle[], config: OBVConfig) => {
  const { period } = config;
  const obv: number[] = [];
  let cumulativeOBV = 0;

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      obv.push(0);
      continue;
    }

    const current = data[i];
    const previous = data[i - 1];
    
    if (current.close > previous.close) {
      cumulativeOBV += current.volume || 0;
    } else if (current.close < previous.close) {
      cumulativeOBV -= current.volume || 0;
    }
    
    obv.push(cumulativeOBV);
  }

  // Suavizar com média móvel
  const smoothedOBV: number[] = [];
  for (let i = 0; i < obv.length; i++) {
    if (i < period - 1) {
      smoothedOBV.push(NaN);
    } else {
      const slice = obv.slice(i - period + 1, i + 1);
      const avg = slice.reduce((acc, val) => acc + val, 0) / period;
      smoothedOBV.push(avg);
    }
  }

  return { obv, smoothedOBV };
};

// Volume
export const calculateVolume = (data: Candle[], config: VolumeConfig) => {
  const { period } = config;
  const volume: number[] = [];
  const avgVolume: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const currentVolume = data[i].volume || 0;
    volume.push(currentVolume);
    
    if (i < period - 1) {
      avgVolume.push(NaN);
    } else {
      const slice = volume.slice(i - period + 1, i + 1);
      const avg = slice.reduce((acc, val) => acc + val, 0) / period;
      avgVolume.push(avg);
    }
  }

  return { volume, avgVolume };
};

// WMA (Weighted Moving Average)
export const calculateWMA = (data: Candle[], config: WMAConfig) => {
  const { period } = config;
  const wma: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      wma.push(NaN);
      continue;
    }

    const slice = data.slice(i - period + 1, i + 1);
    const prices = slice.map(d => d.close);
    
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let j = 0; j < prices.length; j++) {
      const weight = j + 1;
      weightedSum += prices[j] * weight;
      weightSum += weight;
    }
    
    wma.push(weightedSum / weightSum);
  }

  return wma;
};

// HMA (Hull Moving Average)
export const calculateHMA = (data: Candle[], config: HMAConfig) => {
  const { period } = config;
  const hma: number[] = [];
  
  // HMA usa WMA de diferentes períodos
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.floor(Math.sqrt(period));
  
  const wmaHalf = calculateWMA(data, { period: halfPeriod });
  const wmaFull = calculateWMA(data, { period });
  
  // Calcular WMA da diferença
  const diff: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(wmaHalf[i]) || isNaN(wmaFull[i])) {
      diff.push(NaN);
    } else {
      diff.push(2 * wmaHalf[i] - wmaFull[i]);
    }
  }
  
  // Aplicar WMA final
  for (let i = 0; i < data.length; i++) {
    if (i < sqrtPeriod - 1) {
      hma.push(NaN);
      continue;
    }

    const slice = diff.slice(i - sqrtPeriod + 1, i + 1);
    const validValues = slice.filter(val => !isNaN(val));
    
    if (validValues.length === 0) {
      hma.push(NaN);
    } else {
      let weightedSum = 0;
      let weightSum = 0;
      
      for (let j = 0; j < validValues.length; j++) {
        const weight = j + 1;
        weightedSum += validValues[j] * weight;
        weightSum += weight;
      }
      
      hma.push(weightedSum / weightSum);
    }
  }

  return hma;
}; 