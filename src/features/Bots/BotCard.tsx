import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Switch,
  IconButton,
  Grid,
  LinearProgress,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Settings,
  TrendingUp,
  TrendingDown,
  Visibility,
  VisibilityOff,
  Delete,
  Schedule,
  Close
} from '@mui/icons-material';
import { Bot } from '../../types/bot';
import walletAPI from '../../services/walletAPI';

interface BotCardProps {
  bot: Bot;
  onToggleActive: (botId: string, isActive: boolean) => void;
  onEdit: (botId: string) => void;
  onViewDetails: (bot: Bot) => void;
  onDelete: (bot: Bot) => void;
  onPlay: (botId: string) => void;
  onStop: (botId: string) => void;
  onCloseAllTrades: (botId: string) => void;
}

const BotCard: React.FC<BotCardProps> = ({ bot, onToggleActive, onEdit, onViewDetails, onDelete, onPlay, onStop, onCloseAllTrades }) => {
  const { config, performance } = bot;
  const [virtualBalance, setVirtualBalance] = useState<number>(0);
  
  useEffect(() => {
    // Buscar saldo total da carteira virtual do usuário (compartilhado entre todos os robôs)
    const loadVirtualBalance = async () => {
      try {
        const virtualWallets = await walletAPI.getUserWallets('virtual');
        const totalVirtualBalance = virtualWallets.reduce((sum, wallet) => sum + wallet.value, 0);
        setVirtualBalance(totalVirtualBalance);
      } catch (error) {
        console.error('Erro ao carregar saldo virtual:', error);
        // Se não conseguir carregar, usar saldo inicial padrão
        setVirtualBalance(INITIAL_CAPITAL);
      }
    };
    
    loadVirtualBalance();
    // Atualizar a cada 5 segundos para refletir mudanças no saldo
    const interval = setInterval(loadVirtualBalance, 5000);
    return () => clearInterval(interval);
  }, [performance.netProfit, config.name, performance]);
  
  // Capital inicial padrão (assumindo que todos os bots começam com este valor)
  const INITIAL_CAPITAL = 10000;

  // Função para normalizar valores muito pequenos (erros de precisão) para zero
  const normalizeValue = (value: number): number => {
    if (Math.abs(value) < 0.01) return 0;
    return Math.round(value * 100) / 100;
  };

  // Função para calcular o valor da barra de progresso baseado no lucro/prejuízo
  const calculateProgressValue = (netProfit: number): number => {
    const normalizedProfit = normalizeValue(netProfit);
    
    // Se for lucro: 0% a 100% (100% = dobrou o capital, ou seja, lucro de 100%)
    if (normalizedProfit >= 0) {
      // Percentual de lucro em relação ao capital inicial
      const profitPercentage = (normalizedProfit / INITIAL_CAPITAL) * 100;
      // Limitar a 100% (quando dobra o capital)
      return Math.min(profitPercentage, 100);
    } 
    // Se for prejuízo: 0% a 100% (100% = perdeu tudo, ou seja, prejuízo de 100%)
    else {
      // Percentual de prejuízo em relação ao capital inicial (valor absoluto)
      const lossPercentage = (Math.abs(normalizedProfit) / INITIAL_CAPITAL) * 100;
      // Limitar a 100% (quando perde tudo)
      return Math.min(lossPercentage, 100);
    }
  };

  const formatCurrency = (value: number) => {
    const normalized = normalizeValue(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(normalized);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getProfitColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  const getEnvironmentColor = (environment: string) => {
    return environment === 'real' ? 'error' : 'success';
  };

  const getEnvironmentIcon = (environment: string) => {
    return environment === 'real' ? <Visibility /> : <VisibilityOff />;
  };

  const formatOperationTime = () => {
    if (config.operationMode === 'immediate') {
      return 'Operação Imediata';
    }
    
    if (config.operationTime) {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const selectedDays = config.operationTime.daysOfWeek.map(day => days[day]).join(', ');
      return `${config.operationTime.startTime} - ${config.operationTime.endTime} (${selectedDays})`;
    }
    
    return 'Horário não definido';
  };

  // Determinar cor da borda baseada no lucro/prejuízo
  const borderColor = normalizeValue(performance.netProfit || 0) >= 0 
    ? '#4caf50' // Verde para lucro
    : '#f44336'; // Vermelho para prejuízo

  return (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        border: `3px solid ${borderColor}`,
        borderRadius: 2,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {config.name}
            </Typography>
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
              <Chip
                icon={getEnvironmentIcon(config.environment)}
                label={config.environment === 'real' ? 'Real' : 'Virtual'}
                color={getEnvironmentColor(config.environment)}
                size="small"
              />
              <Chip
                label={config.symbol}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
            <Tooltip title={config.isActive ? 'Parar' : 'Iniciar'}>
              <IconButton
                size="small"
                onClick={() => config.isActive ? onStop(bot.id) : onPlay(bot.id)}
                color={config.isActive ? "error" : "success"}
                sx={{ padding: '4px' }}
              >
                {config.isActive ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Fechar Todas as Posições">
              <IconButton
                size="small"
                onClick={() => onCloseAllTrades(bot.id)}
                color="warning"
                sx={{ padding: '4px' }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver Detalhes">
              <IconButton 
                size="small" 
                onClick={() => onViewDetails(bot)}
                color="info"
                sx={{ padding: '4px' }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Configurar">
              <IconButton 
                size="small" 
                onClick={() => onEdit(bot.id)}
                color="primary"
                sx={{ padding: '4px' }}
              >
                <Settings fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton 
                size="small" 
                onClick={() => onDelete(bot)}
                color="error"
                sx={{ padding: '4px' }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Data de Início
            </Typography>
            <Typography variant="body2">
              {new Date(config.startDate).toLocaleDateString('pt-BR')}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Total de Trades
            </Typography>
            <Typography variant="body2">
              {performance.totalTrades}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Horário de Operação
              </Typography>
            </Box>
            <Typography variant="body2" fontSize="0.75rem">
              {formatOperationTime()}
            </Typography>
          </Grid>
        </Grid>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" fontWeight="medium">
              Saldo Virtual
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              color={getProfitColor(normalizeValue(virtualBalance - INITIAL_CAPITAL))}
            >
              {formatCurrency(virtualBalance)}
            </Typography>
          </Box>
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary">
              Lucro/Prejuízo deste robô: {normalizeValue(performance.netProfit || 0) >= 0 ? '+' : ''}{formatCurrency(performance.netProfit || 0)}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {normalizeValue(performance.netProfit || 0) >= 0 ? (
              <TrendingUp color="success" fontSize="small" />
            ) : (
              <TrendingDown color="error" fontSize="small" />
            )}
            <LinearProgress
              variant="determinate"
              value={calculateProgressValue(performance.netProfit || 0)}
              sx={{ 
                flexGrow: 1,
                height: 8,
                borderRadius: 1,
                backgroundColor: normalizeValue(performance.netProfit || 0) >= 0 
                  ? 'rgba(76, 175, 80, 0.2)' // Verde claro para background (lucro)
                  : 'rgba(244, 67, 54, 0.2)', // Vermelho claro para background (prejuízo)
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  backgroundColor: normalizeValue(performance.netProfit || 0) >= 0
                    ? '#4caf50' // Verde forte para barra preenchida (lucro)
                    : '#f44336', // Vermelho forte para barra preenchida (prejuízo)
                }
              }}
            />
          </Box>
        </Box>

        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Win Rate
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatPercentage(performance.winRate)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Drawdown Máx.
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatPercentage(performance.maxDrawdown)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Profit Factor
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {performance.profitFactor.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Sharpe Ratio
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {performance.sharpeRatio.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>

        <Box mt={2} display="flex" gap={1} flexWrap="wrap">
          {config.strategyName ? (
            <Chip
              label={config.strategyName}
              size="small"
              variant="filled"
              color="primary"
              sx={{ fontWeight: 'bold' }}
            />
          ) : (
            config.indicators.map((indicator, index) => (
              <Chip
                key={index}
                label={indicator.name}
                size="small"
                variant="outlined"
                color={indicator.type === 'primary' ? 'primary' : 'default'}
              />
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default BotCard; 