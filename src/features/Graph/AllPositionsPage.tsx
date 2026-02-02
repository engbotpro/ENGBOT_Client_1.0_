// src/components/AllPositionsPage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import PositionsPanel from './PositionsPanel';
import { type Position } from '../../services/tradingAPI';

const AllPositionsPage: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');

  // Carregar todas as posições
  const loadAllPositions = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      console.log('🔄 Carregando todas as posições...');
      
      // Buscar todos os trades abertos do usuário
      const response = await fetch('http://localhost:5000/api/trades', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const tradesData = await response.json();
        console.log('📊 Todos os trades:', tradesData.data);
        
        // Filtrar apenas trades abertos (posições ativas)
        // Todos os trades abertos devem aparecer como posições, mesmo sem TP/SL
        const openTrades = tradesData.data?.filter((trade: any) => 
          trade.status === 'open' && 
          trade.environment === 'simulated'
        ) || [];
        
        console.log(`📊 Encontrados ${openTrades.length} trades abertos:`, openTrades);
        
        // Converter trades para posições
        const allPositions: Position[] = [];
        const positionMap = new Map<string, Position>();

        openTrades.forEach((trade: any) => {
          const existingPosition = positionMap.get(trade.symbol);
          
          if (existingPosition) {
            // Acumular posição existente
            const totalValue = (existingPosition.entryPrice * existingPosition.amount) + 
                              (trade.price * trade.quantity);
            const totalAmount = existingPosition.amount + trade.quantity;
            
            existingPosition.entryPrice = totalValue / totalAmount;
            existingPosition.amount = totalAmount;
            existingPosition.pnl += trade.pnl || 0;
            existingPosition.pnlPercent = (existingPosition.pnl / (existingPosition.entryPrice * existingPosition.amount)) * 100;
          } else {
            // Criar nova posição
            const position: Position = {
              symbol: trade.symbol,
              side: trade.side === 'buy' ? 'long' : 'short',
              entryPrice: trade.price,
              amount: trade.quantity,
              takeProfit: trade.takeProfit || undefined,
              stopLoss: trade.stopLoss || undefined,
              pnl: trade.pnl || 0,
              pnlPercent: trade.pnlPercent || 0
            };
            
            positionMap.set(trade.symbol, position);
            allPositions.push(position);
          }
        });

        console.log(`✅ Total de posições únicas: ${allPositions.length}`);
        setPositions(allPositions);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar posições:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar posições quando a página é montada
  useEffect(() => {
    loadAllPositions();
  }, [currentUserId]);

  const handleClosePosition = async (symbol: string) => {
    try {
      console.log(`🔄 Fechando posição: ${symbol}`);
      
      // Buscar todos os trades do símbolo
      const response = await fetch('http://localhost:5000/api/trades', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const tradesData = await response.json();
        const symbolTrades = tradesData.data?.filter((t: any) => 
          t.symbol === symbol && t.status === 'open'
        ) || [];
        
        // Fechar todos os trades do símbolo
        for (const trade of symbolTrades) {
          const updateResponse = await fetch(`http://localhost:5000/api/trades/${trade.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              status: 'closed',
              exitTime: new Date().toISOString(),
              exitPrice: trade.price, // Preço simulado
              pnl: trade.pnl || 0,
              pnlPercent: trade.pnlPercent || 0,
              fees: 0.1
            })
          });
          
          if (updateResponse.ok) {
            console.log(`✅ Trade ${trade.id} fechado com sucesso`);
          }
        }
        
        // Recarregar posições
        await loadAllPositions();
      }
    } catch (error) {
      console.error('Erro ao fechar posição:', error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Carregando todas as posições...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          flexShrink: 0,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/home/tradingPage')}
          sx={{ flexShrink: 0 }}
        >
          Voltar ao Trading
        </Button>
        
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            📊 Todas as Posições Ativas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todas as suas posições abertas em um só lugar
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          onClick={loadAllPositions}
          disabled={loading}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          {loading ? 'Carregando...' : 'Atualizar'}
        </Button>
      </Box>

      {/* Conteúdo */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {positions.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Typography variant="h5" color="text.secondary">
              Nenhuma posição ativa encontrada
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Você não possui posições abertas no momento.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/home/tradingPage')}
            >
              Ir para Trading
            </Button>
          </Box>
        ) : (
          <PositionsPanel
            positions={positions}
            onClosePosition={handleClosePosition}
          />
        )}
      </Box>
    </Box>
  );
};

export default AllPositionsPage; 