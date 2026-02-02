import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  TrendingUp,
  TrendingDown,
  Settings,
  Timeline,
  Analytics,
  AutoFixHigh,
  History,
  Assessment,
  Speed,
  Psychology,
  Delete,
  Info
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import BacktestConfig from './BacktestConfig';
import OptimizationPanel from './OptimizationPanel';
import botAPI from '../../services/botAPI';
import { Bot, BackendBot } from '../../types/bot';
import { runBacktest } from '../../services/backtestService';

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
  id: string;
  botConfig: any;
  startDate: string;
  endDate: string;
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
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  trades?: Trade[];
}

interface OptimizationResult {
  id: string;
  parameter: string;
  originalValue: number;
  optimizedValue: number;
  improvement: number;
  backtestResult: BacktestResult;
}

const BackTestPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Função para obter o limite de backtests baseado no plano do usuário
  const getBacktestLimit = useMemo(() => {
    if (!hasActivePlan || !user?.currentPlan) return 30; // Sem plano: 30 backtests
    
    const plan = user.currentPlan.toUpperCase();
    
    switch (plan) {
      case 'INICIANTE BLACK':
        return 30;
      case 'ENTUSIASTA BLACK':
        return 120;
      case 'ESTRATEGISTA BLACK':
        return 200;
      case 'PREMIUM BLACK':
        return Infinity; // Ilimitado
      default:
        return 30; // Padrão para planos não reconhecidos
    }
  }, [hasActivePlan, user?.currentPlan]);

  // Constantes para controle de limite
  const BACKTEST_COUNTER_KEY = 'backtest_monthly_counter'; // Chave para localStorage

  // Função para obter a chave do mês atual (YYYY-MM)
  const getCurrentMonthKey = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Função para obter o contador de backtests do mês atual
  const getBacktestCount = (): number => {
    const monthKey = getCurrentMonthKey();
    const stored = localStorage.getItem(`${BACKTEST_COUNTER_KEY}_${monthKey}`);
    return stored ? parseInt(stored, 10) : 0;
  };

  // Função para incrementar o contador de backtests
  const incrementBacktestCount = (): void => {
    const monthKey = getCurrentMonthKey();
    const currentCount = getBacktestCount();
    localStorage.setItem(`${BACKTEST_COUNTER_KEY}_${monthKey}`, String(currentCount + 1));
  };

  // Estado para o contador de backtests restantes
  const [backtestsRemaining, setBacktestsRemaining] = useState<number>(() => {
    const limit = getBacktestLimit;
    if (limit === Infinity) return Infinity;
    const count = getBacktestCount();
    return Math.max(0, limit - count);
  });

  // Atualizar contador quando o componente carrega ou quando o plano muda
  useEffect(() => {
    const limit = getBacktestLimit;
    if (limit === Infinity) {
      setBacktestsRemaining(Infinity);
    } else {
      const count = getBacktestCount();
      setBacktestsRemaining(Math.max(0, limit - count));
    }
  }, [hasActivePlan, getBacktestLimit]);

  const [bots, setBots] = useState<Bot[]>([]);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningBacktest, setRunningBacktest] = useState(false);
  const [runningOptimization, setRunningOptimization] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [optimizationOpen, setOptimizationOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    resultId: string | null;
    resultName: string;
  }>({ open: false, resultId: null, resultName: '' });

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  useEffect(() => {
    loadBots();
    loadBacktestResults();
  }, []);

  const loadBots = async () => {
    try {
      const botsData: BackendBot[] = await botAPI.getBots();
      // Mapear dados do backend para a estrutura esperada pelo frontend
      const mappedBots: Bot[] = botsData
        .filter((bot) => bot && bot.id && bot.name && bot.symbol) // Filtrar bots inválidos
        .map(bot => ({
        id: bot.id,
        config: {
          id: bot.id,
          name: bot.name,
          environment: bot.environment as 'real' | 'virtual',
          symbol: bot.symbol,
          isActive: bot.isActive,
          startDate: bot.startDate,
          operationMode: bot.operationMode as 'immediate' | 'scheduled',
          operationTime: bot.operationTime ? (() => {
            try {
              return JSON.parse(bot.operationTime as string);
            } catch {
              return undefined;
            }
          })() : undefined,
          primaryIndicator: bot.primaryIndicator,
          timeframe: bot.timeframe || '1h',
          // Usar o campo indicators do backend se disponível (formato atualizado)
          // Caso contrário, usar os campos legados para compatibilidade
          indicators: (() => {
            if (bot.indicators) {
              try {
                const parsedIndicators = JSON.parse(bot.indicators);
                if (Array.isArray(parsedIndicators) && parsedIndicators.length > 0) {
                  return parsedIndicators;
                }
              } catch (e) {
                console.warn('Erro ao parsear indicadores do bot:', e);
              }
            }
            // Fallback para campos legados
            const legacyIndicators = [
              {
                name: bot.primaryIndicator,
                type: 'primary' as const,
                parameters: {},
                description: ''
              }
            ];
            if (bot.secondaryIndicator) {
              legacyIndicators.push({
                name: bot.secondaryIndicator,
                type: 'secondary' as const,
                parameters: {},
                description: ''
              });
            }
            if (bot.confirmationIndicator) {
              legacyIndicators.push({
                name: bot.confirmationIndicator,
                type: 'confirmation' as const,
                parameters: {},
                description: ''
              });
            }
            return legacyIndicators;
          })(),
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
            levels: bot.partialExitsLevels ? (() => {
              try {
                return JSON.parse(bot.partialExitsLevels as string);
              } catch {
                return [];
              }
            })() : []
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
              startTime: bot.timeFilterStart || undefined,
              endTime: bot.timeFilterEnd || undefined
            },
            newsFilter: {
              enabled: Boolean(bot.newsFilterEnabled),
              avoidNewsMinutes: bot.avoidNewsMinutes
            },
            correlationFilter: {
              enabled: Boolean(bot.correlationFilterEnabled),
              maxCorrelation: bot.maxCorrelation
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
      setBots(mappedBots);
    } catch (error) {
      showSnackbar('Erro ao carregar robôs', 'error');
    }
  };

  const loadBacktestResults = async () => {
    try {
      setLoading(true);
      // Carregar resultados de backteste do localStorage ou de uma API futura
      // Por enquanto, inicializar vazio - apenas resultados reais serão exibidos
      const savedResults = localStorage.getItem('backtestResults');
      if (savedResults) {
        try {
          const parsedResults = JSON.parse(savedResults);
          setBacktestResults(parsedResults);
        } catch (e) {
          console.error('Erro ao parsear resultados salvos:', e);
          setBacktestResults([]);
        }
      } else {
        setBacktestResults([]);
      }
    } catch (error) {
      console.error('Erro ao carregar resultados de backteste:', error);
      setBacktestResults([]);
    } finally {
      setLoading(false);
    }
  };



  const handleStartBacktest = () => {
    setConfigOpen(true);
  };

  const handleRunBacktest = async (config: any) => {
    // Obter limite baseado no plano do usuário (declarado no início para ser acessível em toda a função)
    const limit = getBacktestLimit;
    
    try {
      // Verificar limite baseado no plano do usuário
      if (limit !== Infinity) {
        const currentCount = getBacktestCount();
        if (currentCount >= limit) {
          const planName = user?.currentPlan || 'seu plano';
          setSnackbar({
            open: true,
            message: `Você atingiu o limite de ${limit} backtests por mês do plano ${planName}. Atualize seu plano para mais backtests!`,
            severity: 'error'
          });
          setConfigOpen(false);
          return;
        }
      }

      console.log('🚀 Iniciando backtest com config:', config);
      setRunningBacktest(true);
      setConfigOpen(false);
      
      // Pequeno delay para garantir que o Dialog seja renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Recarregar o bot do backend para garantir que temos as configurações mais recentes
      let selectedBot = bots.find(bot => bot.id === config.botId);
      if (!selectedBot) {
        // Se não encontrou na lista, tentar carregar do backend
        try {
          const botsData: BackendBot[] = await botAPI.getBots();
          const botData = botsData.find(b => b.id === config.botId);
          if (botData) {
            // Mapear o bot do backend para o formato esperado
            selectedBot = {
              id: botData.id,
              config: {
                id: botData.id,
                name: botData.name,
                environment: botData.environment as 'real' | 'virtual',
                symbol: botData.symbol,
                isActive: botData.isActive,
                startDate: botData.startDate,
                operationMode: botData.operationMode as 'immediate' | 'scheduled',
                operationTime: botData.operationTime ? (() => {
                  try {
                    return JSON.parse(botData.operationTime as string);
                  } catch {
                    return undefined;
                  }
                })() : undefined,
                primaryIndicator: botData.primaryIndicator,
                timeframe: botData.timeframe || '1h',
                indicators: (() => {
                  if (botData.indicators) {
                    try {
                      const parsedIndicators = JSON.parse(botData.indicators);
                      if (Array.isArray(parsedIndicators) && parsedIndicators.length > 0) {
                        return parsedIndicators;
                      }
                    } catch (e) {
                      console.warn('Erro ao parsear indicadores do bot:', e);
                    }
                  }
                  // Fallback para campos legados
                  const legacyIndicators = [
                    {
                      name: botData.primaryIndicator,
                      type: 'primary' as const,
                      parameters: {},
                      description: ''
                    }
                  ];
                  if (botData.secondaryIndicator) {
                    legacyIndicators.push({
                      name: botData.secondaryIndicator,
                      type: 'secondary' as const,
                      parameters: {},
                      description: ''
                    });
                  }
                  if (botData.confirmationIndicator) {
                    legacyIndicators.push({
                      name: botData.confirmationIndicator,
                      type: 'confirmation' as const,
                      parameters: {},
                      description: ''
                    });
                  }
                  return legacyIndicators;
                })(),
                entryMethod: {
                  type: botData.entryType as 'market' | 'limit' | 'stop',
                  condition: botData.entryCondition,
                  value: botData.entryValue || undefined
                },
                exitMethod: {
                  type: botData.exitType as 'market' | 'limit' | 'stop',
                  condition: botData.exitCondition,
                  value: botData.exitValue || undefined
                },
                positionSizing: {
                  type: botData.positionSizingType as 'fixed' | 'percentage' | 'kelly',
                  value: botData.positionSizingValue,
                  maxPosition: botData.maxPosition
                },
                partialExits: {
                  enabled: Boolean(botData.partialExitsEnabled),
                  levels: botData.partialExitsLevels ? (() => {
                    try {
                      return JSON.parse(botData.partialExitsLevels as string);
                    } catch {
                      return [];
                    }
                  })() : []
                },
                stopLoss: {
                  enabled: Boolean(botData.stopLossEnabled),
                  type: botData.stopLossType as 'fixed' | 'trailing' | 'atr',
                  value: botData.stopLossValue || undefined
                },
                takeProfit: {
                  enabled: Boolean(botData.takeProfitEnabled),
                  type: botData.takeProfitType as 'trailing' | 'fixed' | 'atr',
                  value: botData.takeProfitValue || undefined
                },
                riskManagement: {
                  maxDailyLoss: botData.maxDailyLoss,
                  maxDrawdown: botData.maxDrawdown,
                  maxOpenPositions: botData.maxOpenPositions
                },
                advancedSettings: {
                  timeFilter: {
                    enabled: Boolean(botData.timeFilterEnabled),
                    startTime: botData.timeFilterStart || undefined,
                    endTime: botData.timeFilterEnd || undefined
                  },
                  newsFilter: {
                    enabled: Boolean(botData.newsFilterEnabled),
                    avoidNewsMinutes: botData.avoidNewsMinutes
                  },
                  correlationFilter: {
                    enabled: Boolean(botData.correlationFilterEnabled),
                    maxCorrelation: botData.maxCorrelation
                  }
                }
              },
              performance: {
                totalTrades: botData.totalTrades,
                winningTrades: botData.winningTrades,
                losingTrades: botData.losingTrades,
                winRate: botData.winRate,
                totalProfit: botData.totalProfit,
                totalLoss: botData.totalLoss,
                netProfit: botData.netProfit,
                maxDrawdown: botData.maxDrawdown,
                sharpeRatio: botData.sharpeRatio,
                profitFactor: botData.profitFactor,
                averageWin: botData.averageWin,
                averageLoss: botData.averageLoss,
                largestWin: botData.largestWin,
                largestLoss: botData.largestLoss,
                consecutiveWins: botData.consecutiveWins,
                consecutiveLosses: botData.consecutiveLosses,
                currentStreak: botData.currentStreak
              },
              createdAt: botData.createdAt,
              updatedAt: botData.updatedAt
            };
          }
        } catch (error) {
          console.error('Erro ao recarregar bot do backend:', error);
        }
      } else {
        // Recarregar o bot do backend para garantir configurações atualizadas
        try {
          const botsData: BackendBot[] = await botAPI.getBots();
          const botData = botsData.find(b => b.id === config.botId);
          if (botData) {
            // Atualizar os indicadores do bot selecionado com os dados mais recentes
            if (botData.indicators) {
              try {
                // Verificar se já é um objeto/array ou se precisa fazer parse
                let parsedIndicators;
                if (typeof botData.indicators === 'string') {
                  parsedIndicators = JSON.parse(botData.indicators);
                } else if (Array.isArray(botData.indicators)) {
                  parsedIndicators = botData.indicators;
                } else {
                  console.warn('Formato de indicadores não reconhecido:', typeof botData.indicators);
                  parsedIndicators = null;
                }
                
                if (parsedIndicators && Array.isArray(parsedIndicators) && parsedIndicators.length > 0) {
                  selectedBot.config.indicators = parsedIndicators;
                  console.log('✅ Indicadores atualizados do backend:', parsedIndicators);
                }
              } catch (e) {
                console.warn('Erro ao parsear indicadores do bot:', e);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao recarregar bot do backend:', error);
        }
      }
      
      if (!selectedBot) {
        showSnackbar('Robô não encontrado', 'error');
        setRunningBacktest(false);
        return;
      }
      
      console.log('🤖 Bot selecionado para backtest:', selectedBot);
      console.log('📊 Indicadores do bot:', selectedBot.config.indicators);

      console.log('✅ Bot encontrado, iniciando backtest...');
      
      // Converter datas e combinar com horários
      let startDate: Date;
      let endDate: Date;
      
      if (config.startDate instanceof Date) {
        startDate = new Date(config.startDate);
      } else {
        startDate = new Date(config.startDate);
      }
      
      if (config.endDate instanceof Date) {
        endDate = new Date(config.endDate);
      } else {
        endDate = new Date(config.endDate);
      }
      
      // Aplicar horários se fornecidos
      if (config.startTime) {
        const [hours, minutes] = config.startTime.split(':').map(Number);
        startDate.setHours(hours, minutes, 0, 0);
      }
      
      if (config.endTime) {
        const [hours, minutes] = config.endTime.split(':').map(Number);
        endDate.setHours(hours, minutes, 59, 999); // 59 segundos e 999ms para incluir todo o último minuto
      }
      
      // Executar backtest real
      // Usar ?? em vez de || para permitir valores 0
      const backtestResult = await runBacktest(
        selectedBot,
        startDate,
        endDate,
        config.initialCapital ?? 10000,
        config.commission ?? 0.1,
        config.slippage ?? 0.05
      );
      
      // Formatar datas para exibição
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log('💾 Salvando resultado do backtest com indicadores:', selectedBot.config.indicators);
      
      const newResult: BacktestResult = {
        id: Date.now().toString(),
        botConfig: {
          ...selectedBot.config, // Incluir toda a configuração do bot (incluindo indicadores)
          name: config.name || selectedBot.config.name, // Usar o nome do backtest se fornecido
          symbol: selectedBot.config.symbol,
          id: selectedBot.id,
          timeframe: selectedBot.config.timeframe || config.timeframe || '1h',
          // Usar os indicadores atualizados do bot (já foram atualizados acima)
          indicators: selectedBot.config.indicators || [],
          // Manter campos legados para compatibilidade, mas usar os indicadores do array
          primaryIndicator: selectedBot.config.indicators?.[0]?.name || selectedBot.config.primaryIndicator || '',
          secondaryIndicator: selectedBot.config.indicators?.find((ind: any) => ind.type === 'secondary')?.name || selectedBot.config.secondaryIndicator || null,
          confirmationIndicator: selectedBot.config.indicators?.find((ind: any) => ind.type === 'confirmation')?.name || selectedBot.config.confirmationIndicator || null
        },
        startDate: startDateStr,
        endDate: endDateStr,
        timeframe: selectedBot.config.timeframe || config.timeframe || '1h',
        totalTrades: backtestResult.totalTrades,
        winningTrades: backtestResult.winningTrades,
        losingTrades: backtestResult.losingTrades,
        winRate: backtestResult.winRate,
        totalProfit: backtestResult.totalProfit,
        totalLoss: backtestResult.totalLoss,
        netProfit: backtestResult.netProfit,
        maxDrawdown: backtestResult.maxDrawdown,
        sharpeRatio: backtestResult.sharpeRatio,
        profitFactor: backtestResult.profitFactor,
        averageWin: backtestResult.averageWin,
        averageLoss: backtestResult.averageLoss,
        largestWin: backtestResult.largestWin,
        largestLoss: backtestResult.largestLoss,
        consecutiveWins: backtestResult.consecutiveWins,
        consecutiveLosses: backtestResult.consecutiveLosses,
        currentStreak: backtestResult.currentStreak,
        status: 'completed',
        createdAt: new Date().toISOString(),
        trades: backtestResult.trades // Incluir trades no resultado
      };
      
      // Adicionar novo resultado e salvar no localStorage
      const updatedResults = [newResult, ...backtestResults];
      setBacktestResults(updatedResults);
      localStorage.setItem('backtestResults', JSON.stringify(updatedResults));
      
      // Incrementar contador após execução bem-sucedida (se não for ilimitado)
      if (limit !== Infinity) {
        incrementBacktestCount();
        setBacktestsRemaining(prev => Math.max(0, prev - 1));
      }
      
      showSnackbar(`Backteste concluído! ${backtestResult.totalTrades} trades executados.`, 'success');
    } catch (error: any) {
      console.error('Erro ao executar backteste:', error);
      showSnackbar(
        error.message || 'Erro ao executar backteste. Verifique se o período e símbolo são válidos.',
        'error'
      );
    } finally {
      setRunningBacktest(false);
    }
  };

  const handleViewResults = (result: BacktestResult) => {
    navigate(`/home/backTest/results/${result.id}`);
  };

  const handleStartOptimization = (result: BacktestResult) => {
    setSelectedResult(result);
    setOptimizationOpen(true);
  };

  const handleDeleteBacktest = (resultId: string) => {
    const result = backtestResults.find(r => r.id === resultId);
    if (result) {
      setDeleteDialog({
        open: true,
        resultId,
        resultName: result.botConfig.name || 'Backtest'
      });
    }
  };

  const confirmDeleteBacktest = () => {
    if (deleteDialog.resultId) {
      const updatedResults = backtestResults.filter(r => r.id !== deleteDialog.resultId);
      setBacktestResults(updatedResults);
      localStorage.setItem('backtestResults', JSON.stringify(updatedResults));
      showSnackbar('Backtest excluído com sucesso!', 'success');
      setDeleteDialog({ open: false, resultId: null, resultName: '' });
    }
  };

  const cancelDeleteBacktest = () => {
    setDeleteDialog({ open: false, resultId: null, resultName: '' });
  };

  const handleRunOptimization = async (optimizationConfig: any) => {
    try {
      setRunningOptimization(true);
      setOptimizationOpen(false);
      
      // Simular otimização com IA
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const newOptimizationResult: OptimizationResult = {
        id: Date.now().toString(),
        parameter: optimizationConfig.parameter,
        originalValue: optimizationConfig.originalValue,
        optimizedValue: optimizationConfig.originalValue * (1 + Math.random() * 0.3 - 0.15),
        improvement: Math.random() * 25 + 5,
        backtestResult: selectedResult!
      };
      
      setOptimizationResults(prev => [newOptimizationResult, ...prev]);
      showSnackbar('Otimização concluída com sucesso!', 'success');
    } catch (error) {
      showSnackbar('Erro ao executar otimização', 'error');
    } finally {
      setRunningOptimization(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Filtrar resultados
  const filteredResults = backtestResults.filter(result => {
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    const matchesSymbol = !symbolFilter || 
      result.botConfig.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
    const matchesDateRange = dateRangeFilter === 'all' || 
      (dateRangeFilter === 'recent' && new Date(result.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateRangeFilter === 'month' && new Date(result.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return matchesStatus && matchesSymbol && matchesDateRange;
  });

  // Estatísticas
  const totalBacktests = backtestResults.length;
  const completedBacktests = backtestResults.filter(r => r.status === 'completed').length;
  const totalNetProfit = backtestResults.reduce((sum, r) => sum + r.netProfit, 0);
  const averageWinRate = backtestResults.length > 0 
    ? backtestResults.reduce((sum, r) => sum + r.winRate, 0) / backtestResults.length 
    : 0;

  const symbols = Array.from(new Set(backtestResults.map(r => r.botConfig.symbol)));

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Backteste de Estratégias
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<AutoFixHigh />}
              onClick={() => setOptimizationOpen(true)}
              disabled={backtestResults.length === 0}
            >
              Otimização IA
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStartBacktest}
              disabled={runningBacktest || (getBacktestLimit !== Infinity && backtestsRemaining <= 0)}
            >
              Novo Backteste
            </Button>
          </Box>
        </Box>

        {/* Indicador de Backtests Restantes - para usuários com limite */}
        {getBacktestLimit !== Infinity && (
          <Alert 
            severity={backtestsRemaining > (getBacktestLimit * 0.3) ? 'info' : backtestsRemaining > 0 ? 'warning' : 'error'}
            icon={<Info />}
            sx={{ mb: 3 }}
            action={
              backtestsRemaining === 0 && (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => navigate('/home/payment')}
                >
                  Atualizar Plano
                </Button>
              )
            }
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" component="span">
                {backtestsRemaining > 0 ? (
                  <>
                    <strong>{backtestsRemaining}</strong> de <strong>{getBacktestLimit}</strong> backtests restantes este mês ({user?.currentPlan || 'Sem plano'})
                  </>
                ) : (
                  <>
                    Você atingiu o limite de <strong>{getBacktestLimit}</strong> backtests por mês do plano {user?.currentPlan || 'atual'}. Atualize seu plano para mais backtests!
                  </>
                )}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Estatísticas */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {totalBacktests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Backtestes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {completedBacktests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Concluídos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography 
                  variant="h6" 
                  color={totalNetProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  ${totalNetProfit.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lucro Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {averageWinRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taxa de Acerto Média
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
                <FormControl fullWidth>
                  <InputLabel id="status-filter-label" shrink={true}>Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    notched
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="running">Executando</MenuItem>
                    <MenuItem value="completed">Concluído</MenuItem>
                    <MenuItem value="failed">Falhou</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="symbol-filter-label" shrink={true}>Símbolo</InputLabel>
                  <Select
                    labelId="symbol-filter-label"
                    label="Símbolo"
                    value={symbolFilter}
                    onChange={(e) => setSymbolFilter(e.target.value)}
                    notched
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {symbols.map(symbol => (
                      <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="period-filter-label" shrink={true}>Período</InputLabel>
                  <Select
                    labelId="period-filter-label"
                    label="Período"
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                    notched
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="recent">Últimos 7 dias</MenuItem>
                    <MenuItem value="month">Último mês</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadBacktestResults}
                  disabled={loading}
                  fullWidth
                >
                  Atualizar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Resultados" icon={<Assessment />} />
          <Tab label="Otimizações" icon={<AutoFixHigh />} />
          <Tab label="Histórico" icon={<History />} />
        </Tabs>
      </Card>

      {/* Conteúdo das Tabs */}
      {activeTab === 0 && (
        <Box mt={3}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <LinearProgress sx={{ width: '100%' }} />
            </Box>
          ) : filteredResults.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhum backteste encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Execute seu primeiro backteste para começar
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleStartBacktest}
                    sx={{ mt: 2 }}
                  >
                    Executar Primeiro Backteste
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredResults.map((result) => (
                <Grid item xs={12} md={6} lg={4} key={result.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">
                          {result.botConfig.name}
                        </Typography>
                        <Chip 
                          label={result.status} 
                          color={result.status === 'completed' ? 'success' : 
                                 result.status === 'running' ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {result.botConfig.symbol} • {result.startDate} - {result.endDate}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Trades
                          </Typography>
                          <Typography variant="h6">
                            {result.totalTrades}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Taxa de Acerto
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {result.winRate.toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Lucro Líquido
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={result.netProfit >= 0 ? 'success.main' : 'error.main'}
                          >
                            ${result.netProfit.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Sharpe Ratio
                          </Typography>
                          <Typography variant="h6">
                            {result.sharpeRatio.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box display="flex" gap={1} mt={2} alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Timeline />}
                          onClick={() => handleViewResults(result)}
                          sx={{ flex: 1 }}
                        >
                          Ver Detalhes
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AutoFixHigh />}
                          onClick={() => handleStartOptimization(result)}
                          sx={{ flex: 1 }}
                        >
                          Otimizar
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteBacktest(result.id)}
                          title="Excluir backtest"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Otimizações com Inteligência Artificial
          </Typography>
          {optimizationResults.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhuma otimização realizada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Execute otimizações para encontrar os melhores parâmetros
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Parâmetro</TableCell>
                    <TableCell>Valor Original</TableCell>
                    <TableCell>Valor Otimizado</TableCell>
                    <TableCell>Melhoria</TableCell>
                    <TableCell>Estratégia</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {optimizationResults.map((opt) => (
                    <TableRow key={opt.id}>
                      <TableCell>{opt.parameter}</TableCell>
                      <TableCell>{opt.originalValue.toFixed(2)}</TableCell>
                      <TableCell>{opt.optimizedValue.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`+${opt.improvement.toFixed(1)}%`}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{opt.backtestResult.botConfig.name}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          Aplicar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Histórico de Backtestes
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Estratégia</TableCell>
                  <TableCell>Símbolo</TableCell>
                  <TableCell>Período</TableCell>
                  <TableCell>Trades</TableCell>
                  <TableCell>Taxa de Acerto</TableCell>
                  <TableCell>Lucro Líquido</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backtestResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.botConfig.name}</TableCell>
                    <TableCell>{result.botConfig.symbol}</TableCell>
                    <TableCell>{result.startDate} - {result.endDate}</TableCell>
                    <TableCell>{result.totalTrades}</TableCell>
                    <TableCell>{result.winRate.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Typography 
                        color={result.netProfit >= 0 ? 'success.main' : 'error.main'}
                      >
                        ${result.netProfit.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={result.status} 
                        color={result.status === 'completed' ? 'success' : 
                               result.status === 'running' ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(result.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Dialog de Configuração */}
      <BacktestConfig
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onRun={handleRunBacktest}
        bots={bots}
      />

      {/* Dialog de Otimização */}
      <OptimizationPanel
        open={optimizationOpen}
        onClose={() => setOptimizationOpen(false)}
        onRun={handleRunOptimization}
        selectedResult={selectedResult}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDeleteBacktest}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Delete color="error" />
            <Typography variant="h6" fontWeight="bold">
              Confirmar Exclusão
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Typography variant="body1" gutterBottom>
              Tem certeza que deseja excluir o backtest:
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
              {deleteDialog.resultName}
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Esta ação não pode ser desfeita. Todos os dados e resultados deste backtest serão permanentemente removidos.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteBacktest} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteBacktest}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Loading Centralizado */}
      <Dialog
        open={runningBacktest}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            textAlign: 'center',
            p: 3
          }
        }}
      >
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress size={60} />
            <Typography variant="h6" gutterBottom>
              Executando Backtest
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aguarde até o fim do backtest
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Isso pode levar alguns minutos. Por favor, aguarde.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar para mensagens de sucesso/erro */}
      <Snackbar
        open={snackbar.open && !runningBacktest}
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

export default BackTestPage;
