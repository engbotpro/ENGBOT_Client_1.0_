import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Button,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Timeline,
  Assessment,
  Speed,
  CheckCircle,
  Cancel,
  Warning,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ShowChart
} from '@mui/icons-material';

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

const BacktestResultsPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resultId) {
      navigate('/home/backTest');
      return;
    }

    // Carregar resultado do localStorage
    const savedResults = localStorage.getItem('backtestResults');
    if (savedResults) {
      const results: BacktestResult[] = JSON.parse(savedResults);
      const foundResult = results.find(r => r.id === resultId);
      if (foundResult) {
        setResult(foundResult);
      } else {
        navigate('/home/backTest');
      }
    } else {
      navigate('/home/backTest');
    }
    setLoading(false);
  }, [resultId, navigate]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (!result) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Resultado do backtest não encontrado.</Alert>
        <Button onClick={() => navigate('/home/backTest')} sx={{ mt: 2 }}>
          Voltar para Backtest
        </Button>
      </Container>
    );
  }

  const getPerformanceColor = (value: number, isPositive: boolean = true) => {
    if (isPositive) {
      return value > 0 ? 'success.main' : 'error.main';
    }
    return value < 0 ? 'success.main' : 'error.main';
  };

  const getPerformanceIcon = (value: number, isPositive: boolean = true) => {
    if (isPositive) {
      return value > 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />;
    }
    return value < 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'running':
        return <LinearProgress />;
      case 'failed':
        return <Cancel color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateROI = () => {
    const initialCapital = 10000;
    return ((result.netProfit / initialCapital) * 100);
  };

  const calculateAverageTrade = () => {
    return result.totalTrades > 0 ? result.netProfit / result.totalTrades : 0;
  };

  const calculateExpectancy = () => {
    const winRate = result.winRate / 100;
    const avgWin = result.averageWin;
    const avgLoss = Math.abs(result.averageLoss);
    return (winRate * avgWin) - ((1 - winRate) * avgLoss);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/home/backTest')}
            variant="outlined"
          >
            Voltar
          </Button>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Resultados do Backteste
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShowChart />}
            onClick={() => navigate(`/home/backTest/results/${resultId}/chart`)}
          >
            Ver Gráfico
          </Button>
          <Chip 
            label={result.status} 
            color={getStatusColor(result.status) as any}
            icon={getStatusIcon(result.status)}
            size="medium"
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Informações Básicas */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações Gerais
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estratégia
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {result.botConfig.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Símbolo
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {result.botConfig.symbol}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Período
                  </Typography>
                  <Typography variant="body1">
                    {result.startDate} - {result.endDate}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data de Execução
                  </Typography>
                  <Typography variant="body1">
                    {new Date(result.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Métricas Principais */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Métricas Principais
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {getPerformanceIcon(result.netProfit)}
                    <Typography variant="body2" color="text.secondary">
                      Lucro Líquido
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={getPerformanceColor(result.netProfit)}
                  >
                    ${result.netProfit.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ROI: {calculateROI().toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Assessment color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Taxa de Acerto
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {result.winRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {result.winningTrades}/{result.totalTrades} trades
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Speed color="info" />
                    <Typography variant="body2" color="text.secondary">
                      Sharpe Ratio
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {result.sharpeRatio.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {result.sharpeRatio > 1 ? 'Bom' : 'Baixo'} risco/retorno
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Timeline color="secondary" />
                    <Typography variant="body2" color="text.secondary">
                      Profit Factor
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="secondary.main">
                    {result.profitFactor.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {result.profitFactor > 2 ? 'Excelente' : 'Aceitável'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Análise de Trades */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Análise de Trades
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Trades
                  </Typography>
                  <Typography variant="h6">
                    {result.totalTrades}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trades Vencedores
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {result.winningTrades}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trades Perdedores
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {result.losingTrades}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Média por Trade
                  </Typography>
                  <Typography 
                    variant="h6"
                    color={getPerformanceColor(calculateAverageTrade())}
                  >
                    ${calculateAverageTrade().toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Maior Ganho
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    ${result.largestWin.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Maior Perda
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    ${result.largestLoss.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Análise de Risco */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Análise de Risco
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Máximo Drawdown
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {result.maxDrawdown.toFixed(2)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Expectância
                  </Typography>
                  <Typography 
                    variant="h6"
                    color={getPerformanceColor(calculateExpectancy())}
                  >
                    ${calculateExpectancy().toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Sequência de Vitórias
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {result.consecutiveWins}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Sequência de Derrotas
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {result.consecutiveLosses}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Streak Atual
                  </Typography>
                  <Typography variant="h6">
                    {result.currentStreak}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Lucro Total
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    ${result.totalProfit.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumo de Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo de Performance
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Métrica</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell align="right">Classificação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Taxa de Acerto</TableCell>
                      <TableCell align="right">{result.winRate.toFixed(1)}%</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={result.winRate > 60 ? 'Excelente' : result.winRate > 50 ? 'Boa' : 'Baixa'}
                          color={result.winRate > 60 ? 'success' : result.winRate > 50 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sharpe Ratio</TableCell>
                      <TableCell align="right">{result.sharpeRatio.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={result.sharpeRatio > 1.5 ? 'Excelente' : result.sharpeRatio > 1 ? 'Bom' : 'Baixo'}
                          color={result.sharpeRatio > 1.5 ? 'success' : result.sharpeRatio > 1 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Profit Factor</TableCell>
                      <TableCell align="right">{result.profitFactor.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={result.profitFactor > 2 ? 'Excelente' : result.profitFactor > 1.5 ? 'Bom' : 'Baixo'}
                          color={result.profitFactor > 2 ? 'success' : result.profitFactor > 1.5 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Máximo Drawdown</TableCell>
                      <TableCell align="right">{result.maxDrawdown.toFixed(2)}%</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={result.maxDrawdown < 10 ? 'Baixo' : result.maxDrawdown < 20 ? 'Médio' : 'Alto'}
                          color={result.maxDrawdown < 10 ? 'success' : result.maxDrawdown < 20 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico de Operações */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Histórico de Operações
                {result.trades && result.trades.length > 0 && ` (${result.trades.length} trades)`}
              </Typography>
              {result.trades && result.trades.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Entrada</TableCell>
                        <TableCell>Saída</TableCell>
                        <TableCell align="center">Tipo</TableCell>
                        <TableCell align="right">Preço Entrada</TableCell>
                        <TableCell align="right">Preço Saída</TableCell>
                        <TableCell align="right">SL</TableCell>
                        <TableCell align="right">TP</TableCell>
                        <TableCell align="right">Quantidade</TableCell>
                        <TableCell align="right">Lucro/Prejuízo</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.trades.map((trade, index) => {
                        const isWin = trade.profit > 0;
                        const entryDate = new Date(trade.entryTime);
                        const exitDate = new Date(trade.exitTime);
                        const duration = Math.round((trade.exitTime - trade.entryTime) / (1000 * 60 * 60)); // horas
                        
                        // Calcular SL e TP baseado na configuração do bot (se disponível)
                        let stopLoss = null;
                        let takeProfit = null;
                        
                        // Verificar em diferentes locais possíveis da configuração
                        const stopLossConfig = result.botConfig?.stopLoss || result.botConfig?.config?.stopLoss;
                        const takeProfitConfig = result.botConfig?.takeProfit || result.botConfig?.config?.takeProfit;
                        
                        if (stopLossConfig?.enabled && stopLossConfig?.value) {
                          const slPercent = stopLossConfig.value;
                          if (trade.side === 'buy') {
                            stopLoss = trade.entryPrice * (1 - slPercent / 100);
                          } else {
                            // Para venda (short), stop loss é acima do preço de entrada
                            stopLoss = trade.entryPrice * (1 + slPercent / 100);
                          }
                        }
                        
                        if (takeProfitConfig?.enabled && takeProfitConfig?.value) {
                          const tpPercent = takeProfitConfig.value;
                          if (trade.side === 'buy') {
                            takeProfit = trade.entryPrice * (1 + tpPercent / 100);
                          } else {
                            // Para venda (short), take profit é abaixo do preço de entrada
                            takeProfit = trade.entryPrice * (1 - tpPercent / 100);
                          }
                        }
                        
                        return (
                          <TableRow 
                            key={index}
                            sx={{ 
                              backgroundColor: isWin ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                              '&:hover': { backgroundColor: isWin ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)' }
                            }}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {entryDate.toLocaleDateString('pt-BR')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {exitDate.toLocaleDateString('pt-BR')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {exitDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                <br />
                                ({duration}h)
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={trade.side === 'buy' ? 'Compra' : 'Venda'}
                                color={trade.side === 'buy' ? 'success' : 'error'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              ${trade.entryPrice.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              ${trade.exitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {stopLoss !== null ? (
                                <Typography variant="body2">
                                  ${stopLoss.toFixed(2)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {takeProfit !== null ? (
                                <Typography variant="body2">
                                  ${takeProfit.toFixed(2)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {trade.quantity.toFixed(4)}
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                color={isWin ? 'success.main' : 'error.main'}
                              >
                                {isWin ? '+' : ''}${trade.profit.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body2"
                                color={isWin ? 'success.main' : 'error.main'}
                              >
                                {isWin ? '+' : ''}{trade.profitPercent.toFixed(2)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {result.totalTrades > 0 
                    ? 'Os detalhes das operações não estão disponíveis para este backtest. Execute um novo backtest para ver o histórico completo de trades.'
                    : 'Nenhuma operação foi executada durante este backtest.'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BacktestResultsPage;

