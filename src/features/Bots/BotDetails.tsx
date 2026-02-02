import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Visibility,
  VisibilityOff,
  Settings,
  CalendarToday,
  AttachMoney,
  Analytics,
  Security,
  Schedule
} from '@mui/icons-material';
import { Bot } from '../../types/bot';
import botAPI from '../../services/botAPI';
import walletAPI from '../../services/walletAPI';

interface BotDetailsProps {
  open: boolean;
  onClose: () => void;
  bot: Bot | null;
  onEdit: (botId: string) => void;
  onBotUpdated?: (updatedBot: Bot) => void;
}

const BotDetails: React.FC<BotDetailsProps> = ({ open, onClose, bot, onEdit, onBotUpdated }) => {
  const [openTrades, setOpenTrades] = useState<any[]>([]);
  const [closedTrades, setClosedTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [currentBot, setCurrentBot] = useState<Bot | null>(bot);
  const [virtualBalance, setVirtualBalance] = useState<number>(0);
  // Ref para guardar o ID do bot que estamos visualizando, para evitar alternâncias
  const viewingBotIdRef = useRef<string | null>(null);

  // Atualizar currentBot apenas quando o modal abre ou quando o bot.id muda explicitamente
  useEffect(() => {
    if (open && bot) {
      // Quando o modal abre, definir o bot atual baseado no ID
      setCurrentBot(bot);
      viewingBotIdRef.current = bot.id; // Guardar o ID do bot que estamos visualizando
    } else if (!open) {
      // Quando o modal fecha, limpar a referência
      viewingBotIdRef.current = null;
    }
  }, [open, bot?.id]); // Usar bot?.id em vez de bot para evitar mudanças desnecessárias

  useEffect(() => {
    if (!open || !currentBot) {
      return;
    }

    // Carregar dados imediatamente quando o modal abre
    loadBotData();
    
    // Atualizar dados a cada 30 segundos quando o modal estiver aberto
    const interval = setInterval(() => {
      loadBotData();
    }, 30000);

    // Cleanup: limpar intervalo quando o modal fechar ou o bot mudar
    return () => {
      clearInterval(interval);
    };
  }, [open, currentBot?.id]); // Usar currentBot?.id para evitar recriação desnecessária

  const loadBotData = async () => {
    // Verificar se ainda estamos visualizando o mesmo bot
    const botIdToLoad = viewingBotIdRef.current;
    if (!botIdToLoad) return;
    
    try {
      setLoadingTrades(true);
      
      // Carregar saldo virtual total do usuário
      try {
        const virtualWallets = await walletAPI.getUserWallets('virtual');
        const totalVirtualBalance = virtualWallets.reduce((sum, wallet) => sum + wallet.value, 0);
        setVirtualBalance(totalVirtualBalance);
      } catch (error) {
        console.error('Erro ao carregar saldo virtual:', error);
        // Se não conseguir carregar, usar saldo inicial padrão
        // Vamos obter o netProfit do bot atualizado depois
        setVirtualBalance(10000);
      }
      
      // Recarregar dados do bot para ter estatísticas atualizadas
      const updatedBotData = await botAPI.getBotById(botIdToLoad);
      
      // Verificar se ainda estamos visualizando o mesmo bot antes de atualizar
      if (viewingBotIdRef.current !== botIdToLoad) {
        return; // Bot mudou, não atualizar
      }
      
      setCurrentBot(prevBot => {
        if (!prevBot || prevBot.id !== botIdToLoad || viewingBotIdRef.current !== botIdToLoad) {
          // Se o bot mudou, não atualizar
          return prevBot;
        }
        
        // Log para debug
        console.log(`[BotDetails ${prevBot.config.name}] Dados recebidos do backend:`, {
          netProfit: updatedBotData?.netProfit,
          totalTrades: updatedBotData?.totalTrades,
          winningTrades: updatedBotData?.winningTrades,
          losingTrades: updatedBotData?.losingTrades,
          totalProfit: updatedBotData?.totalProfit,
          totalLoss: updatedBotData?.totalLoss
        });
        
        if (updatedBotData) {
          // Atualizar apenas as estatísticas, mantendo o resto do bot
          const updatedBot: Bot = {
            ...prevBot,
            performance: {
              totalTrades: updatedBotData.totalTrades,
              winningTrades: updatedBotData.winningTrades,
              losingTrades: updatedBotData.losingTrades,
              winRate: updatedBotData.winRate,
              totalProfit: updatedBotData.totalProfit,
              totalLoss: updatedBotData.totalLoss,
              netProfit: updatedBotData.netProfit || 0, // Garantir que seja 0 se null/undefined
              maxDrawdown: updatedBotData.maxDrawdown,
              sharpeRatio: updatedBotData.sharpeRatio,
              profitFactor: updatedBotData.profitFactor,
              averageWin: updatedBotData.averageWin,
              averageLoss: updatedBotData.averageLoss,
              largestWin: updatedBotData.largestWin,
              largestLoss: updatedBotData.largestLoss,
              consecutiveWins: updatedBotData.consecutiveWins,
              consecutiveLosses: updatedBotData.consecutiveLosses,
              currentStreak: updatedBotData.currentStreak
            }
          };
          
          console.log(`[BotDetails ${prevBot.config.name}] Bot atualizado com netProfit:`, updatedBot.performance.netProfit);
          
          // Atualizar saldo virtual com o netProfit atualizado
          setVirtualBalance(prevBalance => {
            // Se o saldo virtual ainda é o padrão (10000), atualizar com netProfit
            if (prevBalance === 10000) {
              return 10000 + (updatedBot.performance.netProfit || 0);
            }
            return prevBalance;
          });
          
          // Notificar o componente pai apenas se necessário (fora do setState para evitar warning)
          setTimeout(() => {
            if (onBotUpdated && viewingBotIdRef.current === botIdToLoad) {
              onBotUpdated(updatedBot);
            }
          }, 0);
          
          return updatedBot;
        }
        
        return prevBot;
      });
      
      // Carregar trades apenas se ainda estamos visualizando o mesmo bot
      if (viewingBotIdRef.current === botIdToLoad) {
        try {
          const response = await botAPI.getBotAllTrades(botIdToLoad);
          // Verificar novamente antes de atualizar os trades
          if (viewingBotIdRef.current === botIdToLoad) {
            setOpenTrades(response.data?.open || []);
            setClosedTrades(response.data?.closed || []);
          }
        } catch (error) {
          console.error('Erro ao carregar trades:', error);
          if (viewingBotIdRef.current === botIdToLoad) {
            setOpenTrades([]);
            setClosedTrades([]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do bot:', error);
      // Só limpar trades se ainda estamos visualizando o mesmo bot
      if (viewingBotIdRef.current === botIdToLoad) {
        setOpenTrades([]);
        setClosedTrades([]);
      }
    } finally {
      setLoadingTrades(false);
    }
  };

  if (!currentBot) return null;

  const { config, performance } = currentBot;

  // Função para normalizar valores muito pequenos (erros de precisão) para zero
  const normalizeValue = (value: number): number => {
    if (Math.abs(value) < 0.01) return 0;
    return Math.round(value * 100) / 100;
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            {config.name}
          </Typography>
          <Box display="flex" gap={1}>
            <Chip
              icon={getEnvironmentIcon(config.environment)}
              label={config.environment === 'real' ? 'Real' : 'Virtual'}
              color={getEnvironmentColor(config.environment)}
            />
            <Chip
              label={config.isActive ? 'Ativo' : 'Inativo'}
              color={config.isActive ? 'success' : 'default'}
            />
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informações Básicas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Símbolo
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {config.symbol}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Data de Início
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {new Date(config.startDate).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Indicador Principal
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {config.indicators.find(ind => ind.type === 'primary')?.name || 'Nenhum'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Indicador Secundário
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {config.indicators.find(ind => ind.type === 'secondary')?.name || 'Nenhum'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance
                </Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="medium">
                      Saldo Virtual Atual
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="bold"
                      color={getProfitColor(normalizeValue(virtualBalance - 10000))}
                    >
                      {formatCurrency(virtualBalance)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Lucro/Prejuízo
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={getProfitColor(normalizeValue(performance.netProfit || 0))}
                      fontWeight="medium"
                    >
                      {normalizeValue(performance.netProfit || 0) >= 0 ? '+' : ''}{formatCurrency(performance.netProfit || 0)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.abs(normalizeValue(virtualBalance - 10000)) / 1000 * 100, 100)}
                    color={normalizeValue(virtualBalance - 10000) >= 0 ? "success" : "error"}
                  />
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Win Rate
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatPercentage(performance.winRate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total de Trades
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {performance.totalTrades}
                    </Typography>
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    <strong>Nota:</strong> As estatísticas (Win Rate, Lucro Líquido, etc.) são calculadas apenas com trades fechados. 
                    Trades abertos são exibidos na seção "Posições Abertas" abaixo.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Configurações de Trading */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Trading
                </Typography>
                <Grid container spacing={3}>
                  {/* Método de Entrada */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Método de Entrada
                    </Typography>
                    <Box display="flex" gap={1} mb={1}>
                      <Chip label={config.entryMethod.type} size="small" />
                      <Chip label={config.entryMethod.condition} size="small" variant="outlined" />
                    </Box>
                    {config.entryMethod.value && (
                      <Typography variant="body2" color="text.secondary">
                        Valor: {config.entryMethod.value}
                      </Typography>
                    )}
                  </Grid>

                  {/* Método de Saída */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Método de Saída
                    </Typography>
                    <Box display="flex" gap={1} mb={1}>
                      <Chip label={config.exitMethod.type} size="small" />
                      <Chip label={config.exitMethod.condition} size="small" variant="outlined" />
                    </Box>
                    {config.exitMethod.value && (
                      <Typography variant="body2" color="text.secondary">
                        Valor: {config.exitMethod.value}
                      </Typography>
                    )}
                  </Grid>

                  {/* Tamanho da Posição */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Tamanho da Posição
                    </Typography>
                    <Box display="flex" gap={1} mb={1}>
                      <Chip label={config.positionSizing.type} size="small" />
                      <Chip label={`${config.positionSizing.value}${config.positionSizing.type === 'percentage' ? '%' : ' USDT'}`} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Máximo: {config.positionSizing.maxPosition} USDT
                    </Typography>
                  </Grid>

                  {/* Stop Loss e Take Profit */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Stop Loss & Take Profit
                    </Typography>
                    <Box display="flex" gap={1} mb={1}>
                      {config.stopLoss.enabled && (
                        <Chip 
                          label={`SL: ${config.stopLoss.value}%`} 
                          size="small" 
                          color="error" 
                        />
                      )}
                      {config.takeProfit.enabled && (
                        <Chip 
                          label={`TP: ${config.takeProfit.value}%`} 
                          size="small" 
                          color="success" 
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Estatísticas Detalhadas */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estatísticas Detalhadas
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Métrica</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell align="right">Métrica</TableCell>
                        <TableCell align="right">Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Trades Vencedores</TableCell>
                        <TableCell align="right">{performance.winningTrades}</TableCell>
                        <TableCell>Maior Ganho</TableCell>
                        <TableCell align="right">{formatCurrency(performance.largestWin)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Trades Perdedores</TableCell>
                        <TableCell align="right">{performance.losingTrades}</TableCell>
                        <TableCell>Maior Perda</TableCell>
                        <TableCell align="right">{formatCurrency(performance.largestLoss)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Ganho Total</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {formatCurrency(performance.totalProfit)}
                        </TableCell>
                        <TableCell>Perda Total</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                          {formatCurrency(performance.totalLoss)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Ganho Médio</TableCell>
                        <TableCell align="right">{formatCurrency(performance.averageWin)}</TableCell>
                        <TableCell>Perda Média</TableCell>
                        <TableCell align="right">{formatCurrency(performance.averageLoss)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Profit Factor</TableCell>
                        <TableCell align="right">{performance.profitFactor.toFixed(2)}</TableCell>
                        <TableCell>Sharpe Ratio</TableCell>
                        <TableCell align="right">{performance.sharpeRatio.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Drawdown Máximo</TableCell>
                        <TableCell align="right">{formatPercentage(performance.maxDrawdown)}</TableCell>
                        <TableCell>Sequência Atual</TableCell>
                        <TableCell align="right">{performance.currentStreak}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Posições Abertas */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Posições Abertas
                  </Typography>
                  <Chip 
                    label={`${openTrades.length} posição(ões)`}
                    color={openTrades.length > 0 ? "primary" : "default"}
                    size="small"
                  />
                </Box>
                
                {loadingTrades ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress size={24} />
                  </Box>
                ) : openTrades.length === 0 ? (
                  <Alert severity="info">
                    Nenhuma posição aberta no momento.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data/Hora</TableCell>
                          <TableCell>Símbolo</TableCell>
                          <TableCell align="center">Lado</TableCell>
                          <TableCell align="right">Quantidade</TableCell>
                          <TableCell align="right">Preço Entrada</TableCell>
                          <TableCell align="right">Valor Total</TableCell>
                          <TableCell align="right">Stop Loss</TableCell>
                          <TableCell align="right">Take Profit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {openTrades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>
                              {new Date(trade.entryTime).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>{trade.symbol}</TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={trade.side.toUpperCase()} 
                                size="small"
                                color={trade.side === 'buy' ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell align="right">{trade.quantity.toFixed(6)}</TableCell>
                            <TableCell align="right">{formatCurrency(trade.price)}</TableCell>
                            <TableCell align="right">{formatCurrency(trade.total)}</TableCell>
                            <TableCell align="right">
                              {trade.stopLoss ? formatCurrency(trade.stopLoss) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {trade.takeProfit ? formatCurrency(trade.takeProfit) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Trades Fechados */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Trades Fechados
                  </Typography>
                  <Chip 
                    label={`${closedTrades.length} trade(s)`}
                    color={closedTrades.length > 0 ? "success" : "default"}
                    size="small"
                  />
                </Box>
                
                {loadingTrades ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress size={24} />
                  </Box>
                ) : closedTrades.length === 0 ? (
                  <Alert severity="info">
                    Nenhum trade fechado ainda.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data Entrada</TableCell>
                          <TableCell>Data Saída</TableCell>
                          <TableCell>Símbolo</TableCell>
                          <TableCell align="center">Lado</TableCell>
                          <TableCell align="right">Quantidade</TableCell>
                          <TableCell align="right">Preço Entrada</TableCell>
                          <TableCell align="right">Preço Saída</TableCell>
                          <TableCell align="right">P/L</TableCell>
                          <TableCell align="right">P/L %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {closedTrades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>
                              {new Date(trade.entryTime).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              {trade.exitTime ? new Date(trade.exitTime).toLocaleString('pt-BR') : '-'}
                            </TableCell>
                            <TableCell>{trade.symbol}</TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={trade.side.toUpperCase()} 
                                size="small"
                                color={trade.side === 'buy' ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell align="right">{trade.quantity.toFixed(6)}</TableCell>
                            <TableCell align="right">{formatCurrency(trade.price)}</TableCell>
                            <TableCell align="right">
                              {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              color: (trade.pnl || 0) >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}>
                              {trade.pnl !== null && trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              color: (trade.pnlPercent || 0) >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}>
                              {trade.pnlPercent !== null && trade.pnlPercent !== undefined 
                                ? `${trade.pnlPercent >= 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%` 
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Configurações Avançadas */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações Avançadas
                </Typography>
                <Grid container spacing={3}>
                  {/* Gestão de Risco */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Gestão de Risco
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Typography variant="body2">
                        Perda Máxima Diária: {config.riskManagement.maxDailyLoss}%
                      </Typography>
                      <Typography variant="body2">
                        Drawdown Máximo: {config.riskManagement.maxDrawdown}%
                      </Typography>
                      <Typography variant="body2">
                        Posições Abertas Máximas: {config.riskManagement.maxOpenPositions}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Filtros */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Filtros
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Typography variant="body2">
                        Filtro de Tempo: {config.advancedSettings.timeFilter.enabled ? 'Ativo' : 'Inativo'}
                      </Typography>
                      <Typography variant="body2">
                        Filtro de Notícias: {config.advancedSettings.newsFilter.enabled ? 'Ativo' : 'Inativo'}
                      </Typography>
                      <Typography variant="body2">
                        Filtro de Correlação: {config.advancedSettings.correlationFilter.enabled ? 'Ativo' : 'Inativo'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Realizações Parciais */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Realizações Parciais
                    </Typography>
                    {config.partialExits.enabled ? (
                      <Box display="flex" flexDirection="column" gap={1}>
                        {config.partialExits.levels.map((level, index) => (
                          <Typography key={index} variant="body2">
                            {level.percentage}% → {level.quantity * 100}%
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Desabilitado
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Fechar
        </Button>
        <Button 
          onClick={() => {
            onEdit(bot.id);
            onClose();
          }}
          variant="contained" 
          color="primary"
          startIcon={<Settings />}
        >
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BotDetails; 