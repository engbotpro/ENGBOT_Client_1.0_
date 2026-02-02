import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack
} from '@mui/icons-material';
import BotChart from '../Bots/BotChart';
import { Bot } from '../../types/bot';

interface BacktestTrade {
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
  timeframe?: string;
  trades?: BacktestTrade[];
}

const BacktestChartPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [botForChart, setBotForChart] = useState<Bot | null>(null);

  // Carregar resultado do backtest
  useEffect(() => {
    if (!resultId) {
      navigate('/home/backTest');
      return;
    }

    const savedResults = localStorage.getItem('backtestResults');
    if (savedResults) {
      try {
        const results: BacktestResult[] = JSON.parse(savedResults);
        const foundResult = results.find(r => r.id === resultId);
        if (foundResult) {
          setResult(foundResult);
          
          // Criar objeto Bot compatível com BotChart
          const bot: Bot = {
            id: foundResult.botConfig.id || 'backtest-bot',
            userId: '',
            name: foundResult.botConfig.name || 'Backtest Bot',
            symbol: foundResult.botConfig.symbol || 'BTCUSDT',
            environment: 'virtual',
            isActive: false,
            config: {
              name: foundResult.botConfig.name || 'Backtest Bot',
              symbol: foundResult.botConfig.symbol || 'BTCUSDT',
              timeframe: foundResult.timeframe || foundResult.botConfig.timeframe || '1h',
              indicators: foundResult.botConfig.indicators || foundResult.botConfig.config?.indicators || [],
              primaryIndicator: foundResult.botConfig.primaryIndicator,
              secondaryIndicator: foundResult.botConfig.secondaryIndicator,
              confirmationIndicator: foundResult.botConfig.confirmationIndicator,
              ...foundResult.botConfig
            },
            primaryIndicator: foundResult.botConfig.primaryIndicator,
            secondaryIndicator: foundResult.botConfig.secondaryIndicator,
            confirmationIndicator: foundResult.botConfig.confirmationIndicator,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setBotForChart(bot);
        } else {
          setError('Resultado do backtest não encontrado.');
        }
      } catch (err) {
        console.error('Erro ao parsear resultados:', err);
        setError('Erro ao carregar resultado do backtest.');
      }
    } else {
      setError('Nenhum resultado de backtest encontrado.');
    }
    setLoading(false);
  }, [resultId, navigate]);

  // Converter trades do backtest para o formato esperado pelo BotChart
  const formatTradesForChart = () => {
    if (!result?.trades || result.trades.length === 0) {
      console.log('⚠️ Nenhum trade encontrado no resultado do backtest');
      return [];
    }
    
    console.log('📊 Formatando trades para o gráfico:', result.trades.length, 'trades');
    console.log('📊 Primeiro trade (exemplo):', result.trades[0]);
    
    const formattedTrades = result.trades.map((trade: BacktestTrade, index: number) => {
      // Garantir que entryTime e exitTime sejam números (timestamps em ms)
      const entryTimestamp = typeof trade.entryTime === 'number' 
        ? trade.entryTime 
        : new Date(trade.entryTime).getTime();
      
      const exitTimestamp = trade.exitTime 
        ? (typeof trade.exitTime === 'number' 
          ? trade.exitTime 
          : new Date(trade.exitTime).getTime())
        : null;
      
      // Converter para ISO strings (formato esperado pelo BotChart)
      const entryTimeStr = new Date(entryTimestamp).toISOString();
      const exitTimeStr = exitTimestamp ? new Date(exitTimestamp).toISOString() : null;
      
      const formatted = {
        id: `trade-${index}-${entryTimestamp}`,
        side: trade.side || 'buy', // Default para 'buy' se não tiver
        entryTime: entryTimeStr,
        exitTime: exitTimeStr,
        price: trade.entryPrice, // Preço de entrada
        exitPrice: trade.exitPrice || null,
        pnl: trade.profit !== undefined ? trade.profit : null
      };
      
      if (index < 3) { // Log apenas os primeiros 3 para não poluir o console
        console.log(`Trade ${index}:`, {
          original: {
            entryTime: trade.entryTime,
            exitTime: trade.exitTime,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            side: trade.side,
            profit: trade.profit
          },
          formatted: formatted
        });
      }
      
      return formatted;
    });
    
    console.log('✅ Trades formatados:', formattedTrades.length);
    return formattedTrades;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Carregando dados do gráfico...</Typography>
      </Container>
    );
  }

  if (error || !result || !botForChart) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Resultado do backtest não encontrado.'}</Alert>
        <Button onClick={() => navigate('/home/backTest')} sx={{ mt: 2 }}>
          Voltar para Backtest
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/home/backTest/results/${resultId}`)}
          variant="outlined"
        >
          Voltar
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Gráfico do Backtest - {result.botConfig.name}
        </Typography>
      </Box>

      {/* Informações */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          Símbolo: {result.botConfig.symbol} | Período: {result.startDate} - {result.endDate} | 
          Timeframe: {result.timeframe || result.botConfig.timeframe || '1h'}
        </Typography>
      </Box>

      {/* Gráfico usando o mesmo componente do Bot */}
      <Card>
        <CardContent>
          {botForChart && (() => {
            const trades = formatTradesForChart();
            console.log('🎯 Renderizando BotChart com:', {
              tradesCount: trades.length,
              botSymbol: botForChart.config.symbol,
              botTimeframe: botForChart.config.timeframe,
              startDate: result.startDate,
              endDate: result.endDate,
              firstTrade: trades[0],
              lastTrade: trades[trades.length - 1]
            });
            return (
              <BotChart 
                bot={botForChart} 
                trades={trades}
                startDate={result.startDate}
                endDate={result.endDate}
              />
            );
          })()}
        </CardContent>
      </Card>
    </Container>
  );
};

export default BacktestChartPage;
