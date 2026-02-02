import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  SportsEsports,
  Person,
  Schedule,
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  History,
  ShowChart
} from '@mui/icons-material';
import { RootState } from '../../store';
import challengeAPI from '../../services/challengeAPI';
import type { Challenge } from '../../types/challenge';

const ChallengeDetailsPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const loadChallenge = async () => {
    if (!challengeId) return;
    
    try {
      setLoading(true);
      setError(null);
      const challengeData = await challengeAPI.getChallengeById(challengeId);
      setChallenge(challengeData);
    } catch (err) {
      console.error('Erro ao carregar desafio:', err);
      setError('Erro ao carregar detalhes do desafio');
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

  const isExpired = (() => {
    if (!challenge || challenge.status === 'completed' || challenge.status === 'cancelled') return false;
    const now = new Date();
    const [hours, minutes] = challenge.endTime.split(':').map(Number);
    const [yE, mE, dE] = parseDate(challenge.endDate as unknown as string);
    const endDateTime = new Date(yE, mE - 1, dE, hours, minutes, 0, 0);
    const [startHours, startMinutes] = challenge.startTime.split(':').map(Number);
    const [yS, mS, dS] = parseDate(challenge.startDate as unknown as string);
    const startDateTime = new Date(yS, mS - 1, dS, startHours, startMinutes, 0, 0);
    if (now < startDateTime) return false;
    const buffer = 30 * 1000;
    return now.getTime() > endDateTime.getTime() + buffer;
  })();

  const isWaitingStart = (() => {
    if (!challenge || challenge.status !== 'active' || challenge.type !== 'bot_duel') return false;
    const now = new Date();
    const [hours, minutes] = challenge.startTime.split(':').map(Number);
    const [yS, mS, dS] = parseDate(challenge.startDate as unknown as string);
    const startDateTime = new Date(yS, mS - 1, dS, hours, minutes, 0, 0);
    return now < startDateTime;
  })();

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Pendente',
      'active': 'Ativo',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
      'pending': 'warning',
      'active': 'primary',
      'completed': 'success',
      'cancelled': 'error'
    };
    return colorMap[status] || 'default';
  };

  const getTypeText = (type: string) => {
    return type === 'manual_trading' ? 'Trading Manual' : 'Duelo de Robôs';
  };

  const formatDuration = (duration: number) => {
    if (duration < 1) return `${duration * 24}h`;
    if (duration === 1) return '1 dia';
    return `${duration} dias`;
  };

  const isChallenger = challenge?.challenger.id === currentUserId;
  const isChallenged = challenge?.challenged.id === currentUserId;
  const isCompleted = challenge?.status === 'completed';
  const isPending = challenge?.status === 'pending';

  const getCurrentResults = () => {
    if (!challenge) return null;
    
    const currentBalance = isChallenger 
      ? challenge.challengerCurrentBalance 
      : challenge.challengedCurrentBalance;
    const opponentBalance = isChallenger 
      ? challenge.challengedCurrentBalance 
      : challenge.challengerCurrentBalance;
    
    if (!currentBalance || !opponentBalance) return null;
    
    const initialBalance = challenge.initialBalance || 1000;
    const currentReturn = ((currentBalance - initialBalance) / initialBalance) * 100;
    const opponentReturn = ((opponentBalance - initialBalance) / initialBalance) * 100;
    const isLeading = currentReturn > opponentReturn;
    
    return {
      currentBalance,
      opponentBalance,
      currentReturn,
      opponentReturn,
      isLeading
    };
  };

  const getWinnerInfo = () => {
    if (!challenge || !isCompleted || !challenge.winner) return null;
    
    const isWinner = challenge.winner.id === currentUserId;
    const winnerReturn = challenge.challengerReturn && challenge.challengedReturn
      ? (challenge.winner.id === challenge.challenger.id ? challenge.challengerReturn : challenge.challengedReturn)
      : 0;
    const loserReturn = challenge.challengerReturn && challenge.challengedReturn
      ? (challenge.winner.id === challenge.challenger.id ? challenge.challengedReturn : challenge.challengerReturn)
      : 0;
    const profit = isChallenger
      ? (challenge.challengerProfit || 0)
      : (challenge.challengedProfit || 0);
    
    return {
      isWinner,
      winnerReturn,
      loserReturn,
      profit
    };
  };

  const currentResults = getCurrentResults();
  const winnerInfo = getWinnerInfo();

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
        <Box mt={4}>
          <Alert severity="error">{error || 'Desafio não encontrado'}</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/home/challenge')} sx={{ mt: 2 }}>
            Voltar
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/home/challenge')}
          sx={{ mb: 2 }}
        >
          Voltar aos Desafios
        </Button>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {challenge.title}
          </Typography>
          <Chip
            label={isWaitingStart ? 'Aguardando Início' : getStatusText(challenge.status)}
            color={isWaitingStart ? 'info' : getStatusColor(challenge.status) as any}
            size="medium"
          />
        </Box>
        {challenge.description && (
          <Typography variant="body1" color="text.secondary">
            {challenge.description}
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Participantes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Participantes
              </Typography>
              <Box display="flex" justifyContent="space-around" gap={2} mt={2}>
                {[challenge.challenger, challenge.challenged].map((p, idx) => (
                  <Box key={idx} display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <Avatar src={p.avatar} sx={{ width: 60, height: 60 }}>
                      {p.name.charAt(0)}
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {p.name}
                    </Typography>
                    <Chip
                      label={idx === 0 ? 'Desafiante' : 'Desafiado'}
                      color={idx === 0 ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detalhes do Desafio */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detalhes do Desafio
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <SportsEsports color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {getTypeText(challenge.type)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Schedule color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {formatDuration(challenge.duration)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <EmojiEvents color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {challenge.betAmount} tokens
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  <strong>Data de Início:</strong> {formatDateSafe(challenge.startDate as unknown as string)} às {formatTime(challenge.startTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Data de Término:</strong> {formatDateSafe(challenge.endDate as unknown as string)} às {formatTime(challenge.endTime)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resultado Parcial */}
        {currentResults && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resultado Parcial
                </Typography>
                <Grid container spacing={3} mt={1}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: currentResults.isLeading ? 'success.light' : 'grey.100',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Você
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ${currentResults.currentBalance.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="body1"
                        color={currentResults.currentReturn >= 0 ? 'success.main' : 'error.main'}
                        sx={{ mt: 1 }}
                      >
                        {currentResults.currentReturn >= 0 ? '+' : ''}
                        {currentResults.currentReturn.toFixed(2)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: !currentResults.isLeading ? 'success.light' : 'grey.100',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Oponente
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ${currentResults.opponentBalance.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="body1"
                        color={currentResults.opponentReturn >= 0 ? 'success.main' : 'error.main'}
                        sx={{ mt: 1 }}
                      >
                        {currentResults.opponentReturn >= 0 ? '+' : ''}
                        {currentResults.opponentReturn.toFixed(2)}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={2}>
                  {currentResults.isLeading ? (
                    <>
                      <TrendingUp color="success" />
                      <Typography variant="h6" color="success.main">
                        Você está na frente!
                      </Typography>
                    </>
                  ) : (
                    <>
                      <TrendingDown color="warning" />
                      <Typography variant="h6" color="warning.main">
                        Você está atrás
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Resultado Final */}
        {isCompleted && winnerInfo && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="center" alignItems="center" gap={2} mb={2}>
                  {winnerInfo.isWinner ? (
                    <>
                      <CheckCircle color="success" sx={{ fontSize: 48 }} />
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        Você Venceu!
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Cancel color="error" sx={{ fontSize: 48 }} />
                      <Typography variant="h4" color="error.main" fontWeight="bold">
                        Você Perdeu
                      </Typography>
                    </>
                  )}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" color="text.secondary">
                      <strong>Retorno do Vencedor:</strong> {winnerInfo.winnerReturn.toFixed(2)}%
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Retorno do Perdedor:</strong> {winnerInfo.loserReturn.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" color={winnerInfo.isWinner ? 'success.main' : 'error.main'}>
                      <strong>Lucro:</strong> ${winnerInfo.profit.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Ações */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ações
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
                {challenge.status === 'active' && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<History />}
                      onClick={() => navigate(`/home/challenge/${challenge.id}/history`)}
                    >
                      Ver Histórico
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ShowChart />}
                      onClick={() => navigate(`/home/challenge/${challenge.id}/trading`)}
                    >
                      Fazer Trade
                    </Button>
                  </>
                )}
                {isCompleted && (
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<History />}
                    onClick={() => navigate(`/home/challenge/${challenge.id}/history`)}
                  >
                    Ver Histórico Completo
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChallengeDetailsPage;

