import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
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
  LinearProgress
} from '@mui/material';
import {
  ArrowBack,
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  History,
  Schedule,
  AttachMoney
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import type { Challenge } from '../../types/challenge';
import challengeAPI from '../../services/challengeAPI';

interface ChallengeTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: Date;
  profit?: number;
  user: {
    id: string;
    name: string;
  };
}

const ChallengeHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');
  
  console.log('🎯 ChallengeHistoryPage renderizada!');
  console.log('📋 challengeId:', challengeId);
  console.log('👤 currentUserId:', currentUserId);
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [trades, setTrades] = useState<ChallengeTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (challengeId) {
      loadChallengeHistory();
    }
  }, [challengeId]);

  const loadChallengeHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const [challengeData, tradesData] = await Promise.all([
        challengeAPI.getChallengeById(challengeId!),
        challengeAPI.getChallengeTrades(challengeId!)
      ]);

      setChallenge(challengeData);
      setTrades(tradesData);
    } catch (err) {
      setError('Erro ao carregar histórico do desafio');
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (iso: string): [number, number, number] => {
    const parts = iso.slice(0, 10).split("-").map(Number);
    return [parts[0], parts[1], parts[2]];
  };

  const formatDateSafe = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? dateString : dateString.toISOString();
    const [y, m, d] = parseDate(date);
    return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`;
  };

  const formatTime = (timeString: string | undefined | null): string => {
    if (!timeString) return '00:00';
    
    // Converter para string se for número
    const timeStr = String(timeString).trim();
    
    // Se já está no formato HH:mm, retornar como está
    if (timeStr.match(/^\d{2}:\d{2}$/)) {
      return timeStr;
    }
    
    // Se for apenas um número (como "0"), tratar como hora
    if (timeStr.match(/^\d+$/)) {
      const num = parseInt(timeStr, 10);
      if (num >= 0 && num < 24) {
        return `${num.toString().padStart(2, '0')}:00`;
      }
    }
    
    // Tentar extrair hora e minuto de diferentes formatos
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Se tiver formato H:mm, padStart na hora
    if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return '00:00';
  };

  const formatDate = (date: Date | string) => {
    // Se for uma string de data ISO (sem hora), usar formatDateSafe para evitar problemas de timezone
    if (typeof date === 'string') {
      // Verificar se é formato ISO date only (YYYY-MM-DD)
      if (date.length === 10 && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return formatDateSafe(date);
      }
      // Se tiver hora, extrair a data de forma segura e formatar com hora
      const dateOnly = date.slice(0, 10);
      if (dateOnly.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = parseDate(dateOnly);
        const dateObj = new Date(y, m - 1, d);
        // Extrair hora da string original se existir
        const timeMatch = date.match(/T(\d{2}):(\d{2})/);
        if (timeMatch) {
          dateObj.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
        }
        return dateObj.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    // Se for um objeto Date, extrair componentes de forma segura
    if (date instanceof Date) {
      // Usar getFullYear, getMonth, getDate para evitar problemas de timezone
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const h = date.getHours();
      const min = date.getMinutes();
      
      // Se não tiver hora significativa (00:00), mostrar apenas data
      if (h === 0 && min === 0) {
        return formatDateSafe(`${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`);
      }
      
      // Formatar com data e hora
      return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y} ${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    }
    // Fallback: formatar normalmente
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getWinnerInfo = () => {
    if (!challenge) return null;

    // Se há um winner definido, usar ele
    if (challenge.winner) {
      const isCurrentUserWinner = challenge.winner.id === currentUserId;
      const winnerReturn = challenge.challengerReturn && challenge.challengedReturn ? 
        (challenge.winner.id === challenge.challenger.id ? challenge.challengerReturn : challenge.challengedReturn) : 0;
      const loserReturn = challenge.challengerReturn && challenge.challengedReturn ? 
        (challenge.winner.id === challenge.challenger.id ? challenge.challengedReturn : challenge.challengerReturn) : 0;

      return {
        isWinner: isCurrentUserWinner,
        winnerReturn,
        loserReturn,
        winnerName: challenge.winner.name,
        loserName: challenge.loser?.name || 'N/A'
      };
    }

    // Se não há winner mas o desafio está completo, determinar vencedor pelos retornos
    if (challenge.status === 'completed' && challenge.challengerReturn !== undefined && challenge.challengedReturn !== undefined) {
      const challengerReturn = challenge.challengerReturn || 0;
      const challengedReturn = challenge.challengedReturn || 0;

      // Se há diferença nos retornos, há um vencedor
      if (challengerReturn > challengedReturn) {
        const isCurrentUserWinner = challenge.challenger.id === currentUserId;
        return {
          isWinner: isCurrentUserWinner,
          winnerReturn: challengerReturn,
          loserReturn: challengedReturn,
          winnerName: challenge.challenger.name,
          loserName: challenge.challenged.name
        };
      } else if (challengedReturn > challengerReturn) {
        const isCurrentUserWinner = challenge.challenged.id === currentUserId;
        return {
          isWinner: isCurrentUserWinner,
          winnerReturn: challengedReturn,
          loserReturn: challengerReturn,
          winnerName: challenge.challenged.name,
          loserName: challenge.challenger.name
        };
      }
      // Se os retornos são iguais, é empate (retorna null)
    }

    return null; // Empate ou desafio não finalizado
  };

  const getCurrentUserStats = () => {
    if (!challenge) return null;

    const isChallenger = challenge.challenger.id === currentUserId;
    const currentBalance = isChallenger ? challenge.challengerCurrentBalance : challenge.challengedCurrentBalance;
    const currentReturn = isChallenger ? challenge.challengerCurrentReturn : challenge.challengedCurrentReturn;
    const finalProfit = isChallenger ? challenge.challengerProfit : challenge.challengedProfit;

    return {
      isChallenger,
      currentBalance: currentBalance || challenge.initialBalance,
      currentReturn: currentReturn || 0,
      finalProfit: finalProfit || 0,
      role: isChallenger ? 'Desafiante' : 'Desafiado'
    };
  };

  const winnerInfo = getWinnerInfo();
  const userStats = getCurrentUserStats();

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !challenge) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error || 'Desafio não encontrado'}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/home/challenge')}
          sx={{ mt: 2 }}
        >
          Voltar aos Desafios
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box mb={4}>
        <Button
          variant="outlined"
          onClick={() => navigate('/home/challenge')}
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          ← Voltar aos Desafios
        </Button>
        
        <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
          📊 Histórico do Desafio
        </Typography>
        
        <Typography variant="h5" gutterBottom>
          {challenge.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {challenge.description}
        </Typography>
      </Box>

      {/* Status e Resultado */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🏆 Resultado Final
              </Typography>
              
              {winnerInfo ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <EmojiEvents color="success" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" color="success.main">
                      Vencedor: {winnerInfo.winnerName}
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Retorno do Vencedor:
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        +{winnerInfo.winnerReturn?.toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Retorno do Perdedor:
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {winnerInfo.loserReturn?.toFixed(2)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Desafio empatado
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                👤 Suas Estatísticas
              </Typography>
              
              {userStats && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Função: {userStats.role}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Saldo Final:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(userStats.currentBalance)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Retorno Final:
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={userStats.currentReturn >= 0 ? 'success.main' : 'error.main'}
                  >
                    {userStats.currentReturn >= 0 ? '+' : ''}{userStats.currentReturn.toFixed(2)}%
                  </Typography>
                  
                  {userStats.finalProfit !== 0 && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Lucro/Prejuízo:
                      </Typography>
                      <Typography 
                        variant="h6" 
                        color={userStats.finalProfit >= 0 ? 'success.main' : 'error.main'}
                      >
                        {userStats.finalProfit >= 0 ? '+' : ''}{formatCurrency(userStats.finalProfit)}
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detalhes do Desafio */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            📋 Detalhes do Desafio
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Schedule color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Duração
                </Typography>
                <Typography variant="h6">
                  {challenge.duration} dias
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <AttachMoney color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Aposta
                </Typography>
                <Typography variant="h6">
                  {challenge.betAmount} tokens
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <History color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Início
                </Typography>
                <Typography variant="h6">
                  {formatDateSafe(challenge.startDate as unknown as string)} às {formatTime(challenge.startTime)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <CheckCircle color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Conclusão
                </Typography>
                <Typography variant="h6">
                  {formatDateSafe(challenge.endDate as unknown as string)} às {formatTime(challenge.endTime)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Histórico de Trades */}
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            📈 Histórico de Trades
          </Typography>
          
          {trades.length === 0 ? (
            <Alert severity="info">
              Nenhum trade foi realizado neste desafio.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuário</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Símbolo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Quantidade</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Preço</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data/Hora</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Lucro</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {trade.user.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {trade.user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={trade.symbol} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={trade.side === 'buy' ? 'Compra' : 'Venda'} 
                          color={trade.side === 'buy' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{trade.quantity.toFixed(4)}</TableCell>
                      <TableCell>{formatCurrency(trade.price)}</TableCell>
                      <TableCell>{formatDate(trade.timestamp)}</TableCell>
                      <TableCell>
                        {trade.profit !== undefined ? (
                          <Typography
                            variant="body2"
                            color={trade.profit >= 0 ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {trade.profit >= 0 ? '+' : ''}{formatCurrency(trade.profit)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
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

export default ChallengeHistoryPage;
