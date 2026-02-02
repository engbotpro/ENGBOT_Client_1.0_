import React, { useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  Paper,
} from '@mui/material';
import {
  MovingAverage,
  BollingerBands,
  MACD,
  IchimokuCloud,
  StochasticOscillator,
  RSI,
  type IndicatorType,
  type IndicatorConfig,
  type MovingAverageConfig,
  type BollingerBandsConfig,
  type MACDConfig,
  type IchimokuCloudConfig,
  type StochasticOscillatorConfig,
  type RSIConfig,
} from './indicators';

interface IndicatorSelectorProps {
  selectedIndicator: IndicatorType | null;
  onIndicatorChange: (indicator: IndicatorType | null) => void;
  indicatorConfig: IndicatorConfig | null;
  onConfigChange: (config: IndicatorConfig | null) => void;
}

const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  selectedIndicator,
  onIndicatorChange,
  indicatorConfig,
  onConfigChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getDefaultConfig = (type: IndicatorType): IndicatorConfig => {
    switch (type) {
      case 'moving_average':
        return {
          type,
          movingAverage: {
            period: 20,
            type: 'simple',
            color: '#ff6b6b',
          },
        };
      case 'bollinger_bands':
        return {
          type,
          bollingerBands: {
            period: 20,
            standardDeviation: 2,
            upperColor: '#ff6b6b',
            lowerColor: '#4ecdc4',
            middleColor: '#45b7d1',
          },
        };
      case 'macd':
        return {
          type,
          macd: {
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            macdColor: '#ff6b6b',
            signalColor: '#4ecdc4',
            histogramColor: '#45b7d1',
          },
        };
      case 'ichimoku_cloud':
        return {
          type,
          ichimokuCloud: {
            tenkanPeriod: 9,
            kijunPeriod: 26,
            senkouSpanBPeriod: 52,
            displacement: 26,
            tenkanColor: '#ff6b6b',
            kijunColor: '#4ecdc4',
            senkouSpanAColor: '#45b7d1',
            senkouSpanBColor: '#96ceb4',
            chikouColor: '#feca57',
            cloudColor: '#ff9ff3',
          },
        };
      case 'stochastic_oscillator':
        return {
          type,
          stochasticOscillator: {
            kPeriod: 14,
            dPeriod: 3,
            slowing: 3,
            overbought: 80,
            oversold: 20,
            kColor: '#ff6b6b',
            dColor: '#4ecdc4',
            overboughtColor: '#ff9ff3',
            oversoldColor: '#54a0ff',
          },
        };
      case 'rsi':
        return {
          type,
          rsi: {
            period: 14,
            overbought: 70,
            oversold: 30,
            color: '#ff6b6b',
            overboughtColor: '#ff9ff3',
            oversoldColor: '#54a0ff',
          },
        };
      default:
        return { type: 'moving_average' };
    }
  };

  const handleIndicatorChange = (event: any) => {
    const newType = event.target.value as IndicatorType | null;
    onIndicatorChange(newType);
    
    if (newType) {
      const newConfig = getDefaultConfig(newType);
      onConfigChange(newConfig);
      setExpanded(true);
    } else {
      onConfigChange(null);
      setExpanded(false);
    }
  };

  const handleConfigChange = (config: any) => {
    if (indicatorConfig) {
      const updatedConfig = { ...indicatorConfig };
      switch (indicatorConfig.type) {
        case 'moving_average':
          updatedConfig.movingAverage = config;
          break;
        case 'bollinger_bands':
          updatedConfig.bollingerBands = config;
          break;
        case 'macd':
          updatedConfig.macd = config;
          break;
        case 'ichimoku_cloud':
          updatedConfig.ichimokuCloud = config;
          break;
        case 'stochastic_oscillator':
          updatedConfig.stochasticOscillator = config;
          break;
        case 'rsi':
          updatedConfig.rsi = config;
          break;
      }
      onConfigChange(updatedConfig);
    }
  };

  const renderConfigPanel = () => {
    if (!indicatorConfig) return null;

    switch (indicatorConfig.type) {
      case 'moving_average':
        return (
          <MovingAverage
            config={indicatorConfig.movingAverage!}
            onConfigChange={handleConfigChange}
          />
        );
      case 'bollinger_bands':
        return (
          <BollingerBands
            config={indicatorConfig.bollingerBands!}
            onConfigChange={handleConfigChange}
          />
        );
      case 'macd':
        return (
          <MACD
            config={indicatorConfig.macd!}
            onConfigChange={handleConfigChange}
          />
        );
      case 'ichimoku_cloud':
        return (
          <IchimokuCloud
            config={indicatorConfig.ichimokuCloud!}
            onConfigChange={handleConfigChange}
          />
        );
      case 'stochastic_oscillator':
        return (
          <StochasticOscillator
            config={indicatorConfig.stochasticOscillator!}
            onConfigChange={handleConfigChange}
          />
        );
      case 'rsi':
        return (
          <RSI
            config={indicatorConfig.rsi!}
            onConfigChange={handleConfigChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Indicador Técnico</InputLabel>
        <Select
          value={selectedIndicator || ''}
          onChange={handleIndicatorChange}
          label="Indicador Técnico"
        >
          <MenuItem value="">
            <em>Nenhum</em>
          </MenuItem>
          <MenuItem value="moving_average">Média Móvel</MenuItem>
          <MenuItem value="bollinger_bands">Bandas de Bollinger</MenuItem>
          <MenuItem value="macd">MACD</MenuItem>
          <MenuItem value="ichimoku_cloud">Nuvem de Ichimoku</MenuItem>
          <MenuItem value="stochastic_oscillator">Oscilador Estocástico</MenuItem>
          <MenuItem value="rsi">RSI</MenuItem>
        </Select>
      </FormControl>

      <Collapse in={expanded}>
        <Paper sx={{ mt: 2, p: 2 }}>
          {renderConfigPanel()}
        </Paper>
      </Collapse>
    </Box>
  );
};

export default IndicatorSelector; 