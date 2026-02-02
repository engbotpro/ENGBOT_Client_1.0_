import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  MovingAverage,
  BollingerBands,
  MACD,
  IchimokuCloud,
  StochasticOscillator,
  RSI,
  HILO,
  WilliamsR,
  CCI,
  ADX,
  ATR,
  ParabolicSAR,
  OBV,
  Volume,
  WMA,
  HMA,
  Fibonacci,
  Elliott,
  type IndicatorConfig,
} from './indicators';

interface IndicatorModalProps {
  open: boolean;
  onClose: () => void;
  indicatorConfig: IndicatorConfig | null;
  onConfigChange: (config: IndicatorConfig) => void;
}

const IndicatorModal: React.FC<IndicatorModalProps> = ({
  open,
  onClose,
  indicatorConfig,
  onConfigChange,
  onFibonacciSelectMode,
}) => {
  if (!indicatorConfig) return null;

  const handleConfigChange = (config: any) => {
    console.log('=== IndicatorModal handleConfigChange chamado ===');
    console.log('Config recebida:', config);
    console.log('IndicatorConfig atual:', indicatorConfig);
    
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
      case 'hilo':
        updatedConfig.hilo = config;
        break;
      case 'williamsr':
        updatedConfig.williamsr = config;
        break;
      case 'cci':
        updatedConfig.cci = config;
        break;
      case 'adx':
        updatedConfig.adx = config;
        break;
      case 'atr':
        updatedConfig.atr = config;
        break;
      case 'parabolic_sar':
        updatedConfig.parabolicSAR = config;
        break;
      case 'obv':
        updatedConfig.obv = config;
        break;
      case 'volume':
        updatedConfig.volume = config;
        break;
      case 'wma':
        updatedConfig.wma = config;
        break;
      case 'hma':
        updatedConfig.hma = config;
        break;
      case 'fibonacci':
        updatedConfig.fibonacci = config;
        break;
      case 'elliott':
        updatedConfig.elliott = config;
        break;
    }
    
    console.log('Updated config:', updatedConfig);
    console.log('Chamando onConfigChange...');
    
    onConfigChange(updatedConfig);
    console.log('onConfigChange chamado');
  };

  const getIndicatorTitle = () => {
    switch (indicatorConfig.type) {
      case 'moving_average':
        return 'Média Móvel';
      case 'bollinger_bands':
        return 'Bandas de Bollinger';
      case 'macd':
        return 'MACD';
      case 'ichimoku_cloud':
        return 'Nuvem de Ichimoku';
      case 'stochastic_oscillator':
        return 'Oscilador Estocástico';
      case 'rsi':
        return 'RSI (Índice de Força Relativa)';
      case 'hilo':
        return 'HILO (High-Low)';
      case 'williamsr':
        return 'Williams %R';
      case 'cci':
        return 'CCI (Commodity Channel Index)';
      case 'adx':
        return 'ADX (Average Directional Index)';
      case 'atr':
        return 'ATR (Average True Range)';
      case 'parabolic_sar':
        return 'Parabolic SAR';
      case 'obv':
        return 'OBV (On-Balance Volume)';
      case 'volume':
        return 'Volume';
      case 'wma':
        return 'WMA (Weighted Moving Average)';
      case 'hma':
        return 'HMA (Hull Moving Average)';
      case 'fibonacci':
        return 'Fibonacci Retracement';
      case 'elliott':
        return 'Ondas de Elliott';
      default:
        return 'Indicador';
    }
  };

  const renderConfigPanel = () => {
    switch (indicatorConfig.type) {
      case 'moving_average':
        if (!indicatorConfig.movingAverage) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <MovingAverage
            config={indicatorConfig.movingAverage}
            onConfigChange={handleConfigChange}
          />
        );
      case 'bollinger_bands':
        if (!indicatorConfig.bollingerBands) {
          console.error('BollingerBands config is missing');
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <BollingerBands
            config={indicatorConfig.bollingerBands}
            onConfigChange={handleConfigChange}
          />
        );
      case 'macd':
        if (!indicatorConfig.macd) {
          console.error('MACD config is missing');
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <MACD
            config={indicatorConfig.macd}
            onConfigChange={handleConfigChange}
          />
        );
      case 'ichimoku_cloud':
        if (!indicatorConfig.ichimokuCloud) {
          console.error('IchimokuCloud config is missing');
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <IchimokuCloud
            config={indicatorConfig.ichimokuCloud}
            onConfigChange={handleConfigChange}
          />
        );
      case 'stochastic_oscillator':
        if (!indicatorConfig.stochasticOscillator) {
          console.error('StochasticOscillator config is missing');
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <StochasticOscillator
            config={indicatorConfig.stochasticOscillator}
            onConfigChange={handleConfigChange}
          />
        );
      case 'rsi':
        if (!indicatorConfig.rsi) {
          console.error('RSI config is missing');
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <RSI
            config={indicatorConfig.rsi}
            onConfigChange={handleConfigChange}
          />
        );
      case 'hilo':
        if (!indicatorConfig.hilo) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <HILO
            config={indicatorConfig.hilo}
            onConfigChange={handleConfigChange}
          />
        );
      case 'williamsr':
        if (!indicatorConfig.williamsr) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <WilliamsR
            config={indicatorConfig.williamsr}
            onConfigChange={handleConfigChange}
          />
        );
      case 'cci':
        if (!indicatorConfig.cci) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <CCI
            config={indicatorConfig.cci}
            onConfigChange={handleConfigChange}
          />
        );
      case 'adx':
        if (!indicatorConfig.adx) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <ADX
            config={indicatorConfig.adx}
            onConfigChange={handleConfigChange}
          />
        );
      case 'atr':
        if (!indicatorConfig.atr) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <ATR
            config={indicatorConfig.atr}
            onConfigChange={handleConfigChange}
          />
        );
      case 'parabolic_sar':
        if (!indicatorConfig.parabolicSAR) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <ParabolicSAR
            config={indicatorConfig.parabolicSAR}
            onConfigChange={handleConfigChange}
          />
        );
      case 'obv':
        if (!indicatorConfig.obv) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <OBV
            config={indicatorConfig.obv}
            onConfigChange={handleConfigChange}
          />
        );
      case 'volume':
        if (!indicatorConfig.volume) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <Volume
            config={indicatorConfig.volume}
            onConfigChange={handleConfigChange}
          />
        );
      case 'wma':
        if (!indicatorConfig.wma) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <WMA
            config={indicatorConfig.wma}
            onConfigChange={handleConfigChange}
          />
        );
      case 'hma':
        if (!indicatorConfig.hma) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <HMA
            config={indicatorConfig.hma}
            onConfigChange={handleConfigChange}
          />
        );
      case 'fibonacci':
        if (!indicatorConfig.fibonacci) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <Fibonacci
            config={indicatorConfig.fibonacci}
            onConfigChange={handleConfigChange}
            onSelectPoints={onFibonacciSelectMode}
          />
        );
      case 'elliott':
        if (!indicatorConfig.elliott) {
          return <div>Erro: Configuração não encontrada</div>;
        }
        return (
          <Elliott
            config={indicatorConfig.elliott}
            onConfigChange={handleConfigChange}
            onSelectPoints={onFibonacciSelectMode}
          />
        );
      default:
        console.error('Unknown indicator type:', indicatorConfig.type);
        return <div>Erro: Tipo de indicador desconhecido</div>;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1e1e1e',
          color: '#fff',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {getIndicatorTitle()}
        <IconButton
          onClick={onClose}
          sx={{ color: '#fff' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {renderConfigPanel()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#fff' }}>
          Fechar
        </Button>
        <Button 
          onClick={() => {
            onConfigChange(indicatorConfig);
            onClose();
          }} 
          variant="contained" 
          sx={{ 
            backgroundColor: '#4caf50',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#45a049'
            }
          }}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IndicatorModal; 