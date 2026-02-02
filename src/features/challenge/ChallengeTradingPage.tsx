import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Alert,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import challengeAPI from '../../services/challengeAPI';
import { Challenge } from '../../types/challenge';
import OrderForm from '../Graph/OrderForm';
import PriceChart from '../Graph/PriceChart';
import SymbolSelector from '../Graph/SymbolSelector';
import MarketInfo from '../Graph/MarketInfo';
import { ArrowBack, TrendingUp, TrendingDown, EmojiEvents } from '@mui/icons-material';

const ChallengeTradingPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [challengeTrades, setChallengeTrades] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [timeRemainingText, setTimeRemainingText] = useState('');

  useEffect(() => {
    if (challengeId) {
      loadChallengeData();
    }
  }, [challengeId]);

  // Effect para atualizar o tempo restante em tempo real
  useEffect(() => {
    if (!challenge) return;

    const updateTimeRemaining = () => {
      // Usar endDate diretamente como Date e combinar com endTime
      const endDateTime = new Date(challenge.endDate);
      
      // Se temos endTime, ajustar a hora
      if (challenge.endTime) {
        const [hour, minute] = challenge.endTime.split(':').map(Number);
        endDateTime.setHours(hour, minute, 0, 0);
      }
      
      const now = new Date();
      const timeRemaining = endDateTime.getTime() - now.getTime();
      
      if (timeRemaining <= 0) {
        setTimeRemainingText('Tempo esgotado');
        return;
      }
      
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      const parts = [];
      if (days > 0) parts.push(`${days} dia${days !== 1 ? 's' : ''}`);
      if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);
      
      setTimeRemainingText(parts.length > 0 ? parts.join(', ') : '0 minutos');
    };

    // Atualizar imediatamente
    updateTimeRemaining();
    
    // Atualizar a cada minuto
    const interval = setInterval(updateTimeRemaining, 60000);
    
    return () => clearInterval(interval);
  }, [challenge]);

  // Effect para buscar preço atual quando o símbolo mudar
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${selectedSymbol}`);
        const data = await response.json();
        if (data.price) {
          setCurrentPrice(parseFloat(data.price));
        }
      } catch (error) {
        console.error('Erro ao buscar preço atual:', error);
        // Fallback: usar preço padrão baseado no símbolo
        const fallbackPrices: { [key: string]: number } = {
          'BTCUSDT': 50000,
          'ETHUSDT': 3000,
          'BNBUSDT': 400,
          'ADAUSDT': 0.5,
          'SOLUSDT': 100,
          'XRPUSDT': 0.6,
          'DOTUSDT': 8,
          'LINKUSDT': 15,
          'LTCUSDT': 100,
          'AVAXUSDT': 40,
        };
        
        setCurrentPrice(fallbackPrices[selectedSymbol] || 100);
      }
    };

    fetchCurrentPrice();
    
    // Atualizar preço a cada 5 segundos
    const interval = setInterval(fetchCurrentPrice, 5000);
    
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const loadChallengeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados do desafio
      const challenges = await challengeAPI.getUserChallenges(currentUserId);
      const currentChallenge = challenges.find(c => c.id === challengeId);

      if (!currentChallenge) {
        setError('Desafio não encontrado');
        return;
      }

      // Verificar se o usuário é participante
      const isParticipant = currentChallenge.challenger.id === currentUserId || 
                           currentChallenge.challenged.id === currentUserId;

      if (!isParticipant) {
        setError('Você não é participante deste desafio');
        return;
      }

      // Verificar se o desafio está ativo
      if (currentChallenge.status !== 'active') {
        setError('Este desafio não está mais ativo');
        return;
      }

      setChallenge(currentChallenge);

      // Buscar trades específicos do desafio
      try {
        if (challengeId) {
          const trades = await challengeAPI.getChallengeTrades(challengeId);
          setChallengeTrades(trades);
        }
      } catch (tradesError) {
        console.error('Erro ao carregar trades do desafio:', tradesError);
        setChallengeTrades([]);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do desafio:', error);
      setError('Erro ao carregar dados do desafio');
    } finally {
      setLoading(false);
    }
  };

  const handleTradeExecuted = async (orderData: any) => {
    if (!challenge) return;

    try {
      console.log('Dados recebidos do OrderForm:', orderData);
      
      // Usar o preço de execução correto (filledPrice para ordens executadas, senão price)
      const executedPrice = orderData.filledPrice || orderData.price || 0;
      const executedAmount = orderData.filledAmount || orderData.amount || 0;
      
      // Extrair dados relevantes do objeto order
      const tradeData = {
        symbol: orderData.symbol,
        side: orderData.side,
        quantity: parseFloat(executedAmount.toString()),
        price: parseFloat(executedPrice.toString()),
        timestamp: new Date().toISOString()
      };

      console.log('Dados formatados para o desafio:', tradeData);

      // Validar dados antes de enviar
      if (!tradeData.price || tradeData.price <= 0) {
        console.error('Preço inválido:', tradeData.price);
        setError('Erro: preço de execução inválido');
        return;
      }

      if (!tradeData.quantity || tradeData.quantity <= 0) {
        console.error('Quantidade inválida:', tradeData.quantity);
        setError('Erro: quantidade inválida');
        return;
      }

      // Adicionar trade ao desafio
      await challengeAPI.addManualTrade(challenge.id, currentUserId, tradeData);

      // Recarregar trades
      await loadChallengeData();
    } catch (error) {
      console.error('Erro ao registrar trade no desafio:', error);
      setError('Erro ao registrar trade no desafio');
    }
  };

  const handleFinishChallenge = async () => {
    if (!challenge) return;

    try {
      // Verificar se ainda há tempo restante
      const endDateTime = new Date(challenge.endDate);
      if (challenge.endTime) {
        const [hour, minute] = challenge.endTime.split(':').map(Number);
        endDateTime.setHours(hour, minute, 0, 0);
      }
      
      const now = new Date();
      const timeRemaining = endDateTime.getTime() - now.getTime();
      
      if (timeRemaining <= 0) {
        setError('O desafio já terminou');
        return;
      }

      // Confirmar com o usuário
      const confirmed = window.confirm(
        '⚠️ ATENÇÃO: Finalização Antecipada!\n\n' +
        'Se você finalizar o desafio agora (antes do tempo), você PERDERÁ automaticamente!\n\n' +
        'Tem certeza que deseja finalizar o desafio?\n\n' +
        '• Se SIM: Você perderá e seu oponente ganhará\n' +
        '• Se NÃO: O desafio continuará até o tempo acabar'
      );

      if (!confirmed) return;

      // Finalizar o desafio
      await challengeAPI.finalizeChallenge(challenge.id);
      
      // Recarregar dados do desafio
      await loadChallengeData();
      
    } catch (error) {
      console.error('Erro ao finalizar desafio:', error);
      setError('Erro ao finalizar desafio');
    }
  };

  const isChallenger = challenge?.challenger.id === currentUserId;
  const opponent = isChallenger ? challenge?.challenged : challenge?.challenger;
  const myTrades = challengeTrades.filter(trade => trade.user.id === currentUserId);
  const opponentTrades = challengeTrades.filter(trade => trade.user.id !== currentUserId);

  const myProfit = myTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const opponentProfit = opponentTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);

  const myReturn = challenge ? (myProfit / challenge.initialBalance) * 100 : 0;
  const opponentReturn = challenge ? (opponentProfit / challenge.initialBalance) * 100 : 0;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Carregando dados do desafio...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/home/challenge')}
        >
          Voltar aos Desafios
        </Button>
      </Box>
    );
  }

  if (!challenge) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Desafio não encontrado
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header do Desafio */}
      <Paper elevation={2} sx={{ p: 2, mb: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/home/challenge')}
            size="small"
          >
            Voltar
          </Button>
          
          <Typography variant="h5" sx={{ textAlign: 'center', flex: 1 }}>
            🎯 {challenge.title}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              icon={<EmojiEvents />}
              label={`${timeRemainingText}`}
              color="primary"
              variant="outlined"
            />
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={handleFinishChallenge}
              sx={{ 
                minWidth: 'auto',
                px: 2,
                py: 0.5,
                fontSize: '0.75rem'
              }}
            >
              Finalizar Desafio
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Meus Dados */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Você
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {isChallenger ? challenge.challenger.name : challenge.challenged.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Saldo: ${(challenge.initialBalance + myProfit).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Trades: {myTrades.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {myReturn >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                  <Typography 
                    variant="h6" 
                    color={myReturn >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {myReturn >= 0 ? '+' : ''}{myReturn.toFixed(2)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Dados do Desafio */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Desafio
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Aposta: ${challenge.betAmount}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Saldo Inicial: ${challenge.initialBalance}
                </Typography>
                <Typography variant="body2">
                  Total de Trades: {challengeTrades.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Dados do Oponente */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Oponente
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {opponent?.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Saldo: ${(challenge.initialBalance + opponentProfit).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Trades: {opponentTrades.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {opponentReturn >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                  <Typography 
                    variant="h6" 
                    color={opponentReturn >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {opponentReturn >= 0 ? '+' : ''}{opponentReturn.toFixed(2)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Indicador de Liderança */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          {myReturn > opponentReturn ? (
            <Chip icon={<TrendingUp />} label="Você está na frente!" color="success" />
          ) : myReturn < opponentReturn ? (
            <Chip icon={<TrendingDown />} label="Você está atrás" color="error" />
          ) : (
            <Chip label="Empate!" color="default" />
          )}
        </Box>

        {/* Alerta sobre finalização antecipada */}
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>⚠️ Atenção:</strong> Se você finalizar o desafio antes do tempo, perderá automaticamente! 
            Use o botão "Finalizar Desafio" apenas quando estiver confiante no resultado ou quando o tempo estiver acabando.
          </Typography>
        </Alert>
      </Paper>

      {/* Interface de Trading */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Lado esquerdo: Seletor + Formulário */}
          <Grid item xs={12} md={3} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: 0
          }}>
            <Box sx={{ mb: 2, flexShrink: 0 }}>
              <SymbolSelector
                selectedSymbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
              />
            </Box>
            <Box sx={{ mb: 2, flexShrink: 0 }}>
              <MarketInfo symbol={selectedSymbol} />
            </Box>
            <Box sx={{ mb: 2, p: 1, bgcolor: 'info.light', borderRadius: 1, flexShrink: 0 }}>
              <Typography variant="body2" color="info.contrastText" sx={{ textAlign: 'center' }}>
                💰 Preço Atual: ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </Typography>
            </Box>
            <Box>
              <OrderForm
                symbol={selectedSymbol}
                currentPrice={currentPrice}
                operationMode="simulated"
                onOrderCreated={handleTradeExecuted}
                challengeMode={true}
                challengeId={challengeId}
              />
            </Box>
          </Grid>

          {/* Centro: Gráfico */}
          <Grid item xs={12} md={6}>
            <PriceChart
              symbol={selectedSymbol}
              positions={[]} // Sem posições normais no modo desafio
              isLoadingPositions={false}
            />
          </Grid>

          {/* Lado direito: Trades do Desafio */}
          <Grid item xs={12} md={3}>
            <Paper elevation={2} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                📊 Trades do Desafio
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {challengeTrades.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                  Nenhum trade executado ainda
                </Typography>
              ) : (
                <Box>
                  {challengeTrades.map((trade, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2">
                            {trade.user.name === (isChallenger ? challenge.challenger.name : challenge.challenged.name) ? 'Você' : trade.user.name}
                          </Typography>
                          <Chip
                            label={trade.side.toUpperCase()}
                            color={trade.side === 'buy' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {trade.symbol} • {trade.quantity} @ ${trade.price}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color={trade.profit >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {trade.profit >= 0 ? '+' : ''}${trade.profit?.toFixed(2) || '0.00'}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ChallengeTradingPage;