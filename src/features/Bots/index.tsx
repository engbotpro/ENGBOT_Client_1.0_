import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Refresh,
  Info
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BotCard from './BotCard';
import BotConfig from './BotConfig';
import botAPI from '../../services/botAPI';
import walletAPI from '../../services/walletAPI';
import { Bot, BackendBot } from '../../types/bot';
import type { BotConfig as BotConfigType } from '../../types/bot';

const BotsPage: React.FC = () => {
  const navigate = useNavigate();
  const { botId } = useParams();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Função para verificar se o usuário tem plano ativo
  const hasActivePlan = useMemo(() => {
    if (!user?.currentPlan) return false;
    
    // Se não tem data de expiração, considera como plano ativo (plano permanente ou sem expiração)
    if (!user.planExpiresAt) return true;
    
    // Verifica se a data de expiração ainda não passou
    const expirationDate = new Date(user.planExpiresAt);
    const now = new Date();
    return expirationDate > now;
  }, [user?.currentPlan, user?.planExpiresAt]);

  // Função para obter os limites de robôs baseado no plano do usuário
  const getBotLimits = useMemo(() => {
    if (!hasActivePlan || !user?.currentPlan) {
      return { virtual: 2, real: 0 }; // Sem plano: 2 simulados, 0 reais
    }
    
    const plan = user.currentPlan.toUpperCase();
    
    switch (plan) {
      case 'INICIANTE BLACK':
        return { virtual: 5, real: 0 };
      case 'ENTUSIASTA BLACK':
        return { virtual: 10, real: 2 };
      case 'ESTRATEGISTA BLACK':
        return { virtual: 30, real: 10 };
      case 'PREMIUM BLACK':
        return { virtual: Infinity, real: 30 }; // Ilimitados simulados
      default:
        return { virtual: 2, real: 0 }; // Padrão para planos não reconhecidos
    }
  }, [hasActivePlan, user?.currentPlan]);

  const MAX_VIRTUAL_BOTS = getBotLimits.virtual;
  const MAX_REAL_BOTS = getBotLimits.real;

  const [bots, setBots] = useState<BackendBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<BackendBot | null>(null);
  const [closeTradesDialogOpen, setCloseTradesDialogOpen] = useState(false);
  const [botToCloseTrades, setBotToCloseTrades] = useState<BackendBot | null>(null);
  const [openTradesCount, setOpenTradesCount] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Contar robôs por ambiente
  const virtualBotsCount = useMemo(() => {
    return bots.filter(bot => bot.environment === 'virtual').length;
  }, [bots]);

  const realBotsCount = useMemo(() => {
    return bots.filter(bot => bot.environment === 'real').length;
  }, [bots]);

  // Verificar se estamos na página de configuração
  const isConfigPage = location.pathname.includes('/bots/config');
  const isEditMode = botId && isConfigPage;

  // Função para mostrar snackbar (declarada antes de ser usada)
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (!isConfigPage) {
      loadBots();
      
      // Atualizar bots a cada 30 segundos para mostrar estatísticas atualizadas
      const interval = setInterval(() => {
        loadBots();
      }, 30000); // 30 segundos
      
      return () => clearInterval(interval);
    }
  }, [isConfigPage]);

  const loadBots = async () => {
    try {
      setLoading(true);
      const botsData = await botAPI.getBots();
      setBots(botsData);
    } catch (error) {
      showSnackbar('Erro ao carregar robôs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = () => {
    // Verificar limites antes de permitir criar robô
    if (MAX_VIRTUAL_BOTS !== Infinity && virtualBotsCount >= MAX_VIRTUAL_BOTS) {
      const planName = user?.currentPlan || 'seu plano atual';
      setSnackbar({
        open: true,
        message: `Você atingiu o limite de ${MAX_VIRTUAL_BOTS} robôs simulados do plano ${planName}. Atualize seu plano para criar mais robôs!`,
        severity: 'error'
      });
      return;
    }
    navigate('/home/bots/config');
  };

  const handleEditBot = (botId: string) => {
    navigate(`/home/bots/config/${botId}`);
  };

  const handleSaveBot = async (config: BotConfigType) => {
    try {
      if (isEditMode && botId) {
        // Atualizar robô existente
        const updatedBot = await botAPI.updateBot(botId, config);
        if (updatedBot) {
          showSnackbar('Robô atualizado com sucesso!', 'success');
          navigate('/home/bots');
          return;
        } else {
          throw new Error('Falha ao atualizar robô');
        }
      } else {
        // Verificar limites antes de criar novo robô
        const planName = user?.currentPlan || 'seu plano atual';
        
        if (config.environment === 'real') {
          if (MAX_REAL_BOTS === 0) {
            setSnackbar({
              open: true,
              message: `Seu plano atual (${planName}) não permite criar robôs em ambiente real. Atualize seu plano para usar robôs reais!`,
              severity: 'error'
            });
            throw new Error('Limite de robôs reais atingido');
          }
          
          if (MAX_REAL_BOTS !== Infinity && realBotsCount >= MAX_REAL_BOTS) {
            setSnackbar({
              open: true,
              message: `Você atingiu o limite de ${MAX_REAL_BOTS} robôs reais do plano ${planName}. Atualize seu plano para criar mais robôs!`,
              severity: 'error'
            });
            throw new Error('Limite de robôs reais atingido');
          }
        }
        
        if (config.environment === 'virtual') {
          if (MAX_VIRTUAL_BOTS !== Infinity && virtualBotsCount >= MAX_VIRTUAL_BOTS) {
            setSnackbar({
              open: true,
              message: `Você atingiu o limite de ${MAX_VIRTUAL_BOTS} robôs simulados do plano ${planName}. Atualize seu plano para criar mais robôs!`,
              severity: 'error'
            });
            throw new Error('Limite de robôs simulados atingido');
          }
        }
        
        // Criar novo robô
        const newBot = await botAPI.createBot(config);
        if (newBot) {
        showSnackbar('Robô criado com sucesso!', 'success');
        navigate('/home/bots');
          return;
        } else {
          throw new Error('Falha ao criar robô');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar robô:', error);
      if (!snackbar.open) {
      showSnackbar('Erro ao salvar robô', 'error');
      }
      throw error; // Re-throw para que o componente BotConfig possa tratar
    }
  };

  const handleCancelConfig = () => {
    navigate('/home/bots');
  };

  // Se estamos na página de configuração, renderizar o componente de configuração
  if (isConfigPage) {
    const editingBot = isEditMode ? bots.find(b => b.id === botId) : null;
    const mappedBot = editingBot ? {
      id: editingBot.id,
      config: {
        id: editingBot.id,
        name: editingBot.name,
        environment: editingBot.environment as 'real' | 'virtual',
        symbol: editingBot.symbol,
        timeframe: editingBot.timeframe || '1h',
        isActive: editingBot.isActive,
        startDate: editingBot.startDate,
        operationMode: editingBot.operationMode as 'immediate' | 'scheduled',
        operationTime: editingBot.operationTime ? JSON.parse(editingBot.operationTime as string) : undefined,
        strategyId: editingBot.strategyId || undefined,
        strategyName: editingBot.strategyName || undefined,
        indicators: editingBot.indicators 
          ? (typeof editingBot.indicators === 'string' ? JSON.parse(editingBot.indicators) : editingBot.indicators) // Usar array completo se disponível
          : [
              {
                name: editingBot.primaryIndicator,
                type: 'primary' as const,
                parameters: {},
                description: ''
              },
              ...(editingBot.secondaryIndicator ? [{
                name: editingBot.secondaryIndicator,
                type: 'secondary' as const,
                parameters: {},
                description: ''
              }] : []),
              ...(editingBot.confirmationIndicator ? [{
                name: editingBot.confirmationIndicator,
                type: 'confirmation' as const,
                parameters: {},
                description: ''
              }] : [])
            ],
        entryMethod: {
          type: editingBot.entryType as 'market' | 'limit' | 'stop',
          condition: editingBot.entryCondition,
          value: editingBot.entryValue || undefined
        },
        exitMethod: {
          type: editingBot.exitType as 'market' | 'limit' | 'stop',
          condition: editingBot.exitCondition,
          value: editingBot.exitValue || undefined
        },
        positionSizing: {
          type: editingBot.positionSizingType as 'fixed' | 'percentage' | 'kelly',
          value: editingBot.positionSizingValue,
          maxPosition: editingBot.maxPosition
        },
        partialExits: {
          enabled: Boolean(editingBot.partialExitsEnabled),
          levels: editingBot.partialExitsLevels ? JSON.parse(editingBot.partialExitsLevels as string) : []
        },
        stopLoss: {
          enabled: Boolean(editingBot.stopLossEnabled),
          type: editingBot.stopLossType as 'fixed' | 'trailing' | 'atr',
          value: editingBot.stopLossValue || undefined
        },
        takeProfit: {
          enabled: Boolean(editingBot.takeProfitEnabled),
          type: editingBot.takeProfitType as 'trailing' | 'fixed' | 'atr',
          value: editingBot.takeProfitValue || undefined
        },
        riskManagement: {
          maxDailyLoss: editingBot.maxDailyLoss,
          maxDrawdown: editingBot.maxDrawdown,
          maxOpenPositions: editingBot.maxOpenPositions
        },
        advancedSettings: {
          timeFilter: {
            enabled: Boolean(editingBot.timeFilterEnabled),
            startTime: editingBot.timeFilterStart || '',
            endTime: editingBot.timeFilterEnd || ''
          },
          newsFilter: {
            enabled: Boolean(editingBot.newsFilterEnabled),
            avoidNewsMinutes: editingBot.avoidNewsMinutes
          },
          correlationFilter: {
            enabled: Boolean(editingBot.correlationFilterEnabled),
            maxCorrelation: editingBot.maxCorrelation
          },
          entryExecution: {
            mode: (editingBot as any).entryExecutionMode || 'candle_close'
          },
          exitExecution: {
            mode: (editingBot as any).exitExecutionMode || 'candle_close'
          }
        }
      },
      performance: {
        totalTrades: editingBot.totalTrades,
        winningTrades: editingBot.winningTrades,
        losingTrades: editingBot.losingTrades,
        winRate: editingBot.winRate,
        totalProfit: editingBot.totalProfit,
        totalLoss: editingBot.totalLoss,
        netProfit: editingBot.netProfit,
        maxDrawdown: editingBot.maxDrawdown,
        sharpeRatio: editingBot.sharpeRatio,
        profitFactor: editingBot.profitFactor,
        averageWin: editingBot.averageWin,
        averageLoss: editingBot.averageLoss,
        largestWin: editingBot.largestWin,
        largestLoss: editingBot.largestLoss,
        consecutiveWins: editingBot.consecutiveWins,
        consecutiveLosses: editingBot.consecutiveLosses,
        currentStreak: editingBot.currentStreak
      },
      createdAt: editingBot.createdAt,
      updatedAt: editingBot.updatedAt
    } : undefined;

    return (
      <BotConfig
        initialConfig={mappedBot?.config}
        isEdit={Boolean(isEditMode)}
        onSave={handleSaveBot}
        onCancel={handleCancelConfig}
      />
    );
  }

  const handleToggleActive = async (botId: string, isActive: boolean) => {
    try {
      const updatedBot = await botAPI.toggleBotActive(botId, isActive);
      if (updatedBot) {
        setBots(prev => prev.map(bot => bot.id === botId ? updatedBot : bot));
        showSnackbar(
          `Robô ${isActive ? 'ativado' : 'desativado'} com sucesso!`, 
          'success'
        );
      }
    } catch (error) {
      showSnackbar('Erro ao alterar status do robô', 'error');
    }
  };

  const handlePlayBot = async (botId: string) => {
    try {
      const bot = bots.find(b => b.id === botId);
      if (!bot) {
        showSnackbar('Robô não encontrado', 'error');
        return;
      }

      // Verificar saldo antes de iniciar (apenas para robôs virtuais)
      if (bot.environment === 'virtual') {
        try {
          const virtualWallets = await walletAPI.getUserWallets('virtual');
          const usdtWallet = virtualWallets.find(w => w.symbol === 'USDT');
          const balance = usdtWallet?.value || 0;
          const MINIMUM_BALANCE = 1; // Saldo mínimo necessário (1 USDT)

          if (balance < MINIMUM_BALANCE) {
            showSnackbar(
              `Saldo insuficiente para operar. Saldo atual: ${balance.toFixed(2)} USDT. Saldo mínimo necessário: ${MINIMUM_BALANCE} USDT. Adicione fundos para iniciar o robô.`,
              'error'
            );
            return;
          }
        } catch (balanceError) {
          console.error('Erro ao verificar saldo:', balanceError);
          // Se não conseguir verificar saldo, tentar mesmo assim (o backend também verificará)
        }
      }

      const updatedBot = await botAPI.toggleBotActive(botId, true);
      if (updatedBot) {
        setBots(prev => prev.map(bot => bot.id === botId ? updatedBot : bot));
        showSnackbar('Robô iniciado com sucesso', 'success');
      }
    } catch (error: any) {
      // Se o erro vier do backend com mensagem específica, mostrar ela
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao iniciar robô';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleStopBot = async (botId: string) => {
    try {
      const updatedBot = await botAPI.toggleBotActive(botId, false);
      if (updatedBot) {
        setBots(prev => prev.map(bot => bot.id === botId ? updatedBot : bot));
        showSnackbar('Robô parado com sucesso', 'success');
      }
    } catch (error) {
      showSnackbar('Erro ao parar robô', 'error');
    }
  };

  const handleCloseAllTrades = async (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    // Buscar quantas posições abertas o bot tem
    try {
      const tradesData = await botAPI.getBotOpenTrades(botId);
      const count = tradesData.data?.open?.length || 0;

      if (count === 0) {
        showSnackbar('Nenhuma posição aberta para fechar', 'info');
        return;
      }

      // Abrir diálogo de confirmação
      setBotToCloseTrades(bot);
      setOpenTradesCount(count);
      setCloseTradesDialogOpen(true);
    } catch (error) {
      console.error('Erro ao buscar posições abertas:', error);
      showSnackbar('Erro ao buscar posições abertas', 'error');
    }
  };

  const confirmCloseAllTrades = async () => {
    if (!botToCloseTrades) return;

    try {
      const result = await botAPI.closeAllBotTrades(botToCloseTrades.id);
      if (result.success) {
        showSnackbar(result.message, 'success');
        // Recarregar bots para atualizar estatísticas
        await loadBots();
      }
    } catch (error) {
      console.error('Erro ao fechar posições:', error);
      showSnackbar('Erro ao fechar posições', 'error');
    } finally {
      setCloseTradesDialogOpen(false);
      setBotToCloseTrades(null);
      setOpenTradesCount(0);
    }
  };

  const handleDeleteBot = (bot: Bot) => {
    const backendBot = bots.find(b => b.id === bot.id);
    if (backendBot) {
      setBotToDelete(backendBot);
      setDeleteDialogOpen(true);
    }
  };

  const handleViewDetails = (bot: Bot) => {
    navigate(`/home/bots/${bot.id}/details`);
  };

  const confirmDeleteBot = async () => {
    if (!botToDelete) return;

    try {
      const success = await botAPI.deleteBot(botToDelete.id);
      if (success) {
        setBots(prev => prev.filter(bot => bot.id !== botToDelete.id));
        showSnackbar('Robô deletado com sucesso!', 'success');
      }
    } catch (error) {
      showSnackbar('Erro ao deletar robô', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setBotToDelete(null);
    }
  };

  // Mapear dados do backend para a estrutura esperada pelo frontend
  const mappedBots = bots.map(bot => ({
    id: bot.id,
    config: {
      id: bot.id,
      name: bot.name,
      environment: bot.environment as 'real' | 'virtual',
      symbol: bot.symbol,
      isActive: bot.isActive,
      startDate: bot.startDate,
      operationMode: bot.operationMode as 'immediate' | 'scheduled',
      operationTime: bot.operationTime ? JSON.parse(bot.operationTime as string) : undefined,
      strategyId: bot.strategyId || undefined,
      strategyName: bot.strategyName || undefined,
      indicators: bot.indicators 
        ? (typeof bot.indicators === 'string' ? JSON.parse(bot.indicators) : bot.indicators) // Usar array completo se disponível
        : [
            {
              name: bot.primaryIndicator,
              type: 'primary' as const,
              parameters: {},
              description: ''
            },
            ...(bot.secondaryIndicator ? [{
              name: bot.secondaryIndicator,
              type: 'secondary' as const,
              parameters: {},
              description: ''
            }] : []),
            ...(bot.confirmationIndicator ? [{
              name: bot.confirmationIndicator,
              type: 'confirmation' as const,
              parameters: {},
              description: ''
            }] : [])
          ],
      entryMethod: {
        type: bot.entryType as 'market' | 'limit' | 'stop',
        condition: bot.entryCondition,
        value: bot.entryValue || undefined
      },
      exitMethod: {
        type: bot.exitType as 'market' | 'limit' | 'stop',
        condition: bot.exitCondition,
        value: bot.exitValue || undefined
      },
      positionSizing: {
        type: bot.positionSizingType as 'fixed' | 'percentage' | 'kelly',
        value: bot.positionSizingValue,
        maxPosition: bot.maxPosition
      },
      partialExits: {
        enabled: Boolean(bot.partialExitsEnabled),
        levels: bot.partialExitsLevels ? JSON.parse(bot.partialExitsLevels as string) : []
      },
      stopLoss: {
        enabled: Boolean(bot.stopLossEnabled),
        type: bot.stopLossType as 'fixed' | 'trailing' | 'atr',
        value: bot.stopLossValue || undefined
      },
      takeProfit: {
        enabled: Boolean(bot.takeProfitEnabled),
        type: bot.takeProfitType as 'trailing' | 'fixed' | 'atr',
        value: bot.takeProfitValue || undefined
      },
      riskManagement: {
        maxDailyLoss: bot.maxDailyLoss,
        maxDrawdown: bot.maxDrawdown,
        maxOpenPositions: bot.maxOpenPositions
      },
      advancedSettings: {
        timeFilter: {
          enabled: Boolean(bot.timeFilterEnabled),
          startTime: bot.timeFilterStart || '',
          endTime: bot.timeFilterEnd || ''
        },
        newsFilter: {
          enabled: Boolean(bot.newsFilterEnabled),
          avoidNewsMinutes: bot.avoidNewsMinutes
        },
        correlationFilter: {
          enabled: Boolean(bot.correlationFilterEnabled),
          maxCorrelation: bot.maxCorrelation
        },
        entryExecution: {
          mode: (bot as any).entryExecutionMode || 'candle_close'
        },
        exitExecution: {
          mode: (bot as any).exitExecutionMode || 'candle_close'
        }
      }
    },
    performance: {
      totalTrades: bot.totalTrades,
      winningTrades: bot.winningTrades,
      losingTrades: bot.losingTrades,
      winRate: bot.winRate,
      totalProfit: bot.totalProfit,
      totalLoss: bot.totalLoss,
      netProfit: bot.netProfit,
      maxDrawdown: bot.maxDrawdown,
      sharpeRatio: bot.sharpeRatio,
      profitFactor: bot.profitFactor,
      averageWin: bot.averageWin,
      averageLoss: bot.averageLoss,
      largestWin: bot.largestWin,
      largestLoss: bot.largestLoss,
      consecutiveWins: bot.consecutiveWins,
      consecutiveLosses: bot.consecutiveLosses,
      currentStreak: bot.currentStreak
    },
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt
  }));

  // Filtrar robôs
  const filteredBots = mappedBots.filter(bot => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && bot.config.isActive) ||
      (statusFilter === 'inactive' && !bot.config.isActive);
    
    const matchesEnvironment = environmentFilter === 'all' || 
      bot.config.environment === environmentFilter;
    
    const matchesSymbol = !symbolFilter || 
      bot.config.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
    
    const matchesSearch = !searchTerm || 
      bot.config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.config.symbol.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesEnvironment && matchesSymbol && matchesSearch;
  });

  // Estatísticas
  const totalBots = mappedBots.length;
  const activeBots = mappedBots.filter(bot => bot.config.isActive).length;
  const virtualBots = mappedBots.filter(bot => bot.config.environment === 'virtual').length;
  // const realBots = mappedBots.filter(bot => bot.config.environment === 'real').length;
  // Lucro Total = soma do lucro/prejuízo líquido (netProfit) de todos os robôs
  const totalProfit = mappedBots.reduce((sum, bot) => sum + (bot.performance.netProfit || 0), 0);

  const symbols = Array.from(new Set(mappedBots.map(bot => bot.config.symbol)));

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Robôs de Trading
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateBot}
            size="large"
            disabled={MAX_VIRTUAL_BOTS !== Infinity && virtualBotsCount >= MAX_VIRTUAL_BOTS}
          >
            Criar Robô
          </Button>
        </Box>

        {/* Indicador de Limites - mostrar para todos os planos */}
        <Alert 
          severity={
            (MAX_VIRTUAL_BOTS !== Infinity && virtualBotsCount >= MAX_VIRTUAL_BOTS) || 
            (MAX_REAL_BOTS !== Infinity && MAX_REAL_BOTS > 0 && realBotsCount >= MAX_REAL_BOTS)
              ? 'error' 
              : 'info'
          }
          icon={<Info />}
          sx={{ mb: 3 }}
          action={
            (MAX_VIRTUAL_BOTS !== Infinity && virtualBotsCount >= MAX_VIRTUAL_BOTS) || 
            (MAX_REAL_BOTS !== Infinity && MAX_REAL_BOTS > 0 && realBotsCount >= MAX_REAL_BOTS) ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => navigate('/home/payment')}
              >
                Atualizar Plano
              </Button>
            ) : null
          }
        >
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography variant="body2" component="span">
              <strong>Limites do Plano {user?.currentPlan || 'Gratuito'}:</strong>
            </Typography>
            <Typography variant="body2" component="span">
              • Robôs Simulados: <strong>{virtualBotsCount}</strong> de{' '}
              {MAX_VIRTUAL_BOTS === Infinity ? (
                <strong>ilimitados</strong>
              ) : (
                <><strong>{MAX_VIRTUAL_BOTS}</strong> utilizados</>
              )}
            </Typography>
            <Typography variant="body2" component="span">
              • Robôs Reais: <strong>{realBotsCount}</strong> de{' '}
              {MAX_REAL_BOTS === 0 ? (
                <strong>Não disponível</strong>
              ) : MAX_REAL_BOTS === Infinity ? (
                <strong>ilimitados</strong>
              ) : (
                <><strong>{MAX_REAL_BOTS}</strong> utilizados</>
              )}
            </Typography>
            {(MAX_VIRTUAL_BOTS !== Infinity && virtualBotsCount >= MAX_VIRTUAL_BOTS) || 
             (MAX_REAL_BOTS !== Infinity && MAX_REAL_BOTS > 0 && realBotsCount >= MAX_REAL_BOTS) ? (
              <Typography variant="body2" component="span" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                Você atingiu o limite de robôs do seu plano. Atualize seu plano para criar mais robôs!
              </Typography>
            ) : null}
          </Box>
        </Alert>

        {/* Estatísticas */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {totalBots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Robôs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {activeBots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Robôs Ativos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {virtualBots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ambiente Virtual
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography 
                  variant="h6" 
                  color={totalProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  ${totalProfit.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lucro Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Buscar robôs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Ativos</MenuItem>
                    <MenuItem value="inactive">Inativos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Ambiente</InputLabel>
                  <Select
                    value={environmentFilter}
                    label="Ambiente"
                    onChange={(e) => setEnvironmentFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="virtual">Virtual</MenuItem>
                    <MenuItem value="real">Real</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Símbolo</InputLabel>
                  <Select
                    value={symbolFilter}
                    label="Símbolo"
                    onChange={(e) => setSymbolFilter(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {symbols.map(symbol => (
                      <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadBots}
                    disabled={loading}
                  >
                    Atualizar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={() => {
                      setStatusFilter('all');
                      setEnvironmentFilter('all');
                      setSymbolFilter('');
                      setSearchTerm('');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Lista de Robôs */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      ) : filteredBots.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum robô encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {bots.length === 0 
                  ? 'Crie seu primeiro robô de trading para começar'
                  : 'Tente ajustar os filtros de busca'
                }
              </Typography>
              {bots.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateBot}
                  sx={{ mt: 2 }}
                >
                  Criar Primeiro Robô
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredBots.map((bot) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={bot.id}>
              <BotCard
                bot={bot}
                onToggleActive={handleToggleActive}
                onEdit={handleEditBot}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteBot}
                onPlay={handlePlayBot}
                onStop={handleStopBot}
                onCloseAllTrades={handleCloseAllTrades}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de Confirmação de Deletar */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar o robô "{botToDelete?.name}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmDeleteBot} color="error" variant="contained">
            Deletar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Fechar Todas as Posições */}
      <Dialog open={closeTradesDialogOpen} onClose={() => setCloseTradesDialogOpen(false)}>
        <DialogTitle>Fechar Todas as Posições</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Tem certeza que deseja fechar todas as <strong>{openTradesCount}</strong> posição(ões) aberta(s) do robô <strong>"{botToCloseTrades?.name}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as posições serão fechadas ao preço de mercado atual.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseTradesDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmCloseAllTrades} color="warning" variant="contained">
            Fechar Todas as Posições
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BotsPage;
