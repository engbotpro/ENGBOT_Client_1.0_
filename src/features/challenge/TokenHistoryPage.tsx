import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  History,
  AttachMoney,
  EmojiEvents,
  Refresh
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import challengeAPI from '../../services/challengeAPI';

interface TokenTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  challenge: {
    id: string;
    title: string;
    type: string;
    status: string;
  } | null;
  metadata: any;
  createdAt: string;
}

const TokenHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTokenHistory();
  }, []);

  const loadTokenHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await challengeAPI.getTokenHistory();
      setTransactions(result.transactions || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar histórico de tokens');
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'challenge_won':
        return <EmojiEvents color="success" />;
      case 'challenge_lost':
        return <Cancel color="error" />;
      case 'challenge_created':
      case 'challenge_accepted':
        return <AttachMoney color="info" />;
      case 'challenge_refund':
        return <Refresh color="warning" />;
      default:
        return <History />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'challenge_won':
        return 'success';
      case 'challenge_lost':
        return 'error';
      case 'challenge_created':
      case 'challenge_accepted':
        return 'info';
      case 'challenge_refund':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'challenge_won':
        return 'Vitória';
      case 'challenge_lost':
        return 'Derrota';
      case 'challenge_created':
        return 'Desafio Criado';
      case 'challenge_accepted':
        return 'Desafio Aceito';
      case 'challenge_refund':
        return 'Reembolso';
      default:
        return type;
    }
  };

  // Calcular totais reais
  const totalGains = useMemo(() => {
    return transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const totalLosses = useMemo(() => {
    return transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [transactions]);

  const netBalance = useMemo(() => {
    return totalGains - totalLosses;
  }, [totalGains, totalLosses]);

  // Preparar dados para o gráfico (evolução do saldo ao longo do tempo)
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];
    
    // Ordenar transações por data
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Criar pontos de dados para o gráfico
    return sortedTransactions.map((tx, index) => ({
      date: new Date(tx.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      saldo: tx.balanceAfter,
      ganho: tx.amount > 0 ? tx.amount : 0,
      perda: tx.amount < 0 ? Math.abs(tx.amount) : 0,
      timestamp: new Date(tx.createdAt).getTime()
    }));
  }, [transactions]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/home/challenge')}
          sx={{ mb: 2 }}
        >
          Voltar
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Histórico de Tokens
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualize todas as transações de tokens relacionadas a desafios
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estatísticas Resumidas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total de Ganhos
              </Typography>
              <Typography variant="h5" color="success.main">
                +{totalGains.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 🪙
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total de Perdas
              </Typography>
              <Typography variant="h5" color="error.main">
                -{totalLosses.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 🪙
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Saldo Líquido
              </Typography>
              <Typography 
                variant="h5" 
                color={netBalance >= 0 ? 'success.main' : 'error.main'}
              >
                {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 🪙
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de Evolução dos Tokens */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Evolução dos Tokens
          </Typography>
          {transactions.length === 0 ? (
            <Box sx={{ width: '100%', height: 400, mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Alert severity="info" sx={{ width: '100%' }}>
                Nenhuma transação encontrada. O gráfico aparecerá aqui quando você tiver transações de tokens.
              </Alert>
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: 400, mt: 2 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={chartData.length > 10 ? Math.floor(chartData.length / 10) : 0}
                  />
                  <YAxis 
                    label={{ value: 'Tokens', angle: -90, position: 'insideLeft' }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 🪙`}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    name="Saldo de Tokens"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Transações ({transactions.length})
            </Typography>
            <IconButton onClick={loadTokenHistory} size="small">
              <Refresh />
            </IconButton>
          </Box>
          
          {transactions.length === 0 ? (
            <Alert severity="info">
              Nenhuma transação encontrada. As transações aparecerão aqui quando você participar de desafios.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell align="right">Saldo Após</TableCell>
                    <TableCell>Desafio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTransactionIcon(transaction.type)}
                          label={getTransactionLabel(transaction.type)}
                          color={getTransactionColor(transaction.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.description}
                        </Typography>
                        {transaction.metadata?.opponentName && (
                          <Typography variant="caption" color="text.secondary">
                            vs {transaction.metadata.opponentName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {transaction.amount >= 0 ? '+' : ''}
                          {transaction.amount.toLocaleString('pt-BR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })} 🪙
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {transaction.balanceAfter.toLocaleString('pt-BR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })} 🪙
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {transaction.challenge ? (
                          <Tooltip title={`Ver detalhes do desafio: ${transaction.challenge.title}`}>
                            <Button
                              size="small"
                              onClick={() => navigate(`/home/challenge/${transaction.challenge!.id}/details`)}
                            >
                              {transaction.challenge.title}
                            </Button>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default TokenHistoryPage;

