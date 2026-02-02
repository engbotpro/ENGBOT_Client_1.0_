import { MovingAverageConfig } from './MovingAverage';
import { BollingerBandsConfig } from './BollingerBands';
import { MACDConfig } from './MACD';
import { IchimokuCloudConfig } from './IchimokuCloud';
import { StochasticOscillatorConfig } from './StochasticOscillator';
import { RSIConfig } from './RSI';
import { HILOConfig } from './HILO';
import { WilliamsRConfig } from './WilliamsR';
import { CCIConfig } from './CCI';
import { ADXConfig } from './ADX';
import { ATRConfig } from './ATR';
import { ParabolicSARConfig } from './ParabolicSAR';
import { OBVConfig } from './OBV';
import { VolumeConfig } from './Volume';
import { WMAConfig } from './WMA';
import { HMAConfig } from './HMA';
import { FibonacciConfig } from './Fibonacci';
import { ElliottConfig } from './Elliott';

export { default as MovingAverage } from './MovingAverage';
export { default as BollingerBands } from './BollingerBands';
export { default as MACD } from './MACD';
export { default as IchimokuCloud } from './IchimokuCloud';
export { default as StochasticOscillator } from './StochasticOscillator';
export { default as RSI } from './RSI';
export { default as HILO } from './HILO';
export { default as WilliamsR } from './WilliamsR';
export { default as CCI } from './CCI';
export { default as ADX } from './ADX';
export { default as ATR } from './ATR';
export { default as ParabolicSAR } from './ParabolicSAR';
export { default as OBV } from './OBV';
export { default as Volume } from './Volume';
export { default as WMA } from './WMA';
export { default as HMA } from './HMA';
export { default as Fibonacci } from './Fibonacci';
export { default as Elliott } from './Elliott';

export type {
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
  HMAConfig,
  FibonacciConfig,
  ElliottConfig
};

export type IndicatorType = 
  | 'moving_average'
  | 'bollinger_bands'
  | 'macd'
  | 'ichimoku_cloud'
  | 'stochastic_oscillator'
  | 'rsi'
  | 'hilo'
  | 'williamsr'
  | 'cci'
  | 'adx'
  | 'atr'
  | 'parabolic_sar'
  | 'obv'
  | 'volume'
  | 'wma'
  | 'hma'
  | 'fibonacci'
  | 'elliott';

export interface IndicatorConfig {
  type: IndicatorType;
  movingAverage?: MovingAverageConfig;
  bollingerBands?: BollingerBandsConfig;
  macd?: MACDConfig;
  ichimokuCloud?: IchimokuCloudConfig;
  stochasticOscillator?: StochasticOscillatorConfig;
  rsi?: RSIConfig;
  hilo?: HILOConfig;
  williamsr?: WilliamsRConfig;
  cci?: CCIConfig;
  adx?: ADXConfig;
  atr?: ATRConfig;
  parabolicSAR?: ParabolicSARConfig;
  obv?: OBVConfig;
  volume?: VolumeConfig;
  wma?: WMAConfig;
  hma?: HMAConfig;
  fibonacci?: FibonacciConfig;
  elliott?: ElliottConfig;
} 