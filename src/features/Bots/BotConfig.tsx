import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Typography,
  Divider,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Alert,
  Container,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Settings,
  Security,
  Analytics,
  Info,
  ArrowBack,
  Save,
  Add,
  Remove,
  Timeline,
  ShowChart,
  AccountBalance,
  Warning,
  CheckCircle,
  AutoAwesome,
  Close,
  Help,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import type { BotConfig, IndicatorType, EntryCondition, ExitCondition } from '../../types/bot';
import { INDICATOR_CONDITIONS } from '../../types/bot';

interface BotConfigProps {
  initialConfig?: BotConfig;
  isEdit?: boolean;
  onSave: (config: BotConfig) => Promise<void>;
  onCancel: () => void;
}

const BotConfig: React.FC<BotConfigProps> = ({ 
  initialConfig,
  isEdit = false,
  onSave,
  onCancel
}) => {
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

  const [activeTab, setActiveTab] = useState(0);
  const [indicatorsSubTab, setIndicatorsSubTab] = useState(0); // 0 = Indicadores Técnicos, 1 = Estratégia
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [strategyConfigOpen, setStrategyConfigOpen] = useState(false);
  const [strategyConfig, setStrategyConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStrategy, setTutorialStrategy] = useState<string | null>(null);
  // Função para garantir que os valores padrão estejam presentes
  const ensureDefaultConfig = (config: BotConfig | null): BotConfig => {
    if (!config) {
      return {
        id: '',
        name: '',
        environment: 'virtual',
        symbol: 'BTCUSDT',
        timeframe: '1h',
        isActive: false,
        startDate: new Date().toISOString().split('T')[0],
        operationMode: 'immediate',
        operationTime: undefined,
        indicators: [],
        indicatorLogic: {
          primary: 'all',
          confirmation: 'all'
        },
        entryMethod: {
          type: 'market',
          condition: 'crossover',
          value: undefined
        },
        exitMethod: {
          type: 'market',
          condition: 'crossover',
          value: undefined
        },
        positionSizing: {
          type: 'fixed',
          value: 100,
          maxPosition: 1000
        },
        partialExits: {
          enabled: false,
          levels: []
        },
        stopLoss: {
          enabled: true,
          type: 'fixed',
          value: 2
        },
        takeProfit: {
          enabled: true,
          type: 'fixed',
          value: 4
        },
        riskManagement: {
          maxDailyLoss: 5,
          maxDrawdown: 10,
          maxOpenPositions: 3
        },
        advancedSettings: {
          timeFilter: {
            enabled: false,
            startTime: '',
            endTime: ''
          },
          newsFilter: {
            enabled: false,
            avoidNewsMinutes: 30
          },
          correlationFilter: {
            enabled: false,
            maxCorrelation: 0.7
          },
          entryExecution: {
            mode: 'candle_close' as 'candle_close' | 'price_condition'
          },
          exitExecution: {
            mode: 'candle_close' as 'candle_close' | 'price_condition'
          }
        }
      };
    }

    // Garantir que os novos campos existam
    return {
      ...config,
      advancedSettings: {
        ...config.advancedSettings,
        entryExecution: config.advancedSettings.entryExecution || {
          mode: 'candle_close' as 'candle_close' | 'price_condition'
        },
        exitExecution: config.advancedSettings.exitExecution || {
          mode: 'candle_close' as 'candle_close' | 'price_condition'
        }
      }
    };
  };

  const [config, setConfig] = useState<BotConfig>(
    ensureDefaultConfig(initialConfig)
  );

  const indicators: IndicatorType[] = [
    'SMA', 'EMA', 'WMA', 'HMA', 'HILO',
    'RSI', 'MACD', 'Stochastic', 
    'BollingerBands', 'IchimokuCloud', 'WilliamsR', 'CCI', 'ADX',
    'ATR', 'ParabolicSAR', 'OBV', 'Volume'
  ];

  // Função para obter as condições baseadas no indicador selecionado
  const getIndicatorConditions = (indicatorName: string) => {
    return INDICATOR_CONDITIONS[indicatorName] || {
      entryConditions: ['crossover', 'crossunder', 'above', 'below'],
      exitConditions: ['crossover', 'crossunder', 'above', 'below', 'time', 'profit', 'loss'],
      description: 'Indicador genérico'
    };
  };

  // Obter condições atuais baseadas no indicador principal
  const currentIndicatorConditions = getIndicatorConditions(
    config.indicators.find(i => i.type === 'primary')?.name || 'RSI'
  );

  // Função para adicionar novo indicador
  const addIndicator = () => {
    const newIndicator = {
      name: 'RSI',
      type: 'confirmation' as const,
      parameters: { period: 14, overbought: 70, oversold: 30 },
      description: 'Índice de Força Relativa',
      entryMethod: {
        type: 'market' as const,
        condition: 'crossover',
        value: undefined
      },
      exitMethod: {
        type: 'market' as const,
        condition: 'crossover',
        value: undefined
      }
    };
    
    setConfig(prev => ({
      ...prev,
      indicators: [...prev.indicators, newIndicator]
    }));
  };

  // Função para remover indicador
  const removeIndicator = (index: number) => {
    setConfig(prev => ({
      ...prev,
      indicators: prev.indicators.filter((_, i) => i !== index)
    }));
  };

  // Função para atualizar indicador
  const updateIndicator = (index: number, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      indicators: prev.indicators.map((indicator, i) => 
        i === index ? { ...indicator, [field]: value } : indicator
      )
    }));
  };

  // Função para atualizar parâmetro do indicador
  const updateIndicatorParameter = (index: number, paramName: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      indicators: prev.indicators.map((indicator, i) => 
        i === index ? { 
          ...indicator, 
          parameters: { ...indicator.parameters, [paramName]: value }
        } : indicator
      )
    }));
  };

  // Função para obter parâmetros padrão de um indicador
  const getDefaultParameters = (indicatorName: string) => {
    const defaults: Record<string, Record<string, any>> = {
      'RSI': { period: 14, overbought: 70, oversold: 30 },
      'MACD': { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      'SMA': { period: 20 },
      'EMA': { period: 20 },
      'WMA': { period: 20 },
      'HMA': { period: 20 },
      'HILO': { period: 20, multiplier: 2 },
      'Stochastic': { kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
      'BollingerBands': { period: 20, standardDeviations: 2 },
      'IchimokuCloud': { conversionPeriod: 9, basePeriod: 26, spanPeriod: 52, displacement: 26 },
      'WilliamsR': { period: 14, overbought: -20, oversold: -80 },
      'CCI': { period: 20, overbought: 100, oversold: -100 },
      'ADX': { period: 14, threshold: 25 },
      'ATR': { period: 14 },
      'ParabolicSAR': { acceleration: 0.02, maximum: 0.2 },
      'OBV': { period: 20 },
      'Volume': { period: 20 }
    };
    
    return defaults[indicatorName] || {};
  };

  // Função para atualizar as condições quando o indicador principal mudar
  const handlePrimaryIndicatorChange = (indicatorName: string) => {
    const newConditions = getIndicatorConditions(indicatorName);
    setConfig(prev => ({
      ...prev,
      entryMethod: {
        ...prev.entryMethod,
        condition: newConditions.entryConditions[0] || 'crossover'
      },
      exitMethod: {
        ...prev.exitMethod,
        condition: newConditions.exitConditions[0] || 'crossover'
      }
    }));
  };

  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT'];

  // Estratégias consagradas
  const strategies = [
    {
      id: 'moving_average_crossover',
      name: 'Cruzamento de Médias',
      description: 'Estratégia clássica que usa o cruzamento de múltiplas médias móveis para gerar sinais de compra e venda.',
      icon: <Timeline />,
      defaultConfig: {
        movingAverages: [
          { type: 'EMA', period: 9 },
          { type: 'EMA', period: 21 }
        ],
        entryCondition: 'crossover',
        exitCondition: 'crossunder'
      }
    },
    {
      id: 'rsi_oversold_overbought',
      name: 'RSI Sobrecompra/Sobrevenda',
      description: 'Compra quando RSI está em sobrevenda e vende quando está em sobrecompra.',
      icon: <ShowChart />,
      defaultConfig: {
        period: 14,
        oversold: 30,
        overbought: 70,
        entryCondition: 'oversold',
        exitCondition: 'overbought'
      }
    },
    {
      id: 'macd_crossover',
      name: 'MACD Crossover',
      description: 'Usa o cruzamento da linha MACD com a linha de sinal para identificar tendências.',
      icon: <TrendingUp />,
      defaultConfig: {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        entryCondition: 'crossover',
        exitCondition: 'crossunder'
      }
    },
    {
      id: 'bollinger_bands',
      name: 'Bollinger Bands',
      description: 'Compra quando o preço toca a banda inferior e vende quando toca a banda superior.',
      icon: <Analytics />,
      defaultConfig: {
        period: 20,
        standardDeviations: 2,
        entryCondition: 'breakdown',
        exitCondition: 'breakout'
      }
    },
    {
      id: 'stochastic_oscillator',
      name: 'Oscilador Estocástico',
      description: 'Identifica condições de sobrecompra e sobrevenda usando o oscilador estocástico.',
      icon: <AutoAwesome />,
      defaultConfig: {
        kPeriod: 14,
        dPeriod: 3,
        oversold: 20,
        overbought: 80,
        entryCondition: 'oversold',
        exitCondition: 'overbought'
      }
    },
    {
      id: 'golden_cross',
      name: 'Golden Cross',
      description: 'Estratégia de tendência que usa o cruzamento de média móvel de 50 períodos com 200 períodos.',
      icon: <TrendingUp />,
      defaultConfig: {
        fastPeriod: 50,
        slowPeriod: 200,
        fastType: 'SMA',
        slowType: 'SMA',
        entryCondition: 'crossover',
        exitCondition: 'crossunder'
      }
    }
  ];

  // Conteúdo de tutorial para cada estratégia
  const getStrategyTutorial = (strategyId: string) => {
    const tutorials: Record<string, { title: string; content: string[] }> = {
      'moving_average_crossover': {
        title: 'Cruzamento de Médias',
        content: [
          'Esta estratégia utiliza múltiplas médias móveis com períodos diferentes para identificar sinais de compra e venda.',
          'Sinal de COMPRA: Quando uma média móvel de período menor cruza acima de uma média móvel de período maior (crossover).',
          'Sinal de VENDA: Quando uma média móvel de período menor cruza abaixo de uma média móvel de período maior (crossunder).',
          'Você pode configurar quantas médias móveis desejar, permitindo criar estratégias mais complexas e personalizadas.',
          'A estratégia funciona melhor em mercados com tendência definida. Em mercados laterais (ranging), pode gerar muitos sinais falsos.',
          'Parâmetros recomendados:',
          '  • Mínimo 2 médias móveis',
          '  • Períodos típicos: 9, 21, 50, 200',
          '  • Tipos comuns: EMA (mais responsiva) ou SMA (mais suave)',
          '  • Ordene as médias do menor para o maior período para melhor visualização'
        ]
      },
      'rsi_oversold_overbought': {
        title: 'RSI Sobrecompra/Sobrevenda',
        content: [
          'O RSI (Relative Strength Index) é um oscilador que varia de 0 a 100 e identifica condições de sobrecompra e sobrevenda.',
          'Quando o RSI cai abaixo de 30 (nível de sobrevenda), o ativo está potencialmente barato demais e pode estar pronto para uma reversão para cima - sinal de COMPRA.',
          'Quando o RSI sobe acima de 70 (nível de sobrecompra), o ativo está potencialmente caro demais e pode estar pronto para uma reversão para baixo - sinal de VENDA.',
          'Esta estratégia funciona bem em mercados laterais ou com reversões frequentes.',
          'Parâmetros recomendados:',
          '  • Período: 14 (padrão)',
          '  • Nível de sobrevenda: 30 (pode variar entre 20-30)',
          '  • Nível de sobrecompra: 70 (pode variar entre 70-80)',
          'Dica: Em tendências fortes, o RSI pode permanecer em sobrecompra/sobrevenda por longos períodos.'
        ]
      },
      'macd_crossover': {
        title: 'MACD Crossover',
        content: [
          'O MACD (Moving Average Convergence Divergence) é um indicador de momentum que mostra a relação entre duas médias móveis exponenciais.',
          'O MACD é calculado subtraindo a média móvel exponencial de 26 períodos da média móvel exponencial de 12 períodos.',
          'Uma linha de sinal (geralmente EMA de 9 períodos do MACD) é então plotada sobre o MACD.',
          'Sinal de COMPRA: Quando a linha MACD cruza acima da linha de sinal (crossover).',
          'Sinal de VENDA: Quando a linha MACD cruza abaixo da linha de sinal (crossunder).',
          'Esta estratégia é eficaz para identificar mudanças na força, direção, momentum e duração de uma tendência.',
          'Parâmetros recomendados:',
          '  • Período rápido: 12',
          '  • Período lento: 26',
          '  • Período do sinal: 9',
          'O histograma do MACD (diferença entre MACD e linha de sinal) também pode ser usado para confirmar sinais.'
        ]
      },
      'bollinger_bands': {
        title: 'Bollinger Bands',
        content: [
          'As Bandas de Bollinger consistem em três linhas: uma média móvel central (geralmente SMA de 20 períodos) e duas bandas externas que representam desvios padrão.',
          'As bandas se expandem quando a volatilidade aumenta e se contraem quando a volatilidade diminui.',
          'Sinal de COMPRA: Quando o preço toca ou rompe a banda inferior (breakdown), indicando que o ativo pode estar sobrevendido.',
          'Sinal de VENDA: Quando o preço toca ou rompe a banda superior (breakout), indicando que o ativo pode estar sobrecomprado.',
          'Esta estratégia funciona melhor em mercados com volatilidade constante e tendências laterais.',
          'Parâmetros recomendados:',
          '  • Período: 20 (padrão)',
          '  • Desvios padrão: 2 (padrão)',
          '  • Pode ajustar para 1.5 (mais sensível) ou 2.5 (mais conservador)',
          'Dica: Quando as bandas se estreitam (squeeze), geralmente precede um movimento de preço significativo.'
        ]
      },
      'stochastic_oscillator': {
        title: 'Oscilador Estocástico',
        content: [
          'O Oscilador Estocástico compara o preço de fechamento de um ativo com sua faixa de preços em um determinado período.',
          'O indicador gera dois valores: %K (linha rápida) e %D (linha lenta, média móvel de %K).',
          'O oscilador varia de 0 a 100, onde valores acima de 80 indicam sobrecompra e valores abaixo de 20 indicam sobrevenda.',
          'Sinal de COMPRA: Quando o %K cruza acima do %D na zona de sobrevenda (abaixo de 20).',
          'Sinal de VENDA: Quando o %K cruza abaixo do %D na zona de sobrecompra (acima de 80).',
          'Esta estratégia é útil para identificar pontos de reversão em mercados laterais.',
          'Parâmetros recomendados:',
          '  • Período K: 14 (padrão)',
          '  • Período D: 3 (padrão)',
          '  • Nível de sobrevenda: 20',
          '  • Nível de sobrecompra: 80',
          'Dica: Em tendências fortes, o estocástico pode permanecer em sobrecompra/sobrevenda por longos períodos.'
        ]
      },
      'golden_cross': {
        title: 'Golden Cross',
        content: [
          'A Golden Cross (Cruzamento Dourado) é uma estratégia de tendência de longo prazo que usa médias móveis de 50 e 200 períodos.',
          'É considerada um dos sinais mais confiáveis de reversão de tendência de baixa para alta.',
          'Sinal de COMPRA: Quando a média móvel de 50 períodos cruza acima da média móvel de 200 períodos (crossover).',
          'Sinal de VENDA: Quando a média móvel de 50 períodos cruza abaixo da média móvel de 200 períodos (crossunder).',
          'Esta estratégia é ideal para investimentos de longo prazo e funciona melhor em timeframes maiores (4h, 1d).',
          'Parâmetros recomendados:',
          '  • Média rápida: 50 períodos (SMA)',
          '  • Média lenta: 200 períodos (SMA)',
          '  • Timeframe: 4h ou 1d para melhor precisão',
          'A Golden Cross é o oposto da "Death Cross" (cruzamento da morte), que ocorre quando a média de 50 cruza abaixo da de 200.',
          'Dica: Esta estratégia gera poucos sinais, mas com alta confiabilidade quando ocorrem.'
        ]
      }
    };
    return tutorials[strategyId] || { title: 'Estratégia', content: ['Tutorial não disponível.'] };
  };

  const applyStrategy = (strategy: typeof strategies[0], customConfig?: any) => {
    const configToUse = customConfig || strategy.defaultConfig;
    
    // Limpar indicadores existentes
    let newIndicators: any[] = [];

    if (strategy.id === 'moving_average_crossover') {
      // Adicionar múltiplas médias móveis
      if (configToUse.movingAverages && Array.isArray(configToUse.movingAverages)) {
        newIndicators = configToUse.movingAverages.map((ma: any, index: number) => ({
          name: ma.type,
          type: 'primary' as const,
          parameters: { period: ma.period },
          description: `Média móvel ${ma.type} (${ma.period} períodos)`,
          entryMethod: {
            type: 'market' as const,
            condition: configToUse.entryCondition || 'crossover',
            value: undefined
          },
          exitMethod: {
            type: 'market' as const,
            condition: configToUse.exitCondition || 'crossunder',
            value: undefined
          }
        }));
      } else {
        // Fallback para configuração antiga (compatibilidade)
        newIndicators = [
          {
            name: configToUse.fastType || 'EMA',
            type: 'primary' as const,
            parameters: { period: configToUse.fastPeriod || 9 },
            description: `Média móvel rápida (${configToUse.fastPeriod || 9} períodos)`,
            entryMethod: {
              type: 'market' as const,
              condition: configToUse.entryCondition || 'crossover',
              value: undefined
            },
            exitMethod: {
              type: 'market' as const,
              condition: configToUse.exitCondition || 'crossunder',
              value: undefined
            }
          },
          {
            name: configToUse.slowType || 'EMA',
            type: 'primary' as const,
            parameters: { period: configToUse.slowPeriod || 21 },
            description: `Média móvel lenta (${configToUse.slowPeriod || 21} períodos)`,
            entryMethod: {
              type: 'market' as const,
              condition: configToUse.entryCondition || 'crossover',
              value: undefined
            },
            exitMethod: {
              type: 'market' as const,
              condition: configToUse.exitCondition || 'crossunder',
              value: undefined
            }
          }
        ];
      }
    } else if (strategy.id === 'golden_cross') {
      // Golden Cross mantém a lógica antiga
      newIndicators = [
        {
          name: configToUse.fastType,
          type: 'primary' as const,
          parameters: { period: configToUse.fastPeriod },
          description: `Média móvel rápida (${configToUse.fastPeriod} períodos)`,
          entryMethod: {
            type: 'market' as const,
            condition: configToUse.entryCondition,
            value: undefined
          },
          exitMethod: {
            type: 'market' as const,
            condition: configToUse.exitCondition,
            value: undefined
          }
        },
        {
          name: configToUse.slowType,
          type: 'primary' as const,
          parameters: { period: configToUse.slowPeriod },
          description: `Média móvel lenta (${configToUse.slowPeriod} períodos)`,
          entryMethod: {
            type: 'market' as const,
            condition: configToUse.entryCondition,
            value: undefined
          },
          exitMethod: {
            type: 'market' as const,
            condition: configToUse.exitCondition,
            value: undefined
          }
        }
      ];
    } else if (strategy.id === 'rsi_oversold_overbought') {
      newIndicators = [{
        name: 'RSI',
        type: 'primary' as const,
        parameters: {
          period: configToUse.period,
          oversold: configToUse.oversold,
          overbought: configToUse.overbought
        },
        description: 'Índice de Força Relativa',
        entryMethod: {
          type: 'market' as const,
          condition: configToUse.entryCondition,
          value: undefined
        },
        exitMethod: {
          type: 'market' as const,
          condition: configToUse.exitCondition,
          value: undefined
        }
      }];
    } else if (strategy.id === 'macd_crossover') {
      newIndicators = [{
        name: 'MACD',
        type: 'primary' as const,
        parameters: {
          fastPeriod: configToUse.fastPeriod,
          slowPeriod: configToUse.slowPeriod,
          signalPeriod: configToUse.signalPeriod
        },
        description: 'Convergência/Divergência de Médias Móveis',
        entryMethod: {
          type: 'market' as const,
          condition: configToUse.entryCondition,
          value: undefined
        },
        exitMethod: {
          type: 'market' as const,
          condition: configToUse.exitCondition,
          value: undefined
        }
      }];
    } else if (strategy.id === 'bollinger_bands') {
      newIndicators = [{
        name: 'BollingerBands',
        type: 'primary' as const,
        parameters: {
          period: configToUse.period,
          standardDeviations: configToUse.standardDeviations
        },
        description: 'Bandas de Bollinger',
        entryMethod: {
          type: 'market' as const,
          condition: configToUse.entryCondition,
          value: undefined
        },
        exitMethod: {
          type: 'market' as const,
          condition: configToUse.exitCondition,
          value: undefined
        }
      }];
    } else if (strategy.id === 'stochastic_oscillator') {
      newIndicators = [{
        name: 'Stochastic',
        type: 'primary' as const,
        parameters: {
          kPeriod: configToUse.kPeriod,
          dPeriod: configToUse.dPeriod,
          oversold: configToUse.oversold,
          overbought: configToUse.overbought
        },
        description: 'Oscilador Estocástico',
        entryMethod: {
          type: 'market' as const,
          condition: configToUse.entryCondition,
          value: undefined
        },
        exitMethod: {
          type: 'market' as const,
          condition: configToUse.exitCondition,
          value: undefined
        }
      }];
    }

    setConfig(prev => ({
      ...prev,
      strategyId: strategy.id,
      strategyName: strategy.name,
      indicators: newIndicators,
      indicatorLogic: {
        primary: newIndicators.filter(i => i.type === 'primary').length > 1 ? 'all' : 'all',
        confirmation: 'all'
      }
    }));

    setStrategyConfigOpen(false);
    setSelectedStrategy(null);
    setStrategyConfig(null);
    // Não mudar a aba quando aplicar estratégia diretamente - manter na aba atual
  };

  // Função para verificar se uma estratégia está ativa
  const isStrategyActive = (strategyId: string): boolean => {
    if (!config.indicators || config.indicators.length === 0) {
      return false;
    }

    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return false;

    // Verificar estratégia de Cruzamento de Médias
    if (strategyId === 'moving_average_crossover') {
      const movingAverages = strategy.defaultConfig.movingAverages || [];
      if (movingAverages.length === 0) return false;

      // Verificar se todas as médias móveis da estratégia estão presentes
      const activeMAs = config.indicators.filter(ind => 
        ind.type === 'primary' && 
        (ind.name === 'SMA' || ind.name === 'EMA' || ind.name === 'WMA' || ind.name === 'HMA')
      );

      if (activeMAs.length < 2) return false;

      // Verificar se os períodos e tipos correspondem
      const strategyMAs = movingAverages.map((ma: any) => ({
        type: ma.type,
        period: ma.period
      }));

      const configMAs = activeMAs.map(ind => ({
        type: ind.name,
        period: ind.parameters?.period
      }));

      // Verificar se há correspondência entre as médias
      return strategyMAs.every(stratMA => 
        configMAs.some(configMA => 
          configMA.type === stratMA.type && configMA.period === stratMA.period
        )
      );
    }

    // Verificar outras estratégias
    if (strategyId === 'rsi_oversold_overbought') {
      const rsiIndicator = config.indicators.find(ind => 
        ind.type === 'primary' && ind.name === 'RSI'
      );
      return rsiIndicator !== undefined;
    }

    if (strategyId === 'macd_crossover') {
      const macdIndicator = config.indicators.find(ind => 
        ind.type === 'primary' && ind.name === 'MACD'
      );
      return macdIndicator !== undefined;
    }

    if (strategyId === 'bollinger_bands') {
      const bbIndicator = config.indicators.find(ind => 
        ind.type === 'primary' && ind.name === 'BollingerBands'
      );
      return bbIndicator !== undefined;
    }

    if (strategyId === 'stochastic_oscillator') {
      const stochIndicator = config.indicators.find(ind => 
        ind.type === 'primary' && ind.name === 'Stochastic'
      );
      return stochIndicator !== undefined;
    }

    if (strategyId === 'golden_cross') {
      const primaryIndicators = config.indicators.filter(ind => ind.type === 'primary');
      const movingAverages = primaryIndicators.filter(ind => 
        ind.name === 'SMA' || ind.name === 'EMA' || ind.name === 'WMA' || ind.name === 'HMA'
      );
      // Golden Cross precisa de 2 médias móveis
      return movingAverages.length >= 2;
    }

    return false;
  };

  // Função para desativar uma estratégia
  const deactivateStrategy = (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    // Remover indicadores relacionados à estratégia
    if (strategyId === 'moving_average_crossover') {
      // Remover todas as médias móveis primárias
      setConfig(prev => ({
        ...prev,
        strategyId: undefined,
        strategyName: undefined,
        indicators: prev.indicators.filter(ind => 
          !(ind.type === 'primary' && 
            (ind.name === 'SMA' || ind.name === 'EMA' || ind.name === 'WMA' || ind.name === 'HMA'))
        )
      }));
    } else if (strategyId === 'rsi_oversold_overbought') {
      setConfig(prev => ({
        ...prev,
        strategyId: undefined,
        strategyName: undefined,
        indicators: prev.indicators.filter(ind => 
          !(ind.type === 'primary' && ind.name === 'RSI')
        )
      }));
    } else if (strategyId === 'macd_crossover') {
      setConfig(prev => ({
        ...prev,
        strategyId: undefined,
        strategyName: undefined,
        indicators: prev.indicators.filter(ind => 
          !(ind.type === 'primary' && ind.name === 'MACD')
        )
      }));
    } else if (strategyId === 'bollinger_bands') {
      setConfig(prev => ({
        ...prev,
        strategyId: undefined,
        strategyName: undefined,
        indicators: prev.indicators.filter(ind => 
          !(ind.type === 'primary' && ind.name === 'BollingerBands')
        )
      }));
    } else if (strategyId === 'stochastic_oscillator') {
      setConfig(prev => ({
        ...prev,
        strategyId: undefined,
        strategyName: undefined,
        indicators: prev.indicators.filter(ind => 
          !(ind.type === 'primary' && ind.name === 'Stochastic')
        )
      }));
    } else if (strategyId === 'golden_cross') {
      // Remover médias móveis relacionadas ao Golden Cross
      setConfig(prev => ({
        ...prev,
        strategyId: undefined,
        strategyName: undefined,
        indicators: prev.indicators.filter(ind => 
          !(ind.type === 'primary' && 
            (ind.name === 'SMA' || ind.name === 'EMA' || ind.name === 'WMA' || ind.name === 'HMA'))
        )
      }));
    }
  };

  const handleSave = async () => {
    if (!config.name.trim()) {
      alert('Por favor, insira um nome para o robô');
      return;
    }
    setSaving(true);
    try {
      await onSave(config);
    } catch (error) {
      console.error('Erro ao salvar robô:', error);
    } finally {
      setSaving(false);
    }
  };

  const addPartialExit = () => {
    setConfig(prev => ({
      ...prev,
      partialExits: {
        ...prev.partialExits,
        levels: [...prev.partialExits.levels, { percentage: 0, quantity: 0 }]
      }
    }));
  };

  const removePartialExit = (index: number) => {
    setConfig(prev => ({
      ...prev,
      partialExits: {
        ...prev.partialExits,
        levels: prev.partialExits.levels.filter((_, i) => i !== index)
      }
    }));
  };

  const updatePartialExit = (index: number, field: 'percentage' | 'quantity', value: number) => {
    setConfig(prev => ({
      ...prev,
      partialExits: {
        ...prev.partialExits,
        levels: prev.partialExits.levels.map((level, i) => 
          i === index ? { ...level, [field]: value } : level
        )
      }
    }));
  };

  const tabs = [
    { label: 'Informações Básicas', icon: <Settings /> },
    { label: 'Indicadores', icon: <ShowChart /> },
    { label: 'Gestão de Risco', icon: <Security /> },
    { label: 'Configurações Avançadas', icon: <Analytics /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
              <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informações Básicas
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Robô"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Ambiente</InputLabel>
                  <Select
                    value={config.environment}
                    label="Ambiente"
                      onChange={(e) => {
                        const newEnvironment = e.target.value as 'real' | 'virtual';
                        // Bloquear seleção de ambiente real para usuários sem plano
                        if (!hasActivePlan && newEnvironment === 'real') {
                          return; // Não permite mudar para real
                        }
                        setConfig(prev => ({ ...prev, environment: newEnvironment }));
                      }}
                      disabled={!hasActivePlan && !isEdit} // Desabilitar se não tem plano e não está editando
                  >
                    <MenuItem value="virtual">Virtual</MenuItem>
                      <MenuItem 
                        value="real"
                        disabled={!hasActivePlan}
                      >
                        Real {!hasActivePlan && '(Requer plano)'}
                      </MenuItem>
                  </Select>
                    {!hasActivePlan && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          Usuários sem plano não podem criar robôs em ambiente real. Assine um plano para usar robôs reais.
                        </Typography>
                      </Alert>
                    )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Par</InputLabel>
                  <Select
                    value={config.symbol}
                    label="Par"
                    onChange={(e) => setConfig(prev => ({ ...prev, symbol: e.target.value }))}
                  >
                    {symbols.map(symbol => (
                      <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tempo Gráfico</InputLabel>
                  <Select
                    value={config.timeframe}
                    label="Tempo Gráfico"
                    onChange={(e) => setConfig(prev => ({ ...prev, timeframe: e.target.value }))}
                  >
                    <MenuItem value="1m">1 minuto</MenuItem>
                    <MenuItem value="5m">5 minutos</MenuItem>
                    <MenuItem value="15m">15 minutos</MenuItem>
                    <MenuItem value="30m">30 minutos</MenuItem>
                    <MenuItem value="1h">1 hora</MenuItem>
                    <MenuItem value="4h">4 horas</MenuItem>
                    <MenuItem value="1d">1 dia</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data de Início"
                  value={config.startDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Modo de Operação</InputLabel>
                  <Select
                    value={config.operationMode}
                    label="Modo de Operação"
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      operationMode: e.target.value as 'immediate' | 'scheduled',
                      operationTime: e.target.value === 'immediate' ? undefined : {
                        startTime: '09:00',
                        endTime: '17:00',
                        daysOfWeek: [1, 2, 3, 4, 5]
                      }
                    }))}
                  >
                    <MenuItem value="immediate">Operação Imediata</MenuItem>
                    <MenuItem value="scheduled">Horário Definido</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {config.operationMode === 'scheduled' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Horário de Início"
                      value={config.operationTime?.startTime || '09:00'}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        operationTime: {
                          ...prev.operationTime!,
                          startTime: e.target.value
                        }
                      }))}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Horário de Término"
                      value={config.operationTime?.endTime || '17:00'}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        operationTime: {
                          ...prev.operationTime!,
                          endTime: e.target.value
                        }
                      }))}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Dias da Semana
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                        <Chip
                          key={day}
                          label={day}
                          color={config.operationTime?.daysOfWeek.includes(index) ? 'primary' : 'default'}
                          variant={config.operationTime?.daysOfWeek.includes(index) ? 'filled' : 'outlined'}
                          onClick={() => {
                            const currentDays = config.operationTime?.daysOfWeek || [];
                            const newDays = currentDays.includes(index)
                              ? currentDays.filter(d => d !== index)
                              : [...currentDays, index];
                            setConfig(prev => ({
                              ...prev,
                              operationTime: {
                                ...prev.operationTime!,
                                daysOfWeek: newDays
                              }
                            }));
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            {/* Sub-tabs para Indicadores */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={indicatorsSubTab} 
                onChange={(_, newValue) => setIndicatorsSubTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab 
                  label="Indicadores Técnicos" 
                  icon={<ShowChart />}
                  iconPosition="start"
                />
                <Tab 
                  label="Estratégia" 
                  icon={<AutoAwesome />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {indicatorsSubTab === 0 ? (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" sx={{ color: 'primary.main' }}>
                    <ShowChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Indicadores Técnicos
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={addIndicator}
                    startIcon={<Add />}
                    sx={{ borderRadius: 2 }}
                  >
                    Adicionar Indicador
                  </Button>
                </Box>

            {/* Lógica de Sinalização dos Indicadores */}
            {(config.indicators.filter(i => i.type === 'primary').length > 1 || 
              config.indicators.filter(i => i.type === 'confirmation').length > 1) && (
              <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lógica de Sinalização dos Indicadores
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                    Configure quando o sinal de entrada deve ser gerado baseado nos indicadores:
                  </Typography>
                  <Grid container spacing={3}>
                    {/* Lógica dos Indicadores Principais */}
                    {config.indicators.filter(i => i.type === 'primary').length > 1 && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Indicadores Principais ({config.indicators.filter(i => i.type === 'primary').length} indicador(es))
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: 'inherit' }}>Condição de Sinalização</InputLabel>
                          <Select
                            value={config.indicatorLogic?.primary || 'all'}
                            label="Condição de Sinalização"
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              indicatorLogic: {
                                ...(prev.indicatorLogic || { primary: 'all', confirmation: 'all' }),
                                primary: e.target.value as 'all' | 'any'
                              }
                            }))}
                            sx={{ 
                              color: 'inherit',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.8)'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 1)'
                              }
                            }}
                          >
                            <MenuItem value="all">
                              <Box>
                                <Typography variant="body1" fontWeight="bold">
                                  TODOS os indicadores principais devem sinalizar (AND)
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                  Mais conservador - requer confirmação de todos os indicadores principais
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="any">
                              <Box>
                                <Typography variant="body1" fontWeight="bold">
                                  QUALQUER indicador principal pode sinalizar (OR)
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                  Mais agressivo - qualquer indicador principal pode gerar entrada
                                </Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {/* Lógica dos Indicadores de Confirmação */}
                    {config.indicators.filter(i => i.type === 'confirmation').length > 1 && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Indicadores de Confirmação ({config.indicators.filter(i => i.type === 'confirmation').length} indicador(es))
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: 'inherit' }}>Condição de Confirmação</InputLabel>
                          <Select
                            value={config.indicatorLogic?.confirmation || 'all'}
                            label="Condição de Confirmação"
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              indicatorLogic: {
                                ...(prev.indicatorLogic || { primary: 'all', confirmation: 'all' }),
                                confirmation: e.target.value as 'all' | 'any'
                              }
                            }))}
                            sx={{ 
                              color: 'inherit',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.8)'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 1)'
                              }
                            }}
                          >
                            <MenuItem value="all">
                              <Box>
                                <Typography variant="body1" fontWeight="bold">
                                  TODOS os indicadores de confirmação devem confirmar (AND)
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                  Mais conservador - requer confirmação de todos os indicadores
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="any">
                              <Box>
                                <Typography variant="body1" fontWeight="bold">
                                  QUALQUER indicador de confirmação pode confirmar (OR)
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                  Mais agressivo - qualquer indicador de confirmação pode gerar entrada
                                </Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {config.indicators.length === 0 ? (
              <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <ShowChart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom color="text.secondary">
                      Nenhum indicador técnico configurado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Você pode adicionar indicadores técnicos aqui ou usar apenas estratégias na aba "Estratégia".
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={addIndicator}
                      startIcon={<Add />}
                      sx={{ borderRadius: 2 }}
                    >
                      Adicionar Primeiro Indicador
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              config.indicators.map((indicator, index) => (
              <Card key={index} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardHeader
                  title={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h6">{indicator.name}</Typography>
                      <Chip 
                        label={indicator.type === 'primary' ? 'Principal' : 'Confirmação'}
                        color={indicator.type === 'primary' ? 'primary' : 'default'}
                        size="small"
                      />
                    </Box>
                  }
                  action={
                    <Box display="flex" gap={1}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          value={indicator.type}
                          label="Tipo"
                          onChange={(e) => updateIndicator(index, 'type', e.target.value)}
                        >
                          <MenuItem value="primary">Principal</MenuItem>
                          <MenuItem value="confirmation">Confirmação</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => removeIndicator(index)}
                        size="small"
                      >
                        <Remove />
                      </Button>
                    </Box>
                  }
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Indicador</InputLabel>
                        <Select
                          value={indicator.name}
                          label="Indicador"
                          onChange={(e) => {
                            const newName = e.target.value;
                            updateIndicator(index, 'name', newName);
                            updateIndicator(index, 'parameters', getDefaultParameters(newName));
                            if (indicator.type === 'primary') {
                              handlePrimaryIndicatorChange(newName);
                            }
                          }}
                        >
                          {indicators.map(ind => (
                            <MenuItem key={ind} value={ind}>{ind}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        {getIndicatorConditions(indicator.name).description}
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Parâmetros do {indicator.name}:
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(indicator.parameters).map(([paramName, paramValue]) => (
                          <Grid item xs={12} md={3} key={paramName}>
                            <TextField
                              fullWidth
                              type="number"
                              label={paramName}
                              value={paramValue}
                              onChange={(e) => updateIndicatorParameter(index, paramName, Number(e.target.value))}
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>

                    {/* Métodos de Entrada e Saída para este indicador */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                        Métodos de Entrada e Saída para {indicator.name}
                      </Typography>
                      <Grid container spacing={2}>
                        {/* Método de Entrada */}
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined">
                            <CardHeader 
                              title="Método de Entrada" 
                              avatar={<TrendingUp color="primary" fontSize="small" />}
                              titleTypographyProps={{ variant: 'subtitle2' }}
                            />
                            <CardContent>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Tipo de Ordem</InputLabel>
                                    <Select
                                      value={indicator.entryMethod?.type || config.entryMethod.type}
                                      label="Tipo de Ordem"
                                      onChange={(e) => {
                                        setConfig(prev => ({
                                          ...prev,
                                          indicators: prev.indicators.map((ind, i) => 
                                            i === index ? {
                                              ...ind,
                                              entryMethod: {
                                                ...(ind.entryMethod || prev.entryMethod),
                                                type: e.target.value as any
                                              }
                                            } : ind
                                          )
                                        }));
                                      }}
                                    >
                                      <MenuItem value="market">Market</MenuItem>
                                      <MenuItem value="limit">Limit</MenuItem>
                                      <MenuItem value="stop">Stop</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Condição</InputLabel>
                                    <Select
                                      value={indicator.entryMethod?.condition || config.entryMethod.condition}
                                      label="Condição"
                                      onChange={(e) => {
                                        setConfig(prev => ({
                                          ...prev,
                                          indicators: prev.indicators.map((ind, i) => 
                                            i === index ? {
                                              ...ind,
                                              entryMethod: {
                                                ...(ind.entryMethod || prev.entryMethod),
                                                condition: e.target.value
                                              }
                                            } : ind
                                          )
                                        }));
                                      }}
                                    >
                                      {getIndicatorConditions(indicator.name).entryConditions.map(condition => (
                                        <MenuItem key={condition} value={condition}>{condition}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    label="Valor (opcional)"
                                    size="small"
                                    value={indicator.entryMethod?.value || config.entryMethod.value || ''}
                                    onChange={(e) => {
                                      setConfig(prev => ({
                                        ...prev,
                                        indicators: prev.indicators.map((ind, i) => 
                                          i === index ? {
                                            ...ind,
                                            entryMethod: {
                                              ...(ind.entryMethod || prev.entryMethod),
                                              value: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          } : ind
                                        )
                                      }));
                                    }}
                                    variant="outlined"
                                  />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>

                        {/* Método de Saída */}
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined">
                            <CardHeader 
                              title="Método de Saída" 
                              avatar={<TrendingDown color="secondary" fontSize="small" />}
                              titleTypographyProps={{ variant: 'subtitle2' }}
                            />
                            <CardContent>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Tipo de Ordem</InputLabel>
                                    <Select
                                      value={indicator.exitMethod?.type || config.exitMethod.type}
                                      label="Tipo de Ordem"
                                      onChange={(e) => {
                                        setConfig(prev => ({
                                          ...prev,
                                          indicators: prev.indicators.map((ind, i) => 
                                            i === index ? {
                                              ...ind,
                                              exitMethod: {
                                                ...(ind.exitMethod || prev.exitMethod),
                                                type: e.target.value as any
                                              }
                                            } : ind
                                          )
                                        }));
                                      }}
                                    >
                                      <MenuItem value="market">Market</MenuItem>
                                      <MenuItem value="limit">Limit</MenuItem>
                                      <MenuItem value="stop">Stop</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Condição</InputLabel>
                                    <Select
                                      value={indicator.exitMethod?.condition || config.exitMethod.condition}
                                      label="Condição"
                                      onChange={(e) => {
                                        setConfig(prev => ({
                                          ...prev,
                                          indicators: prev.indicators.map((ind, i) => 
                                            i === index ? {
                                              ...ind,
                                              exitMethod: {
                                                ...(ind.exitMethod || prev.exitMethod),
                                                condition: e.target.value
                                              }
                                            } : ind
                                          )
                                        }));
                                      }}
                                    >
                                      {getIndicatorConditions(indicator.name).exitConditions.map(condition => (
                                        <MenuItem key={condition} value={condition}>{condition}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    label="Valor (opcional)"
                                    size="small"
                                    value={indicator.exitMethod?.value || config.exitMethod.value || ''}
                                    onChange={(e) => {
                                      setConfig(prev => ({
                                        ...prev,
                                        indicators: prev.indicators.map((ind, i) => 
                                          i === index ? {
                                            ...ind,
                                            exitMethod: {
                                              ...(ind.exitMethod || prev.exitMethod),
                                              value: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          } : ind
                                        )
                                      }));
                                    }}
                                    variant="outlined"
                                  />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              ))
            )}

            {config.indicators.find(i => i.type === 'primary') && (
              <Alert 
                icon={<Info />} 
                severity="success" 
                sx={{ mt: 2 }}
              >
                <Typography variant="subtitle2">
                  <strong>Indicador Principal:</strong> {currentIndicatorConditions.description}
                </Typography>
              </Alert>
            )}
              </>
            ) : (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" sx={{ color: 'primary.main' }}>
                    <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Estratégias Consagradas
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Selecione uma estratégia pré-configurada para aplicar ao seu robô. 
                    Você poderá ajustar os parâmetros após a seleção.
                  </Typography>
                </Alert>

                <Grid container spacing={3}>
                  {strategies.map((strategy) => (
                    <Grid item xs={12} md={6} lg={4} key={strategy.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {strategy.icon}
                            </Box>
                            <Typography variant="h6" component="h3">
                              {strategy.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                            {strategy.description}
                          </Typography>
                          <Box display="flex" gap={1} mt="auto">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Help />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTutorialStrategy(strategy.id);
                                setTutorialOpen(true);
                              }}
                              sx={{ flex: 1 }}
                            >
                              Tutorial
                            </Button>
                            <Button
                              variant={isStrategyActive(strategy.id) ? "outlined" : "contained"}
                              color={isStrategyActive(strategy.id) ? "error" : "primary"}
                              size="small"
                              startIcon={isStrategyActive(strategy.id) ? <Stop /> : <PlayArrow />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isStrategyActive(strategy.id)) {
                                  deactivateStrategy(strategy.id);
                                } else {
                                  applyStrategy(strategy);
                                }
                              }}
                              sx={{ flex: 1 }}
                            >
                              {isStrategyActive(strategy.id) ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStrategy(strategy.id);
                                setStrategyConfig({ ...strategy.defaultConfig });
                                setStrategyConfigOpen(true);
                              }}
                            >
                              Config
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
              <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
              Gestão de Risco
            </Typography>

            <Grid container spacing={3}>
              {/* Tamanho da Posição */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title="Tamanho da Posição" 
                    avatar={<AccountBalance color="primary" />}
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={config.positionSizing.type}
                            label="Tipo"
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              positionSizing: { ...prev.positionSizing, type: e.target.value as any }
                            }))}
                          >
                            <MenuItem value="fixed">Fixo</MenuItem>
                            <MenuItem value="percentage">Percentual</MenuItem>
                            <MenuItem value="kelly">Kelly Criterion</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Valor"
                          value={config.positionSizing.value}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            positionSizing: { ...prev.positionSizing, value: Number(e.target.value) }
                          }))}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">
                              {config.positionSizing.type === 'percentage' ? '%' : 'USDT'}
                            </InputAdornment>
                          }}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Posição Máxima"
                          value={config.positionSizing.maxPosition}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            positionSizing: { ...prev.positionSizing, maxPosition: Number(e.target.value) }
                          }))}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">USDT</InputAdornment>
                          }}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Stop Loss */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="Stop Loss" 
                    avatar={<Warning color="error" />}
                  />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.stopLoss.enabled}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            stopLoss: { ...prev.stopLoss, enabled: e.target.checked }
                          }))}
                        />
                      }
                      label="Habilitar Stop Loss"
                    />
                    
                    {config.stopLoss.enabled && (
                      <Box mt={2}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <FormControl fullWidth>
                              <InputLabel>Tipo</InputLabel>
                              <Select
                                value={config.stopLoss.type}
                                label="Tipo"
                                onChange={(e) => setConfig(prev => ({ 
                                  ...prev, 
                                  stopLoss: { ...prev.stopLoss, type: e.target.value as any }
                                }))}
                              >
                                <MenuItem value="fixed">Fixo</MenuItem>
                                <MenuItem value="trailing">Trailing</MenuItem>
                                <MenuItem value="atr">ATR</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Valor (%)"
                              value={config.stopLoss.value}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                stopLoss: { ...prev.stopLoss, value: Number(e.target.value) }
                              }))}
                              inputProps={{
                                step: "0.1",
                                min: "0"
                              }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                              }}
                              variant="outlined"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Take Profit */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="Take Profit" 
                    avatar={<CheckCircle color="success" />}
                  />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.takeProfit.enabled}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            takeProfit: { ...prev.takeProfit, enabled: e.target.checked }
                          }))}
                        />
                      }
                      label="Habilitar Take Profit"
                    />
                    
                    {config.takeProfit.enabled && (
                      <Box mt={2}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <FormControl fullWidth>
                              <InputLabel>Tipo</InputLabel>
                              <Select
                                value={config.takeProfit.type}
                                label="Tipo"
                                onChange={(e) => setConfig(prev => ({ 
                                  ...prev, 
                                  takeProfit: { ...prev.takeProfit, type: e.target.value as any }
                                }))}
                              >
                                <MenuItem value="fixed">Fixo</MenuItem>
                                <MenuItem value="trailing">Trailing</MenuItem>
                                <MenuItem value="atr">ATR</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Valor (%)"
                              value={config.takeProfit.value}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                takeProfit: { ...prev.takeProfit, value: Number(e.target.value) }
                              }))}
                              inputProps={{
                                step: "0.1",
                                min: "0"
                              }}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                              }}
                              variant="outlined"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Limites de Risco */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Limites de Risco
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Perda Máxima Diária</Typography>
                    <TextField
                      fullWidth
                      type="number"
                      label="Percentual (%)"
                      value={config.riskManagement.maxDailyLoss}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        riskManagement: { ...prev.riskManagement, maxDailyLoss: Number(e.target.value) }
                      }))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Drawdown Máximo</Typography>
                    <TextField
                      fullWidth
                      type="number"
                      label="Percentual (%)"
                      value={config.riskManagement.maxDrawdown}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        riskManagement: { ...prev.riskManagement, maxDrawdown: Number(e.target.value) }
                      }))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Posições Abertas</Typography>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantidade Máxima"
                      value={config.riskManagement.maxOpenPositions}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        riskManagement: { ...prev.riskManagement, maxOpenPositions: Number(e.target.value) }
                      }))}
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
              <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
              Configurações Avançadas
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Filtro de Tempo" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.advancedSettings.timeFilter.enabled}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            advancedSettings: { 
                              ...prev.advancedSettings, 
                              timeFilter: { ...prev.advancedSettings.timeFilter, enabled: e.target.checked }
                            }
                          }))}
                        />
                      }
                      label="Habilitar filtro de tempo"
                    />
                    
                    {config.advancedSettings.timeFilter.enabled && (
                      <Box mt={2}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              type="time"
                              label="Hora de Início"
                              value={config.advancedSettings.timeFilter.startTime || ''}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                advancedSettings: { 
                                  ...prev.advancedSettings, 
                                  timeFilter: { ...prev.advancedSettings.timeFilter, startTime: e.target.value }
                                }
                              }))}
                              InputLabelProps={{ shrink: true }}
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              type="time"
                              label="Hora de Fim"
                              value={config.advancedSettings.timeFilter.endTime || ''}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                advancedSettings: { 
                                  ...prev.advancedSettings, 
                                  timeFilter: { ...prev.advancedSettings.timeFilter, endTime: e.target.value }
                                }
                              }))}
                              InputLabelProps={{ shrink: true }}
                              variant="outlined"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Filtro de Notícias" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.advancedSettings.newsFilter.enabled}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            advancedSettings: { 
                              ...prev.advancedSettings, 
                              newsFilter: { ...prev.advancedSettings.newsFilter, enabled: e.target.checked }
                            }
                          }))}
                        />
                      }
                      label="Evitar notícias importantes"
                    />
                    
                    {config.advancedSettings.newsFilter.enabled && (
                      <Box mt={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Minutos antes/depois da notícia"
                          value={config.advancedSettings.newsFilter.avoidNewsMinutes}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            advancedSettings: { 
                              ...prev.advancedSettings, 
                              newsFilter: { ...prev.advancedSettings.newsFilter, avoidNewsMinutes: Number(e.target.value) }
                            }
                          }))}
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Filtro de Correlação" />
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.advancedSettings.correlationFilter.enabled}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            advancedSettings: { 
                              ...prev.advancedSettings, 
                              correlationFilter: { ...prev.advancedSettings.correlationFilter, enabled: e.target.checked }
                            }
                          }))}
                        />
                      }
                      label="Evitar correlações altas"
                    />
                    
                    {config.advancedSettings.correlationFilter.enabled && (
                      <Box mt={2}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Correlação máxima permitida"
                          value={config.advancedSettings.correlationFilter.maxCorrelation}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            advancedSettings: { 
                              ...prev.advancedSettings, 
                              correlationFilter: { ...prev.advancedSettings.correlationFilter, maxCorrelation: Number(e.target.value) }
                            }
                          }))}
                          inputProps={{ min: 0, max: 1, step: 0.1 }}
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Execução de Entrada" />
                  <CardContent>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Modo de Execução de Entrada</InputLabel>
                      <Select
                        value={config.advancedSettings.entryExecution.mode}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          advancedSettings: { 
                            ...prev.advancedSettings, 
                            entryExecution: { 
                              ...prev.advancedSettings.entryExecution, 
                              mode: e.target.value as 'candle_close' | 'price_condition'
                            }
                          }
                        }))}
                        label="Modo de Execução de Entrada"
                      >
                        <MenuItem value="candle_close">
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Fechamento do Candle
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Entrada executada no fechamento do candle que atendeu a condição
                            </Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="price_condition">
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Quando Preço Cumprir Parâmetro
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Entrada executada assim que o preço atingir o parâmetro definido
                            </Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Execução de Saída" />
                  <CardContent>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Modo de Execução de Saída</InputLabel>
                      <Select
                        value={config.advancedSettings.exitExecution.mode}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          advancedSettings: { 
                            ...prev.advancedSettings, 
                            exitExecution: { 
                              ...prev.advancedSettings.exitExecution, 
                              mode: e.target.value as 'candle_close' | 'price_condition'
                            }
                          }
                        }))}
                        label="Modo de Execução de Saída"
                      >
                        <MenuItem value="candle_close">
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Fechamento do Candle
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Saída executada no fechamento do candle que atendeu a condição
                            </Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="price_condition">
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Quando Preço Cumprir Parâmetro
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Saída executada assim que o preço atingir o parâmetro definido
                            </Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            component="button" 
            variant="body2" 
            onClick={onCancel}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <ArrowBack sx={{ mr: 1 }} />
            Voltar aos Robôs
          </Link>
          <Typography color="text.primary">
            {isEdit ? 'Editar Robô' : 'Criar Novo Robô'}
          </Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? 'Editar Robô' : 'Criar Novo Robô'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure seu robô de trading com indicadores personalizados e estratégias avançadas
        </Typography>
      </Box>

      {/* Tabs de Navegação */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Conteúdo da Aba */}
      <Paper sx={{ p: 4, minHeight: '60vh' }}>
        {renderTabContent()}
      </Paper>

      {/* Botões de Ação */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          size="large"
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          disabled={saving}
        >
          {saving ? (isEdit ? 'Salvando...' : 'Criando...') : (isEdit ? 'Salvar Alterações' : 'Criar Robô')}
        </Button>
      </Box>

      {/* Dialog de Configuração de Estratégia */}
      <Dialog 
        open={strategyConfigOpen} 
        onClose={() => {
          setStrategyConfigOpen(false);
          setSelectedStrategy(null);
          setStrategyConfig(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Configurar Estratégia: {strategies.find(s => s.id === selectedStrategy)?.name}
            </Typography>
            <IconButton onClick={() => {
              setStrategyConfigOpen(false);
              setSelectedStrategy(null);
              setStrategyConfig(null);
            }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStrategy && strategyConfig && (() => {
            const strategy = strategies.find(s => s.id === selectedStrategy);
            if (!strategy) return null;

            // Interface especial para Cruzamento de Médias
            if (selectedStrategy === 'moving_average_crossover') {
              const movingAverages = strategyConfig.movingAverages || [
                { type: 'EMA', period: 9 },
                { type: 'EMA', period: 21 }
              ];

              return (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      {strategy.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Configure múltiplas médias móveis. Compra quando cruzar para cima, vende quando cruzar para baixo.
                    </Typography>
                  </Alert>

                  <Typography variant="h6" gutterBottom>
                    Médias Móveis
                  </Typography>

                  {movingAverages.map((ma: any, index: number) => (
                    <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="subtitle1">
                            Média {index + 1}
                          </Typography>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Remove />}
                            onClick={() => {
                              if (movingAverages.length > 2) {
                                setStrategyConfig((prev: any) => ({
                                  ...prev,
                                  movingAverages: prev.movingAverages.filter((_: any, i: number) => i !== index)
                                }));
                              } else {
                                alert('Você precisa ter pelo menos 2 médias móveis.');
                              }
                            }}
                            disabled={movingAverages.length <= 2}
                          >
                            Remover
                          </Button>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Tipo de Média</InputLabel>
                              <Select
                                value={ma.type}
                                label="Tipo de Média"
                                onChange={(e) => {
                                  setStrategyConfig((prev: any) => ({
                                    ...prev,
                                    movingAverages: prev.movingAverages.map((m: any, i: number) =>
                                      i === index ? { ...m, type: e.target.value } : m
                                    )
                                  }));
                                }}
                              >
                                <MenuItem value="SMA">SMA - Média Móvel Simples</MenuItem>
                                <MenuItem value="EMA">EMA - Média Móvel Exponencial</MenuItem>
                                <MenuItem value="WMA">WMA - Média Móvel Ponderada</MenuItem>
                                <MenuItem value="HMA">HMA - Média Móvel de Hull</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              type="number"
                              label="Período"
                              value={ma.period}
                              onChange={(e) => {
                                setStrategyConfig((prev: any) => ({
                                  ...prev,
                                  movingAverages: prev.movingAverages.map((m: any, i: number) =>
                                    i === index ? { ...m, period: Number(e.target.value) } : m
                                  )
                                }));
                              }}
                              inputProps={{ min: 1 }}
                              variant="outlined"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {
                      setStrategyConfig((prev: any) => ({
                        ...prev,
                        movingAverages: [
                          ...(prev.movingAverages || []),
                          { type: 'EMA', period: 50 }
                        ]
                      }));
                    }}
                    sx={{ mb: 3 }}
                  >
                    Adicionar Média Móvel
                  </Button>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Condições de Entrada e Saída
                  </Typography>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Selecione "Automático: Crossover/Crossunder" para comprar quando cruzar para cima e vender quando cruzar para baixo automaticamente.
                    </Typography>
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Condição de Entrada (Compra)</InputLabel>
                        <Select
                          value={
                            strategyConfig.autoMode === true
                              ? 'auto_crossover_crossunder'
                              : (strategyConfig.entryCondition || 'crossover')
                          }
                          label="Condição de Entrada (Compra)"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'auto_crossover_crossunder') {
                              setStrategyConfig((prev: any) => ({
                                ...prev,
                                entryCondition: 'crossover',
                                exitCondition: 'crossunder',
                                autoMode: true
                              }));
                            } else {
                              setStrategyConfig((prev: any) => ({
                                ...prev,
                                entryCondition: value,
                                autoMode: false
                              }));
                            }
                          }}
                        >
                          <MenuItem value="auto_crossover_crossunder">
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                Automático: Crossover/Crossunder
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Compra ao cruzar para cima, vende ao cruzar para baixo
                              </Typography>
                            </Box>
                          </MenuItem>
                          <Divider />
                          <MenuItem value="crossover">Crossover (Cruzamento para cima) - COMPRA</MenuItem>
                          <MenuItem value="crossunder">Crossunder (Cruzamento para baixo)</MenuItem>
                          <MenuItem value="above">Acima</MenuItem>
                          <MenuItem value="below">Abaixo</MenuItem>
                          <MenuItem value="oversold">Sobrevenda</MenuItem>
                          <MenuItem value="overbought">Sobrecompra</MenuItem>
                          <MenuItem value="breakout">Breakout</MenuItem>
                          <MenuItem value="breakdown">Breakdown</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Condição de Saída (Venda)</InputLabel>
                        <Select
                          value={
                            strategyConfig.autoMode === true
                              ? 'auto_crossover_crossunder'
                              : (strategyConfig.exitCondition || 'crossunder')
                          }
                          label="Condição de Saída (Venda)"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'auto_crossover_crossunder') {
                              setStrategyConfig((prev: any) => ({
                                ...prev,
                                entryCondition: 'crossover',
                                exitCondition: 'crossunder',
                                autoMode: true
                              }));
                            } else {
                              setStrategyConfig((prev: any) => ({
                                ...prev,
                                exitCondition: value,
                                autoMode: false
                              }));
                            }
                          }}
                        >
                          <MenuItem value="auto_crossover_crossunder">
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                Automático: Crossover/Crossunder
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Compra ao cruzar para cima, vende ao cruzar para baixo
                              </Typography>
                            </Box>
                          </MenuItem>
                          <Divider />
                          <MenuItem value="crossunder">Crossunder (Cruzamento para baixo) - VENDA</MenuItem>
                          <MenuItem value="crossover">Crossover (Cruzamento para cima)</MenuItem>
                          <MenuItem value="below">Abaixo</MenuItem>
                          <MenuItem value="above">Acima</MenuItem>
                          <MenuItem value="overbought">Sobrecompra</MenuItem>
                          <MenuItem value="oversold">Sobrevenda</MenuItem>
                          <MenuItem value="breakdown">Breakdown</MenuItem>
                          <MenuItem value="breakout">Breakout</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  {strategyConfig.autoMode === true && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        ✓ Configuração automática ativa: Compra quando cruza para cima (crossover), vende quando cruza para baixo (crossunder).
                      </Typography>
                    </Alert>
                  )}
                </Box>
              );
            }

            // Interface padrão para outras estratégias
            return (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    {strategy.description}
                  </Typography>
                </Alert>

                <Typography variant="h6" gutterBottom>
                  Parâmetros da Estratégia
                </Typography>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {Object.entries(strategyConfig).map(([key, value]) => {
                    if (key === 'entryCondition' || key === 'exitCondition') {
                      return (
                        <Grid item xs={12} md={6} key={key}>
                          <FormControl fullWidth>
                            <InputLabel>
                              {key === 'entryCondition' ? 'Condição de Entrada' : 'Condição de Saída'}
                            </InputLabel>
                            <Select
                              value={
                                strategyConfig.autoMode === true
                                  ? 'auto_crossover_crossunder'
                                  : value
                              }
                              label={key === 'entryCondition' ? 'Condição de Entrada' : 'Condição de Saída'}
                              onChange={(e) => {
                                const selectedValue = e.target.value;
                                if (selectedValue === 'auto_crossover_crossunder') {
                                  setStrategyConfig(prev => ({
                                    ...prev,
                                    entryCondition: 'crossover',
                                    exitCondition: 'crossunder',
                                    autoMode: true
                                  }));
                                } else {
                                  setStrategyConfig(prev => ({
                                    ...prev,
                                    [key]: selectedValue,
                                    autoMode: false
                                  }));
                                }
                              }}
                            >
                              {key === 'entryCondition' ? (
                                <>
                                  <MenuItem value="auto_crossover_crossunder">
                                    <Box>
                                      <Typography variant="body1" fontWeight="bold">
                                        Automático: Crossover/Crossunder
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Compra ao cruzar para cima, vende ao cruzar para baixo
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                  <Divider />
                                  <MenuItem value="crossover">Crossover (Cruzamento para cima)</MenuItem>
                                  <MenuItem value="crossunder">Crossunder (Cruzamento para baixo)</MenuItem>
                                  <MenuItem value="above">Acima</MenuItem>
                                  <MenuItem value="below">Abaixo</MenuItem>
                                  <MenuItem value="oversold">Sobrevenda</MenuItem>
                                  <MenuItem value="overbought">Sobrecompra</MenuItem>
                                  <MenuItem value="breakout">Breakout</MenuItem>
                                  <MenuItem value="breakdown">Breakdown</MenuItem>
                                </>
                              ) : (
                                <>
                                  <MenuItem value="auto_crossover_crossunder">
                                    <Box>
                                      <Typography variant="body1" fontWeight="bold">
                                        Automático: Crossover/Crossunder
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Compra ao cruzar para cima, vende ao cruzar para baixo
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                  <Divider />
                                  <MenuItem value="crossunder">Crossunder (Cruzamento para baixo)</MenuItem>
                                  <MenuItem value="crossover">Crossover (Cruzamento para cima)</MenuItem>
                                  <MenuItem value="below">Abaixo</MenuItem>
                                  <MenuItem value="above">Acima</MenuItem>
                                  <MenuItem value="overbought">Sobrecompra</MenuItem>
                                  <MenuItem value="oversold">Sobrevenda</MenuItem>
                                  <MenuItem value="breakdown">Breakdown</MenuItem>
                                  <MenuItem value="breakout">Breakout</MenuItem>
                                </>
                              )}
                            </Select>
                          </FormControl>
                        </Grid>
                      );
                    } else if (key === 'fastType' || key === 'slowType') {
                      return (
                        <Grid item xs={12} md={6} key={key}>
                          <FormControl fullWidth>
                            <InputLabel>
                              {key === 'fastType' ? 'Tipo Média Rápida' : 'Tipo Média Lenta'}
                            </InputLabel>
                            <Select
                              value={value}
                              label={key === 'fastType' ? 'Tipo Média Rápida' : 'Tipo Média Lenta'}
                              onChange={(e) => {
                                setStrategyConfig(prev => ({
                                  ...prev,
                                  [key]: e.target.value
                                }));
                              }}
                            >
                              <MenuItem value="SMA">SMA - Média Móvel Simples</MenuItem>
                              <MenuItem value="EMA">EMA - Média Móvel Exponencial</MenuItem>
                              <MenuItem value="WMA">WMA - Média Móvel Ponderada</MenuItem>
                              <MenuItem value="HMA">HMA - Média Móvel de Hull</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      );
                    } else if (key === 'movingAverages') {
                      // Ignorar movingAverages aqui, já tratado acima
                      return null;
                    } else {
                      return (
                        <Grid item xs={12} md={6} key={key}>
                          <TextField
                            fullWidth
                            type="number"
                            label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            value={value}
                            onChange={(e) => {
                              setStrategyConfig(prev => ({
                                ...prev,
                                [key]: Number(e.target.value)
                              }));
                            }}
                            variant="outlined"
                          />
                        </Grid>
                      );
                    }
                  })}
                </Grid>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setStrategyConfigOpen(false);
            setSelectedStrategy(null);
            setStrategyConfig(null);
          }}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              const strategy = strategies.find(s => s.id === selectedStrategy);
              if (strategy && strategyConfig) {
                applyStrategy(strategy, strategyConfig);
              }
            }}
          >
            Aplicar Estratégia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Tutorial */}
      <Dialog 
        open={tutorialOpen} 
        onClose={() => {
          setTutorialOpen(false);
          setTutorialStrategy(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Help color="primary" />
              <Typography variant="h6">
                Tutorial: {tutorialStrategy ? getStrategyTutorial(tutorialStrategy).title : 'Estratégia'}
              </Typography>
            </Box>
            <IconButton onClick={() => {
              setTutorialOpen(false);
              setTutorialStrategy(null);
            }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {tutorialStrategy && (() => {
            const tutorial = getStrategyTutorial(tutorialStrategy);
            return (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Entenda como funciona esta estratégia e quando utilizá-la.
                  </Typography>
                </Alert>

                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Como Funciona
                </Typography>

                <Box sx={{ mb: 3 }}>
                  {tutorial.content.map((paragraph, index) => {
                    // Verificar se é um item de lista (começa com "  •")
                    const isListItem = paragraph.trim().startsWith('•');
                    const isSubItem = paragraph.trim().startsWith('  •');
                    
                    if (isSubItem) {
                      return (
                        <Typography 
                          key={index}
                          variant="body2" 
                          sx={{ 
                            mb: 0.5, 
                            lineHeight: 1.8,
                            pl: 4,
                            color: 'text.secondary'
                          }}
                        >
                          {paragraph}
                        </Typography>
                      );
                    } else if (isListItem) {
                      return (
                        <Typography 
                          key={index}
                          variant="body2" 
                          sx={{ 
                            mb: 0.5, 
                            lineHeight: 1.8,
                            pl: 2,
                            fontWeight: 'medium'
                          }}
                        >
                          {paragraph}
                        </Typography>
                      );
                    } else {
                      return (
                        <Typography 
                          key={index}
                          variant="body1" 
                          sx={{ mb: 1.5, lineHeight: 1.8 }}
                        >
                          {paragraph}
                        </Typography>
                      );
                    }
                  })}
                </Box>

                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    💡 Dica Prática
                  </Typography>
                  <Typography variant="body2">
                    Após entender a estratégia, você pode ativá-la diretamente com os parâmetros padrão ou configurá-la 
                    personalizando os parâmetros conforme suas necessidades.
                  </Typography>
                </Alert>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setTutorialOpen(false);
              setTutorialStrategy(null);
            }}
          >
            Fechar
          </Button>
          {tutorialStrategy && (
            <Button 
              variant={isStrategyActive(tutorialStrategy) ? "outlined" : "contained"}
              color={isStrategyActive(tutorialStrategy) ? "error" : "primary"}
              startIcon={isStrategyActive(tutorialStrategy) ? <Stop /> : <PlayArrow />}
              onClick={() => {
                const strategy = strategies.find(s => s.id === tutorialStrategy);
                if (strategy) {
                  setTutorialOpen(false);
                  setTutorialStrategy(null);
                  if (isStrategyActive(tutorialStrategy)) {
                    deactivateStrategy(tutorialStrategy);
                  } else {
                    applyStrategy(strategy);
                  }
                }
              }}
            >
              {isStrategyActive(tutorialStrategy) ? 'Desativar Estratégia' : 'Ativar Estratégia'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Backdrop com loading */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={saving}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">
            {isEdit ? 'Salvando alterações...' : 'Criando robô...'}
          </Typography>
        </Box>
      </Backdrop>
    </Container>
  );
};

export default BotConfig; 