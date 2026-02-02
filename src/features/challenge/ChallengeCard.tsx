import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Avatar,
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  SportsEsports,
  Person,
  Schedule,
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  Close,
  History,
  ShowChart,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Challenge, ChallengeStatus, ChallengeType } from '../../types/challenge';
import challengeAPI from '../../services/challengeAPI';
import botAPI from '../../services/botAPI';
import type { BackendBot } from '../../types/bot';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onRespond: (challengeId: string, accept: boolean) => void;
  onFinalize: (challengeId: string) => void;
  onCancel?: (challengeId: string) => void;
  onViewHistory?: (challengeId: string) => void;
  onGoToTrade?: (challengeId: string) => void;
  readOnly?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  currentUserId,
  onRespond,
  onFinalize,
  onCancel,
  onViewHistory,
  onGoToTrade,
  readOnly = false
}) => {
  const navigate = useNavigate();
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [challengerBotName, setChallengerBotName] = useState<string | null>(null);
  const [challengedBotName, setChallengedBotName] = useState<string | null>(null);

  const isChallenger = challenge.challenger.id === currentUserId;
  const isChallenged = challenge.challenged.id === currentUserId;
  
  // Determinar resultado do desafio para o usuário atual
  const getChallengeResult = (): 'win' | 'loss' | 'tie' | null => {
    if (challenge.status !== 'completed') return null;
    
    // Se há um winner definido, usar ele
    if (challenge.winner) {
      if (challenge.winner.id === currentUserId) return 'win';
      if (challenge.loser?.id === currentUserId) return 'loss';
      return 'tie';
    }
    
    // Se não há winner mas há retornos, comparar
    // Primeiro tentar usar challengerReturn/challengedReturn (retornos finais)
    let challengerReturn: number | undefined = challenge.challengerReturn;
    let challengedReturn: number | undefined = challenge.challengedReturn;
    
    // Se não houver, usar os retornos atuais
    if (challengerReturn === undefined) {
      challengerReturn = challenge.challengerCurrentReturn;
    }
    if (challengedReturn === undefined) {
      challengedReturn = challenge.challengedCurrentReturn;
    }
    
    // Se ainda não houver, calcular a partir dos saldos
    if (challengerReturn === undefined || challengedReturn === undefined) {
      const challengerBalance = challenge.challengerCurrentBalance || challenge.initialBalance;
      const challengedBalance = challenge.challengedCurrentBalance || challenge.initialBalance;
      const initialBalance = challenge.initialBalance || 1000;
      
      if (challengerReturn === undefined) {
        challengerReturn = ((challengerBalance - initialBalance) / initialBalance) * 100;
      }
      if (challengedReturn === undefined) {
        challengedReturn = ((challengedBalance - initialBalance) / initialBalance) * 100;
      }
    }
    
    // Comparar os retornos
    if (challengerReturn !== undefined && challengedReturn !== undefined) {
      if (isChallenger) {
        if (challengerReturn > challengedReturn) return 'win';
        if (challengedReturn > challengerReturn) return 'loss';
        return 'tie';
      } else {
        if (challengedReturn > challengerReturn) return 'win';
        if (challengerReturn > challengedReturn) return 'loss';
        return 'tie';
      }
    }
    
    return null;
  };
  
  const challengeResult = getChallengeResult();
  
  // Debug: log do resultado quando o desafio é finalizado
  useEffect(() => {
    if (challenge.status === 'completed') {
      console.log('🎯 ChallengeCard - Resultado do desafio:', {
        challengeId: challenge.id,
        status: challenge.status,
        winner: challenge.winner?.id,
        loser: challenge.loser?.id,
        challengerReturn: challenge.challengerReturn,
        challengedReturn: challenge.challengedReturn,
        challengerCurrentReturn: challenge.challengerCurrentReturn,
        challengedCurrentReturn: challenge.challengedCurrentReturn,
        isChallenger,
        challengeResult
      });
    }
  }, [challenge.id, challenge.status, challenge.winner?.id, challenge.loser?.id, challenge.challengerReturn, challenge.challengedReturn, challenge.challengerCurrentReturn, challenge.challengedCurrentReturn, challengeResult, isChallenger]);
  
  // Determinar cor da borda do card baseado no resultado
  const getCardBorderColor = () => {
    if (challengeResult === 'win') return 'success.main';
    if (challengeResult === 'loss') return 'error.main';
    return 'divider'; // Cor padrão para empate ou desafios não finalizados
  };
  
  const parseDate = (iso: string): [number, number, number] => {
    const parts = iso.slice(0, 10).split("-").map(Number);
    return [parts[0], parts[1], parts[2]]; // y, m, d
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

  // Verificar se o desafio expirou
  const isExpired = (() => {
    if (challenge.status === 'completed' || challenge.status === 'cancelled') return false;
    const now = new Date();
    const [hours, minutes] = challenge.endTime.split(':').map(Number);

    // Criar datas evitando interpretação UTC do constructor de ISO DATE ONLY
    const [yE, mE, dE] = parseDate(challenge.endDate as unknown as string);
    const endDateTime = new Date(yE, mE - 1, dE, hours, minutes, 0, 0);

    const [startHours, startMinutes] = challenge.startTime.split(':').map(Number);
    const [yS, mS, dS] = parseDate(challenge.startDate as unknown as string);
    const startDateTime = new Date(yS, mS - 1, dS, startHours, startMinutes, 0, 0);

    if (now < startDateTime) return false;

    const buffer = 30 * 1000; // 30s buffer
    return now.getTime() > endDateTime.getTime() + buffer;
  })();

  // Verificar se o desafio está aguardando início (apenas para duelos de robôs)
  const isWaitingStart = (() => {
    if (challenge.status !== 'active' || challenge.type !== 'bot_duel') return false;
    const now = new Date();
    const [hours, minutes] = challenge.startTime.split(':').map(Number);
    const [yS, mS, dS] = parseDate(challenge.startDate as unknown as string);
    const startDateTime = new Date(yS, mS - 1, dS, hours, minutes, 0, 0);
    return now < startDateTime;
  })();
  
  const canRespond = isChallenged && challenge.status === 'pending' && !isExpired;
  const canFinalize = (isChallenger || isChallenged) && (challenge.status === 'active' || isExpired);
  const canCancel = isChallenger && challenge.status === 'pending' && !isExpired;
  const isCompleted = challenge.status === 'completed';
  const canTrade = challenge.status === 'active' && !isWaitingStart && !isExpired;
  const canTradeManual = challenge.type === 'manual_trading' && challenge.status === 'active' && !isExpired;
  const canTradeBot = challenge.type === 'bot_duel' && challenge.status === 'active' && !isWaitingStart && !isExpired;

  const getStatusColor = (status: ChallengeStatus) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'waiting_start': return 'info';
      case 'active': return isExpired ? 'error' : 'success';
      case 'completed': return 'info';
      case 'cancelled': return isExpiredPending ? 'error' : 'error';
      default: return 'default';
    }
  };

  // Verificar se um desafio cancelado foi expirado (passou do horário de início sem resposta)
  const isExpiredPending = (() => {
    if (challenge.status !== 'cancelled') return false;
    const now = new Date();
    const [hours, minutes] = challenge.startTime.split(':').map(Number);
    const [yS, mS, dS] = parseDate(challenge.startDate as unknown as string);
    const startDateTime = new Date(yS, mS - 1, dS, hours, minutes, 0, 0);
    // Se o horário de início já passou, foi expirado
    return now.getTime() >= startDateTime.getTime();
  })();

  // Verificar se um desafio cancelado foi rejeitado pelo desafiado
  const isRejected = (() => {
    if (challenge.status !== 'cancelled' || isExpiredPending) return false;
    const now = new Date();
    const [hours, minutes] = challenge.startTime.split(':').map(Number);
    const [yS, mS, dS] = parseDate(challenge.startDate as unknown as string);
    const startDateTime = new Date(yS, mS - 1, dS, hours, minutes, 0, 0);
    // Se foi cancelado antes do horário de início e o usuário atual é o desafiante, foi rejeitado
    if (now.getTime() < startDateTime.getTime() && isChallenger) {
      return true;
    }
    return false;
  })();

  const getStatusText = (status: ChallengeStatus) => {
    switch (status) {
      case 'pending': return 'Aguardando Resposta';
      case 'waiting_start': return challenge.type === 'bot_duel' ? 'Aguardando Início' : 'Aguardando Resposta';
      case 'active': return isExpired ? 'Expirado' : 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': 
        if (isExpiredPending) return 'Expirado';
        if (isRejected) return 'Rejeitado';
        return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getTypeText = (type: ChallengeType) => {
    switch (type) {
      case 'manual_trading': return 'Trading Manual';
      case 'bot_duel': return 'Duelo de Robôs';
      default: return 'Desconhecido';
    }
  };

  const handleRespond = async (accept: boolean) => {
    console.log('🔄 handleRespond chamado:', { accept, challengeId: challenge.id });
    setLoading(true);
    try {
      console.log('⏳ Aguardando onRespond...');
      await onRespond(challenge.id, accept);
      console.log('✅ onRespond concluído com sucesso');
      // Fechar o modal imediatamente após resposta bem-sucedida
      setResponseDialogOpen(false);
      setLoading(false);
      console.log('✅ Modal fechado e loading resetado');
    } catch (error: any) {
      console.error('❌ Erro ao responder:', error);
      setLoading(false);
      
      // Se for timeout, fechar o modal e mostrar mensagem (o backend pode ter processado mesmo assim)
      if (error?.message?.includes('Timeout')) {
        console.warn('⚠️ Timeout detectado, mas o desafio pode ter sido processado. Fechando modal...');
        setResponseDialogOpen(false);
        // Recarregar dados para verificar se o desafio foi atualizado
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      // Manter o modal aberto em caso de outros erros para o usuário tentar novamente
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      await onFinalize(challenge.id);
      setFinalizeDialogOpen(false);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      if (onCancel) {
        await onCancel(challenge.id);
        setCancelDialogOpen(false);
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTrade = async () => {
    setLoading(true);
    try {
      // Simular um trade com dados únicos
      const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'];
      const mockTrade = {
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        quantity: Math.random() * 10 + 1,
        price: Math.random() * 1000 + 50000,
        timestamp: new Date(Date.now() + Math.random() * 1000) // Adicionar variação no timestamp
      };

      const updatedChallenge = await challengeAPI.addManualTrade(challenge.id, currentUserId, mockTrade);
      
      // Atualizar o desafio na lista
      // Forçar re-render do componente pai
      window.location.reload();
    } catch (error) {
      console.error('Erro ao simular trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDuration = (durationInDays: number) => {
    if (durationInDays < 1) {
      const totalMinutes = Math.round(durationInDays * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}min`;
      } else if (minutes > 0) {
        return `${minutes} min`;
      } else {
        return 'Menos de 1 min';
      }
    } else {
      return `${durationInDays.toFixed(1)} dias`;
    }
  };

  const getWinnerInfo = () => {
    if (!isCompleted || !challenge.winner) return null;

    const isWinner = challenge.winner.id === currentUserId;
    const winnerReturn = isChallenger ? challenge.challengerReturn : challenge.challengedReturn;
    const loserReturn = isChallenger ? challenge.challengedReturn : challenge.challengerReturn;

    return {
      isWinner,
      winnerReturn,
      loserReturn,
      profit: isChallenger ? challenge.challengerProfit : challenge.challengedProfit
    };
  };

  const winnerInfo = getWinnerInfo();

  // Obter resultados parciais
  const getCurrentResults = () => {
    if (challenge.status !== 'active') return null;
    
    const isChallenger = challenge.challenger.id === currentUserId;
    const currentBalance = isChallenger ? challenge.challengerCurrentBalance : challenge.challengedCurrentBalance;
    const currentReturn = isChallenger ? challenge.challengerCurrentReturn : challenge.challengedCurrentReturn;
    const opponentBalance = isChallenger ? challenge.challengedCurrentBalance : challenge.challengerCurrentBalance;
    const opponentReturn = isChallenger ? challenge.challengedCurrentReturn : challenge.challengerCurrentReturn;
    
    return {
      currentBalance: currentBalance || challenge.initialBalance,
      currentReturn: currentReturn || 0,
      opponentBalance: opponentBalance || challenge.initialBalance,
      opponentReturn: opponentReturn || 0,
      isLeading: (currentReturn || 0) > (opponentReturn || 0)
    };
  };

  const currentResults = getCurrentResults();

  // Buscar nomes dos robôs quando for duelo de robôs
  useEffect(() => {
    const loadBotNames = async () => {
      if (challenge.type !== 'bot_duel') {
        setChallengerBotName(null);
        setChallengedBotName(null);
        return;
      }

      console.log('🔍 Carregando nomes dos robôs:', {
        challengerBotId: challenge.challengerBotId,
        challengedBotId: challenge.challengedBotId
      });

      try {
        if (challenge.challengerBotId) {
          // Tentar buscar como público primeiro (para desafios - permite buscar robôs de outros usuários)
          const botPublic = await botAPI.getBotByIdPublic(challenge.challengerBotId);
          if (botPublic) {
            console.log('✅ Robô desafiante encontrado (público):', botPublic);
            setChallengerBotName(botPublic.name);
          } else {
            // Se não encontrar como público, tentar buscar normalmente (robô do próprio usuário)
            const bot = await botAPI.getBotById(challenge.challengerBotId);
            if (bot) {
              console.log('✅ Robô desafiante encontrado (privado):', bot);
              setChallengerBotName(bot.name);
            }
          }
        } else {
          console.warn('⚠️ challengerBotId não encontrado');
        }
        
        if (challenge.challengedBotId) {
          // Tentar buscar como público primeiro (para desafios - permite buscar robôs de outros usuários)
          const botPublic = await botAPI.getBotByIdPublic(challenge.challengedBotId);
          if (botPublic) {
            console.log('✅ Robô desafiado encontrado (público):', botPublic);
            setChallengedBotName(botPublic.name);
          } else {
            // Se não encontrar como público, tentar buscar normalmente (robô do próprio usuário)
            const bot = await botAPI.getBotById(challenge.challengedBotId);
            if (bot) {
              console.log('✅ Robô desafiado encontrado (privado):', bot);
              setChallengedBotName(bot.name);
            }
          }
        } else {
          console.warn('⚠️ challengedBotId não encontrado');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar nomes dos robôs:', error);
        // Tentar buscar de outra forma se necessário
      }
    };

    loadBotNames();
  }, [challenge.type, challenge.challengerBotId, challenge.challengedBotId]);

  // Fechar modal quando o desafio não estiver mais pendente (foi aceito/recusado)
  useEffect(() => {
    if (responseDialogOpen && challenge.status !== 'pending' && !loading) {
      console.log('🔄 Status do desafio mudou, fechando modal:', challenge.status);
      setResponseDialogOpen(false);
    }
  }, [challenge.status, responseDialogOpen, loading]);

  return (
    <>
      <Card 
        variant="outlined" 
        sx={{ 
          width: '100%', 
          maxWidth: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          borderColor: getCardBorderColor(),
          borderWidth: challengeResult ? 2 : 1,
          borderStyle: 'solid'
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 }, overflow: 'hidden' }}>
          {/* Header compacto */}
          <Box sx={{ mb: 1, overflow: 'hidden' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={0.5} mb={1} sx={{ minWidth: 0 }}>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                color="primary" 
                sx={{
                  fontSize: '0.9rem', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap', 
                  flex: 1,
                  minWidth: 0,
                  maxWidth: '100%'
                }}
                title={challenge.title}
              >
                    {challenge.title}
                  </Typography>
              <Button
                    size="small"
                variant="outlined"
                startIcon={<Visibility fontSize="small" />}
                onClick={() => navigate(`/home/challenge/${challenge.id}/details`)}
                    sx={{
                  fontSize: '0.7rem',
                  py: 0.3,
                  px: 1,
                  minWidth: 'auto'
                    }}
                  >
                Detalhes
              </Button>
                </Box>
                <Chip
                  label={isWaitingStart ? 'Aguardando Início' : getStatusText(challenge.status)}
                  color={isWaitingStart ? 'info' : getStatusColor(challenge.status) as any}
              size="small"
                  variant="filled"
              sx={{ fontSize: '0.7rem', height: 20 }}
                />
            {/* Mostrar nomes dos robôs se for duelo de robôs */}
            {challenge.type === 'bot_duel' && (challenge.challengerBotId || challenge.challengedBotId || challengerBotName || challengedBotName) && (
              <Box sx={{ mt: 0.5 }}>
                <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                    Duelo:
                  </Typography>
                  {challengerBotName ? (
                          <Chip
                      label={challengerBotName}
                            size="small"
                            variant="outlined"
                      color="primary"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  ) : challenge.challengerBotId ? (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Carregando...
                    </Typography>
                  ) : null}
                  {(challengerBotName || challengedBotName) && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      vs
                    </Typography>
                  )}
                  {challengedBotName ? (
                    <Chip
                      label={challengedBotName}
                      size="small"
                      variant="outlined"
                      color="secondary"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  ) : challenge.challengedBotId ? (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Carregando...
                    </Typography>
                  ) : null}
                </Box>
                  </Box>
              )}
            {isWaitingStart && (
              <Alert severity="info" sx={{ mt: 0.5, fontSize: '0.7rem', py: 0.5 }}>
                ⏰ Início: {formatDateSafe(challenge.startDate as unknown as string)} às {formatTime(challenge.startTime)}
              </Alert>
            )}
            {challenge.status === 'active' && challenge.type === 'manual_trading' && (
              <Alert severity="success" sx={{ mt: 0.5, fontSize: '0.7rem', py: 0.5 }}>
                🎯 Trading ativo
              </Alert>
            )}
            {isExpired && (
              <Alert severity="warning" sx={{ mt: 0.5, fontSize: '0.7rem', py: 0.5 }}>
                ⏰ Expirado
              </Alert>
            )}
            
          </Box>

          {/* Botões de ação para responder ao desafio */}
          {canRespond && !readOnly && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                size="small"
                fullWidth
                          onClick={() => setResponseDialogOpen(true)}
                startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                sx={{ fontSize: '0.7rem', py: 0.5 }}
                          >
                Aceitar
                          </Button>
                          <Button
                            variant="outlined"
                color="error"
                size="small"
                fullWidth
                onClick={() => handleRespond(false)}
                startIcon={<Cancel sx={{ fontSize: 14 }} />}
                disabled={loading}
                sx={{ fontSize: '0.7rem', py: 0.5 }}
              >
                Rejeitar
                          </Button>
                  </Box>
              )}
  
        </CardContent>
      </Card>

      {/* Dialog para responder ao desafio */}
      <Dialog 
        open={responseDialogOpen} 
        onClose={() => !loading && setResponseDialogOpen(false)}
        disableEscapeKeyDown={loading}
      >
        <DialogTitle>Responder ao Desafio</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 3 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Processando resposta...
              </Typography>
            </Box>
          ) : (
            <>
          <Typography>
            Você deseja aceitar ou recusar este desafio?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {challenge.title}
          </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setResponseDialogOpen(false)} 
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => handleRespond(false)} 
            color="error" 
            variant="outlined"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Recusar
          </Button>
          <Button 
            onClick={() => handleRespond(true)} 
            color="success" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Aceitar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para finalizar desafio */}
      <Dialog open={finalizeDialogOpen} onClose={() => setFinalizeDialogOpen(false)}>
        <DialogTitle>
          {isExpired ? 'Finalizar Desafio Expirado' : 'Finalizar Desafio'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {isExpired 
              ? 'Este desafio expirou. Deseja finalizá-lo agora?'
              : 'Tem certeza que deseja finalizar este desafio?'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isExpired 
              ? 'O desafio será marcado como concluído e os resultados serão calculados.'
              : 'Esta ação não pode ser desfeita.'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setFinalizeDialogOpen(false)} 
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalize} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            Finalizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para cancelar desafio */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancelar Desafio</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja cancelar este desafio?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Os tokens serão devolvidos ao desafiante.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)} 
            disabled={loading}
          >
            Voltar
          </Button>
          <Button 
            onClick={handleCancel} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Cancelar Desafio
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChallengeCard; 